import React, { useEffect, useMemo, useState } from 'react';
import {
  FileDown, FileSpreadsheet, Filter, Search,
  DownloadCloud, Calendar, FileBarChart2
} from 'lucide-react';
import axios from 'axios';
import './ReportsTab.css';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const API_BASE = 'http://localhost:5055';

// Excel theme colours
const XL = {
  NAVY_DARK  : 'FF0B1120',
  NAVY       : 'FF1e3a5f',
  NAVY_MID   : 'FF1a3259',
  ORANGE     : 'FFff6b00',
  WHITE      : 'FFFFFFFF',
  GRAY_LIGHT : 'FFF8FAFC',
  GRAY_ALT   : 'FFf1f5f9',
  GREEN_BG   : 'FFf0fdf4',
  GREEN_FG   : 'FF15803d',
  AMBER_BG   : 'FFfffbeb',
  AMBER_FG   : 'FFb45309',
  RED_BG     : 'FFfef2f2',
  RED_FG     : 'FFb91c1c',
  SCORE_GRN  : 'FF10b981',
  SCORE_AMB  : 'FFf59e0b',
  SCORE_RED  : 'FFef4444',
};

/* ══════════════════════════════════════════════════════════
   PURE HELPERS  (no JSX, no hooks)
══════════════════════════════════════════════════════════ */

/** Build initials avatar text from a full name */
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

/** Safely coerce to non-empty string */
const safe = (v, fb = '-') => String(v ?? '').trim() || fb;

/** HTML-escape a value */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Normalise display status label */
const toDisplayStatus = (value) =>
  value === 'Completed' ? 'Complete' : value || '-';

/** Try multiple date candidates and return first valid Date */
const getValidDate = (...values) => {
  for (const v of values) {
    if (!v) continue;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

/** Score → colour (green / amber / red) */
const scoreColor = (pct) =>
  pct >= 75 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

/** Status → { bg, fg, bd } colour set */
const statusColors = (rawStatus) =>
  rawStatus === 'Complete'
    ? { bg: '#f0fdf4', fg: '#15803d', bd: '#bbf7d0' }
    : rawStatus === 'Pending'
    ? { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' }
    : { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' };

/* ── Excel cell builder ─────────────────────────────────── */
const xlCell = (v, style) => {
  const cell = { v, t: typeof v === 'number' ? 'n' : 's' };
  if (style) cell.s = style;
  return cell;
};

/* ── Excel border spec ──────────────────────────────────── */
const xlBorder = (color = '000000') => ({
  top:    { style: 'thin', color: { rgb: color } },
  bottom: { style: 'thin', color: { rgb: color } },
  left:   { style: 'thin', color: { rgb: color } },
  right:  { style: 'thin', color: { rgb: color } },
});

/* ── Excel style factories ──────────────────────────────── */
const xlStyles = {
  title: () => ({
    font:      { name: 'Calibri', sz: 18, bold: true, color: { rgb: XL.WHITE } },
    fill:      { fgColor: { rgb: XL.NAVY_DARK }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border:    xlBorder('1e2d42'),
  }),
  subtitle: () => ({
    font:      { name: 'Calibri', sz: 12, bold: true, color: { rgb: XL.WHITE } },
    fill:      { fgColor: { rgb: XL.NAVY }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    xlBorder('1e2d42'),
  }),
  metaLabel: () => ({
    font:      { name: 'Calibri', sz: 10, bold: true, color: { rgb: XL.WHITE } },
    fill:      { fgColor: { rgb: XL.NAVY_MID }, patternType: 'solid' },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    xlBorder('1e2d42'),
  }),
  header: () => ({
    font:      { name: 'Calibri', sz: 10, bold: true, color: { rgb: XL.WHITE } },
    fill:      { fgColor: { rgb: XL.NAVY }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border:    xlBorder('1e2d42'),
  }),
  cell: (shade) => ({
    font:      { name: 'Calibri', sz: 10, color: { rgb: 'FF1e293b' } },
    fill:      { fgColor: { rgb: shade ? XL.GRAY_ALT : XL.WHITE }, patternType: 'solid' },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border:    xlBorder('e2e8f0'),
  }),
  cellCenter: (shade) => ({
    font:      { name: 'Calibri', sz: 10, color: { rgb: 'FF1e293b' } },
    fill:      { fgColor: { rgb: shade ? XL.GRAY_ALT : XL.WHITE }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    xlBorder('e2e8f0'),
  }),
  statusCell: (rawStatus, shade) => {
    const map = {
      Complete: { fgColor: { rgb: 'FFdcfce7' }, fontRgb: XL.GREEN_FG },
      Pending:  { fgColor: { rgb: 'FFfef9c3' }, fontRgb: XL.AMBER_FG },
    };
    const m = map[rawStatus] || { fgColor: { rgb: 'FFffe4e6' }, fontRgb: XL.RED_FG };
    return {
      font:      { name: 'Calibri', sz: 10, bold: true, color: { rgb: m.fontRgb } },
      fill:      { fgColor: m.fgColor, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    xlBorder('e2e8f0'),
    };
  },
  scoreCell: (pct, shade) => {
    const rgb = pct >= 75 ? XL.SCORE_GRN : pct >= 40 ? XL.SCORE_AMB : XL.SCORE_RED;
    return {
      font:      { name: 'Calibri', sz: 10, bold: true, color: { rgb } },
      fill:      { fgColor: { rgb: shade ? XL.GRAY_ALT : XL.WHITE }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    xlBorder('e2e8f0'),
    };
  },
};

/* ══════════════════════════════════════════════════════════
   SKELETON ROWS
══════════════════════════════════════════════════════════ */
const SkeletonRows = () =>
  Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="skeleton-row">
      {[35, 22, 15, 18, 10, 7].map((w, j) => (
        <td key={j}>
          <div className="skeleton-cell" style={{ width: `${w + Math.random() * 10}%` }} />
        </td>
      ))}
    </tr>
  ));

/* ══════════════════════════════════════════════════════════
   PDF HELPERS  (HTML string builders)
══════════════════════════════════════════════════════════ */

/** Build one <tr> for the total-report PDF table */
const buildPdfTableRow = (r, i) => {
  const scoreVal = Number(r.scoreValue) || 0;
  const scoreMax = Number(r.totalMarks) || 100;
  const scorePct = Math.min(100, Math.round((scoreVal / scoreMax) * 100));
  const bar      = scoreColor(scorePct);
  const rawStatus = toDisplayStatus(r.status);
  const sc       = statusColors(rawStatus);
  const typeBg   = (r.type || '').toUpperCase() === 'MCQ'
    ? 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;'
    : 'background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;';

  return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
    <td style="text-align:center;color:#94a3b8;font-size:8pt;font-weight:700;">${i + 1}</td>
    <td style="font-weight:700;color:#1e293b;font-size:8.5pt;">${esc(safe(r.name, 'Student'))}</td>
    <td style="color:#475569;font-size:8pt;word-break:break-all;">${esc(safe(r.email))}</td>
    <td style="color:#475569;font-size:8pt;">${esc(safe(r.batchName))}</td>
    <td style="font-weight:600;color:#1e293b;font-size:8pt;word-break:break-word;">${esc(safe(r.assignment))}</td>
    <td style="text-align:center;">
      <span style="display:inline-block;padding:1px 5px;border-radius:20px;font-size:8pt;font-weight:800;letter-spacing:.3px;${typeBg}">${esc(safe(r.type))}</span>
    </td>
    <td style="color:#64748b;font-size:8pt;white-space:nowrap;">${esc(safe(r.startDateText))}</td>
    <td style="color:#64748b;font-size:8pt;white-space:nowrap;">${esc(safe(r.dueDateText))}</td>
    <td style="color:#64748b;font-size:8pt;white-space:nowrap;">${esc(safe(r.dateText))}</td>
    <td>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-weight:800;font-size:8pt;color:${bar};">${esc(safe(r.scoreText))}</span>
        <div style="height:3px;border-radius:4px;background:#e2e8f0;overflow:hidden;print-color-adjust:exact;-webkit-print-color-adjust:exact;">
          <div style="height:100%;width:${scorePct}%;background:${bar};border-radius:4px;print-color-adjust:exact;-webkit-print-color-adjust:exact;"></div>
        </div>
      </div>
    </td>
    <td style="text-align:center;">
      <span style="display:inline-block;padding:2px 6px;border-radius:20px;font-size:8pt;font-weight:700;
        background:${sc.bg};color:${sc.fg};border:1px solid ${sc.bd};
        print-color-adjust:exact;-webkit-print-color-adjust:exact;">${rawStatus}</span>
    </td>
  </tr>`;
};

/** Total report PDF print CSS (A4 portrait, no horizontal overflow) */
const TOTAL_PRINT_CSS = `
@page { size: A4 portrait; margin: 10mm 8mm; }
@media print {
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    width: 210mm;
    margin: 0; padding: 0;
    background: #fff !important;
    font-size: 9pt;
    overflow: hidden !important;
  }
  body { animation: none !important; }
  .page { max-width: 100%; width: 100%; overflow: hidden; }
  .brand-bar { margin-bottom: 6px; }
  .hero { border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; box-shadow: none; }
  .hero::before { display: none; }
  .hstat { backdrop-filter: none; }
  .table-card { box-shadow: none; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .table-scroll { overflow: visible !important; overflow-x: visible !important; }
  table {
    table-layout: fixed;
    width: 100% !important;
    max-width: 100% !important;
    font-size: 8pt;
    border-collapse: collapse;
  }
  thead th { padding: 5px 4px; font-size: 8pt; }
  tbody td {
    padding: 4px;
    font-size: 8.5pt;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }
  th:nth-child(1),  td:nth-child(1)  { width: 24px; }
  th:nth-child(2),  td:nth-child(2)  { width: 78px; }
  th:nth-child(3),  td:nth-child(3)  { width: 110px; }
  th:nth-child(4),  td:nth-child(4)  { width: 68px; }
  th:nth-child(5),  td:nth-child(5)  { width: 86px; }
  th:nth-child(6),  td:nth-child(6)  { width: 40px; }
  th:nth-child(7),  td:nth-child(7),
  th:nth-child(8),  td:nth-child(8),
  th:nth-child(9),  td:nth-child(9)  { width: 54px; }
  th:nth-child(10), td:nth-child(10) { width: 62px; }
  th:nth-child(11), td:nth-child(11) { width: 54px; }
  .action-bar, .btn-print { display: none !important; }
  .report-footer { margin-top: 8px; font-size: 8pt; }
}`;

/** Individual student report print CSS */
const STUDENT_PRINT_CSS = `
@page { size: A4 portrait; margin: 10mm 8mm; }
@media print {
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    width: 210mm;
    margin: 0; padding: 0;
    background: #fff !important;
    overflow: hidden !important;
  }
  body { animation: none !important; padding: 0 !important; }
  .page { max-width: 100%; width: 100%; }
  .brand-bar { margin-bottom: 8px; }
  .header-card {
    background: #0f1f3a !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    box-shadow: none; border-radius: 10px; padding: 14px 18px;
  }
  .header-card::before, .header-card::after { display: none; }
  .stat-pill { backdrop-filter: none; }
  .print-btn { display: none !important; }
  .table-container { box-shadow: none; border: 1px solid #e2e8f0; border-radius: 6px; }
  .table-scroll { overflow: visible !important; overflow-x: visible !important; }
  table {
    table-layout: fixed;
    width: 100% !important;
    min-width: 0 !important;
    font-size: 8pt;
    border-collapse: collapse;
  }
  thead th { padding: 6px 8px; font-size: 8pt; white-space: normal; }
  tbody td {
    padding: 5px 8px; font-size: 8.5pt;
    word-break: break-word; overflow-wrap: break-word; white-space: normal;
  }
  .score-wrap { gap: 2px; }
  .score-bar-bg { height: 3px; }
  .status-badge, .type-badge, .hbadge, .score-bar-fill {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  tbody tr:hover { background: inherit !important; }
  @keyframes barGrow { from { width: 0 !important; } }
}`;

/* ══════════════════════════════════════════════════════════
   SHARED FONT LINK  (reused in both popup windows)
══════════════════════════════════════════════════════════ */
const FONT_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>`;

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const ReportsTab = () => {
  const [reportData,      setReportData]      = useState([]);
  const [students,        setStudents]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [dateFilter,      setDateFilter]      = useState('7');
  const [batchFilter,     setBatchFilter]     = useState('all');
  const [monthFilter,     setMonthFilter]     = useState('all');
  const [exportingPdf,    setExportingPdf]    = useState(false);
  const [exportingExcel,  setExportingExcel]  = useState(false);
  const [toast,           setToast]           = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [showHeatmap,          setShowHeatmap]          = useState(false);
  const [selectedStudents,      setSelectedStudents]      = useState([]);
  const [reminderModal,         setReminderModal]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── shared export date label ─────────────────────────── */
  const exportDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ══════════════════════════════════════════════════════
     FETCH DATA
  ══════════════════════════════════════════════════════ */
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [studentsRes, submissionsRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/auth/students`),
          axios.get(`${API_BASE}/api/assignments/submissions/all`),
        ]);

        const students =
          studentsRes.status === 'fulfilled'
            ? (
              Array.isArray(studentsRes.value?.data)                   ? studentsRes.value.data :
              Array.isArray(studentsRes.value?.data?.students)         ? studentsRes.value.data.students :
              Array.isArray(studentsRes.value?.data?.users)            ? studentsRes.value.data.users :
              Array.isArray(studentsRes.value?.data?.data)             ? studentsRes.value.data.data :
              []
            )
            : [];

        setStudents(students);

        const submissions =
          submissionsRes.status === 'fulfilled' && Array.isArray(submissionsRes.value?.data)
            ? submissionsRes.value.data
            : [];

        const norm    = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
        const compact = (v) => norm(v).replace(/\s+/g, '');
        const getId   = (v) => {
          if (!v) return '';
          if (typeof v === 'string') return v;
          if (typeof v === 'object') return String(v._id || v.id || v.$oid || '');
          return String(v);
        };
        const toKey = (name, batch) => `${norm(name)}|${norm(batch)}`;

        const byId       = new Map(students.map((s) => [String(s._id), s]));
        const byNameBatch= new Map(students.map((s) => [toKey(s.name, s.batchId?.batchName || ''), s]));
        const byName     = new Map(students.map((s) => [norm(s.name), s]));
        const byCompact  = new Map(students.map((s) => [compact(s.name), s]));

        const rows = submissions.map((sub) => {
          const sid      = getId(sub.studentId);
          const fallback =
            byNameBatch.get(toKey(sub.studentName, sub.batchName)) ||
            byNameBatch.get(toKey(sub.studentName, '')) ||
            byName.get(norm(sub.studentName)) ||
            byCompact.get(compact(sub.studentName));
          const student  = byId.get(sid) || fallback;

          const aTitle     = sub.assignmentId?.title || 'Assignment';
          const aStart     = getValidDate(sub.assignmentId?.startDate);
          const aDue       = getValidDate(sub.assignmentId?.lastDate, sub.assignmentId?.dueDate);
          const totalMarks = Number(sub.assignmentId?.totalMarks) || 100;
          const scoreValue = Number(sub.score) || 0;
          const safeDate   = getValidDate(sub.submittedAt, sub.submissionDate, sub.date, sub.createdAt, sub.updatedAt) || new Date();
          const fmt        = (d) => d?.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

          return {
            id:           sub._id,
            studentId:    sid,
            name:         sub.studentName || student?.name || 'Student',
            email:        student?.email || sub.studentEmail || sub.userEmail || sub.email || '-',
            batchName:    sub.batchName || student?.batchId?.batchName || '-',
            assignment:   aTitle,
            type:         (sub.assignmentId?.type || 'practical').toUpperCase(),
            startDateText: aStart ? fmt(aStart) : '-',
            dueDateText:  aDue   ? fmt(aDue)   : '-',
            date:         safeDate,
            dateText:     fmt(safeDate),
            scoreValue,
            totalMarks,
            scoreText:    `${scoreValue}/${totalMarks}`,
            status:       sub.status === 'graded' ? 'Completed' : 'Pending',
          };
        });

        setReportData(rows);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  /* ══════════════════════════════════════════════════════
     DERIVED DATA
  ══════════════════════════════════════════════════════ */
  const batchOptions = useMemo(() => [
    ...new Set(reportData.map((r) => String(r.batchName || '').trim()).filter(Boolean)),
  ], [reportData]);

  const filteredStudentsForReport = useMemo(() => {
    return students.filter((student) => {
      const studentBatchName = student.batchId?.batchName || student.batchName || '-';
      if (batchFilter !== 'all' && studentBatchName !== batchFilter) return false;
      
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const nameMatch = (student.name || '').toLowerCase().includes(q);
        const emailMatch = (student.email || '').toLowerCase().includes(q);
        const batchMatch = (studentBatchName).toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !batchMatch) return false;
      }
      return true;
    });
  }, [students, batchFilter, searchTerm]);

  const monthOptions = useMemo(() => [
    ...new Set(reportData.map((r) => r.date?.toLocaleString('en-US', { month: 'long' })).filter(Boolean)),
  ], [reportData]);

  const filteredSubmissions = useMemo(() => {
    const now = new Date();
    return reportData.filter((row) => {
      const q = searchTerm.trim().toLowerCase();
      if (q &&
        !row.name.toLowerCase().includes(q) &&
        !row.assignment.toLowerCase().includes(q) &&
        !row.batchName.toLowerCase().includes(q) &&
        !row.email.toLowerCase().includes(q)) return false;
      if (batchFilter !== 'all' && row.batchName !== batchFilter) return false;
      const rowMonth = row.date?.toLocaleString('en-US', { month: 'long' }) || '';
      if (monthFilter !== 'all' && rowMonth !== monthFilter) return false;
      if (dateFilter === 'all') return true;
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - Number(dateFilter));
      return row.date >= cutoff;
    });
  }, [reportData, searchTerm, dateFilter, batchFilter, monthFilter]);

  const filteredData = useMemo(() => {
    const grouped = new Map();
    const hasEmail = (v) => { const t = String(v ?? '').trim(); return t !== '' && t !== '-'; };

    filteredSubmissions.forEach((row) => {
      const key = row.studentId
        ? String(row.studentId)
        : `${String(row.name || '').trim().toLowerCase()}|${String(row.batchName || '').trim().toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key, studentId: row.studentId,
          name: row.name, email: row.email, batchName: row.batchName,
          latestDate: row.date, completedCount: 0, pendingCount: 0,
          totalScore: 0, totalMarks: 0, reports: [],
        });
      }
      const s = grouped.get(key);
      s.reports.push(row);
      if (row.date > s.latestDate) s.latestDate = row.date;
      s.totalScore += row.scoreValue;
      s.totalMarks += row.totalMarks;
      if (!hasEmail(s.email) && hasEmail(row.email)) s.email = row.email;
      row.status === 'Completed' ? (s.completedCount += 1) : (s.pendingCount += 1);
    });

    return Array.from(grouped.values())
      .map((s) => {
        const avgPercent = s.totalMarks > 0 ? (s.totalScore / s.totalMarks) * 100 : 0;
        const isAtRisk = avgPercent < 50 || s.pendingCount >= 2;
        const isEligibleForCertificate = s.completedCount > 0 && s.pendingCount === 0 && avgPercent >= 50;

        return {
          ...s,
          reportCount:    s.reports.length,
          avgPercent,
          avgScoreText:   `${avgPercent.toFixed(1)}%`,
          latestDateText: s.latestDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: s.pendingCount === 0 ? 'Completed' : 'Pending',
          isAtRisk,
          isEligibleForCertificate,
        };
      })
      .sort((a, b) => b.latestDate - a.latestDate);
  }, [filteredSubmissions]);

  const finalFilteredData = useMemo(() => {
    return filteredData.filter(student => {
      if (activeCategoryFilter === 'atRisk') return student.isAtRisk;
      if (activeCategoryFilter === 'eligible') return student.isEligibleForCertificate;
      return true;
    });
  }, [filteredData, activeCategoryFilter]);

  const gradeDistribution = useMemo(() => {
    let excellent = 0;
    let good = 0;
    let average = 0;
    let needsImprovement = 0;

    filteredData.forEach(student => {
      if (student.avgPercent >= 90) excellent++;
      else if (student.avgPercent >= 75) good++;
      else if (student.avgPercent >= 50) average++;
      else needsImprovement++;
    });

    const total = filteredData.length || 1;
    return {
      excellent: { count: excellent, pct: ((excellent / total) * 100).toFixed(0) },
      good: { count: good, pct: ((good / total) * 100).toFixed(0) },
      average: { count: average, pct: ((average / total) * 100).toFixed(0) },
      needsImprovement: { count: needsImprovement, pct: ((needsImprovement / total) * 100).toFixed(0) },
    };
  }, [filteredData]);

  const heatmapAssignments = useMemo(() => {
    return [...new Set(filteredSubmissions.map(s => s.assignment).filter(Boolean))];
  }, [filteredSubmissions]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(finalFilteredData.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const reportStats = useMemo(() => {
    const total     = filteredData.length;
    const completed = filteredData.filter((s) => s.status === 'Completed').length;
    const pending   = filteredData.filter((s) => s.status === 'Pending').length;
    const avgScore  = total > 0
      ? (filteredData.reduce((sum, s) => sum + s.avgPercent, 0) / total).toFixed(1)
      : '0.0';
    return { total, completed, pending, avgScore };
  }, [filteredData]);

  /* ══════════════════════════════════════════════════════
     EXPORT: STUDENT DIRECTORY PDF (New!)
  ══════════════════════════════════════════════════════ */
  const handleExportStudentDirectoryPdf = () => {
    if (filteredStudentsForReport.length === 0) {
      showToast('No student records to export.', 'error');
      return;
    }
    
    try {
      const win = window.open('', '_blank');
      if (!win) {
        showToast('Popup blocked. Allow popups and try again.', 'error');
        return;
      }

      const selectedBatchName = batchFilter === 'all' ? 'All Batches' : batchFilter;
      const totalStudents = filteredStudentsForReport.length;

      const tableRows = filteredStudentsForReport.map((student, i) => {
        const batchName = student.batchId?.batchName || student.batchName || '-';
        const joinedDate = student.createdAt 
          ? new Date(student.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-';

        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="text-align:center;color:#94a3b8;font-size:8.5pt;font-weight:700;padding:10px 8px;">${i + 1}</td>
          <td style="font-weight:700;color:#1e293b;font-size:9pt;padding:10px 8px;">${esc(safe(student.name, 'Student'))}</td>
          <td style="color:#475569;font-size:8.5pt;padding:10px 8px;word-break:break-all;">${esc(safe(student.email))}</td>
          <td style="color:#475569;font-size:8.5pt;padding:10px 8px;">${esc(safe(batchName))}</td>
          <td style="color:#64748b;font-size:8.5pt;padding:10px 8px;text-align:center;">${esc(safe(joinedDate))}</td>
          <td style="text-align:center;padding:10px 8px;">
            <span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:8pt;font-weight:700;
              background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;
              print-color-adjust:exact;-webkit-print-color-adjust:exact;">Active</span>
          </td>
        </tr>`;
      }).join('');

      win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Student Directory Report — Netwisdome</title>
  ${FONT_LINK}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Manrope', sans-serif;
      background: #f0f4f8;
      color: #0f172a;
      padding: 28px 24px 56px;
    }
    .page { max-width: 900px; margin: 0 auto; }

    /* Brand bar */
    .brand-bar { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
    .brand-logo {
      width:32px; height:32px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#1e3a5f 0%,#ff6b00 100%);
      display:flex; align-items:center; justify-content:center;
      font-family:'Sora',sans-serif; font-size:12px; font-weight:800; color:#fff;
    }
    .brand-name {
      font-family:'Sora',sans-serif; font-size:15px; font-weight:800;
      background:linear-gradient(100deg,#1e3a5f 0%,#ff6b00 110%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .brand-sub { margin-left:auto; font-size:11px; font-weight:600; color:#64748b; }

    /* Hero */
    .hero {
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 60%,#0b2a4a 100%);
      border-radius:16px; padding:24px 28px; margin-bottom:16px;
      box-shadow:0 6px 24px rgba(15,31,58,.25); position:relative; overflow:hidden;
    }
    .hero::before {
      content:''; position:absolute; top:-50px; right:-50px;
      width:200px; height:200px; border-radius:50%;
      background:radial-gradient(circle,rgba(255,107,0,.18) 0%,transparent 70%);
    }
    .hero-inner { display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1; }
    .hero-left h1 { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:-.3px; margin-bottom:5px; }
    .hero-left p  { font-size:12px; color:rgba(255,255,255,.5); font-weight:500; }
    
    .hero-stats { display:flex; gap:10px; }
    .hstat {
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      border-radius:11px; padding:12px 20px; text-align:center; min-width:100px; backdrop-filter:blur(6px);
    }
    .hstat-val { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#fff; line-height:1; }
    .hstat-lbl { font-size:10px; font-weight:600; color:rgba(255,255,255,.40); margin-top:4px; }

    /* Table card */
    .table-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 3px 14px rgba(2,6,23,.07); }
    .table-header-bar { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9; }
    .table-header-bar h2 { font-family:'Sora',sans-serif; font-size:14px; font-weight:800; color:#0f172a; }
    .table-header-bar span { font-size:11px; color:#94a3b8; font-weight:600; }

    /* Table */
    table { border-collapse:collapse; width:100%; }
    thead tr { background:linear-gradient(90deg,#0f1f3a 0%,#1a3259 100%); }
    thead th {
      font-family:'Sora',sans-serif; font-size:9.5pt; font-weight:700;
      color:rgba(255,255,255,.8); text-transform:uppercase; letter-spacing:.5px;
      padding:12px 10px; text-align:left;
    }
    tbody tr { border-bottom:1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom:none; }
    tbody td { padding:10px; font-size:13px; color:#334155; vertical-align:middle; }

    /* Column widths */
    th:nth-child(1), td:nth-child(1) { width: 50px; text-align:center; }
    th:nth-child(2), td:nth-child(2) { width: 220px; }
    th:nth-child(3), td:nth-child(3) { width: 260px; }
    th:nth-child(4), td:nth-child(4) { width: 200px; }
    th:nth-child(5), td:nth-child(5) { width: 130px; text-align:center; }
    th:nth-child(6), td:nth-child(6) { width: 100px; text-align:center; }

    /* Actions */
    .action-bar { display:flex; gap:10px; justify-content:flex-end; padding:12px 24px 0; }
    .btn-print {
      display:inline-flex; align-items:center; gap:6px;
      padding:8px 20px; border-radius:8px;
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 100%);
      color:#fff; font-size:13px; font-weight:700; border:none; cursor:pointer;
      font-family:'Manrope',sans-serif; box-shadow:0 3px 10px rgba(15,31,58,.20);
    }
    .report-footer { margin-top:20px; text-align:center; font-size:11px; color:#94a3b8; font-weight:500; }

    @media print {
      body { background: #fff !important; padding: 0; }
      .action-bar { display: none !important; }
      .table-card { box-shadow: none; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="brand-bar">
    <div class="brand-logo">N</div>
    <span class="brand-name">Netwisdome</span>
    <span class="brand-sub">Learning Management System</span>
  </div>

  <div class="hero">
    <div class="hero-inner">
      <div class="hero-left">
        <h1>Student Directory Report</h1>
        <p>Batch: ${esc(selectedBatchName)} &nbsp;·&nbsp; Generated: ${esc(exportDate)}</p>
      </div>
      <div class="hero-stats">
        <div class="hstat">
          <div class="hstat-val">${totalStudents}</div>
          <div class="hstat-lbl">Total Students</div>
        </div>
      </div>
    </div>
  </div>

  <div class="action-bar">
    <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <div class="table-card" style="margin-top: 15px;">
    <div class="table-header-bar">
      <h2>Student Roster</h2>
      <span>${totalStudents} active accounts</span>
    </div>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Name</th>
            <th>Email</th>
            <th>Batch</th>
            <th style="text-align:center;">Joined On</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:36px;color:#94a3b8;">No student records found.</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="report-footer">
    Netwisdome LMS &nbsp;·&nbsp; Batch Directory Report &nbsp;·&nbsp; ${esc(exportDate)}
  </div>
</div>
</body>
</html>`);
      win.document.close();
      win.focus();
      showToast('PDF report opened — use Print / Save as PDF');
    } catch (err) {
      console.error('PDF student directory export error:', err);
      showToast('PDF export failed. Please try again.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════
     EXPORT: STUDENT DIRECTORY EXCEL (New!)
  ══════════════════════════════════════════════════════ */
  const handleExportStudentDirectoryExcel = async () => {
    if (filteredStudentsForReport.length === 0) {
      showToast('No student records to export.', 'error');
      return;
    }

    try {
      const XLSX = await import('xlsx').catch(() => null);
      if (!XLSX) {
        showToast('xlsx package not found. Run: npm install xlsx', 'error');
        return;
      }

      const encode = XLSX.utils.encode_cell;
      const setCell = (ws, row, col, value, style) => {
        const addr = encode({ r: row, c: col });
        ws[addr] = xlCell(value, style);
      };

      const ws = {};
      const COLS = 6;
      let R = 0;

      const selectedBatchName = batchFilter === 'all' ? 'All Batches' : batchFilter;

      /* Row 0 — Main title (merged) */
      setCell(ws, R, 0, 'Netwisdome Learning Management System', xlStyles.title());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.title());
      R++;

      /* Row 1 — Sub-title */
      setCell(ws, R, 0, `Student Batch Directory - ${selectedBatchName}`, xlStyles.subtitle());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.subtitle());
      R++;

      /* Row 2 — Generated date */
      setCell(ws, R, 0, `Generated: ${exportDate} | Total Students: ${filteredStudentsForReport.length}`, xlStyles.metaLabel());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.metaLabel());
      R++;

      /* Row 3 — Spacer */
      for (let c = 0; c < COLS; c++) setCell(ws, R, c, '', { fill: { fgColor: { rgb: 'FFFFFFFF' }, patternType: 'solid' } });
      R++;

      /* Row 4 — Column headers */
      const headers = ['Sr No', 'Student Name', 'Email Address', 'Assigned Batch', 'Registration Date', 'Status'];
      headers.forEach((h, c) => setCell(ws, R, c, h, xlStyles.header()));
      const headerRow = R;
      R++;

      /* Rows 5+ — Data */
      filteredStudentsForReport.forEach((student, i) => {
        const shade = i % 2 === 1;
        const batchName = student.batchId?.batchName || student.batchName || '-';
        const joinedDate = student.createdAt 
          ? new Date(student.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-';

        setCell(ws, R, 0, i + 1, xlStyles.cellCenter(shade));
        setCell(ws, R, 1, safe(student.name, 'Student'), xlStyles.cell(shade));
        setCell(ws, R, 2, safe(student.email), xlStyles.cell(shade));
        setCell(ws, R, 3, safe(batchName), xlStyles.cell(shade));
        setCell(ws, R, 4, safe(joinedDate), xlStyles.cellCenter(shade));
        setCell(ws, R, 5, 'Active', xlStyles.cellCenter(shade));
        R++;
      });

      /* ws range */
      ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: R - 1, c: COLS - 1 })}`;

      /* Merges */
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
      ];

      /* Column widths */
      ws['!cols'] = [
        { wch: 8 },   // Sr No
        { wch: 28 },  // Student Name
        { wch: 34 },  // Email
        { wch: 26 },  // Batch
        { wch: 18 },  // Date
        { wch: 14 },  // Status
      ];

      /* Row heights */
      ws['!rows'] = Array.from({ length: R }, (_, i) => {
        if (i < 3) return { hpt: i === 0 ? 32 : 22 };
        if (i === headerRow) return { hpt: 24 };
        return { hpt: 18 };
      });

      /* Freeze pane on header */
      ws['!freeze'] = { xSplit: 0, ySplit: headerRow + 1, topLeftCell: `A${headerRow + 2}`, activeCell: `A${headerRow + 2}`, sqref: `A${headerRow + 2}` };

      /* Auto-filter */
      ws['!autofilter'] = { ref: `A${headerRow + 1}:F${R}` };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Directory');

      const safeBatchName = selectedBatchName.replace(/[^a-zA-Z0-9]/g, '_');
      XLSX.writeFile(wb, `Student_Directory_${safeBatchName}.xlsx`);
      showToast('Excel report downloaded successfully!');
    } catch (err) {
      console.error('Excel student directory export error:', err);
      showToast('Excel export failed. Please try again.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════
     EXPORT: TOTAL REPORT PDF
  ══════════════════════════════════════════════════════ */
  const handleExportPdf = async () => {
    if (exportingPdf || filteredSubmissions.length === 0) return;
    setExportingPdf(true);
    try {
      const win = window.open('', '_blank');
      if (!win) { showToast('Popup blocked. Allow popups and try again.', 'error'); return; }

      const { total, completed, pending, avgScore } = reportStats;
      const tableRows = filteredSubmissions.map((r, i) => buildPdfTableRow(r, i)).join('');

      win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Student Performance Report — Netwisdome</title>
  ${FONT_LINK}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Manrope', sans-serif;
      background: #f0f4f8;
      color: #0f172a;
      padding: 28px 24px 56px;
    }
    .page { max-width: 1080px; margin: 0 auto; }

    /* Brand bar */
    .brand-bar { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
    .brand-logo {
      width:32px; height:32px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#1e3a5f 0%,#ff6b00 100%);
      display:flex; align-items:center; justify-content:center;
      font-family:'Sora',sans-serif; font-size:12px; font-weight:800; color:#fff;
    }
    .brand-name {
      font-family:'Sora',sans-serif; font-size:15px; font-weight:800;
      background:linear-gradient(100deg,#1e3a5f 0%,#ff6b00 110%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .brand-sub { margin-left:auto; font-size:11px; font-weight:600; color:#64748b; }

    /* Hero */
    .hero {
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 60%,#0b2a4a 100%);
      border-radius:16px; padding:24px 28px; margin-bottom:16px;
      box-shadow:0 6px 24px rgba(15,31,58,.25); position:relative; overflow:hidden;
    }
    .hero::before {
      content:''; position:absolute; top:-50px; right:-50px;
      width:200px; height:200px; border-radius:50%;
      background:radial-gradient(circle,rgba(255,107,0,.18) 0%,transparent 70%);
    }
    .hero-inner { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap; position:relative; z-index:1; }
    .hero-left h1 { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#fff; letter-spacing:-.3px; margin-bottom:5px; }
    .hero-left p  { font-size:12px; color:rgba(255,255,255,.5); font-weight:500; margin-bottom:12px; }
    .hero-badges  { display:flex; flex-wrap:wrap; gap:7px; }
    .hbadge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; border:1.5px solid; }
    .hbadge-total { background:rgba(255,255,255,.10); border-color:rgba(255,255,255,.18); color:#fff; }
    .hbadge-ok    { background:rgba(16,185,129,.15);  border-color:rgba(16,185,129,.28);  color:#6ee7b7; }
    .hbadge-pend  { background:rgba(245,158,11,.15);  border-color:rgba(245,158,11,.28);  color:#fcd34d; }
    .hero-stats   { display:flex; gap:10px; flex-wrap:wrap; }
    .hstat {
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      border-radius:11px; padding:9px 16px; text-align:center; min-width:86px; backdrop-filter:blur(6px);
    }
    .hstat-val { font-family:'Sora',sans-serif; font-size:19px; font-weight:800; color:#fff; line-height:1; }
    .hstat-val span { font-size:10px; font-weight:600; color:rgba(255,255,255,.45); }
    .hstat-lbl { font-size:9px; font-weight:600; color:rgba(255,255,255,.40); margin-top:2px; }

    /* Stat row */
    .stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
    .stat-box {
      background:#fff; border:1px solid #e2e8f0; border-radius:10px;
      padding:12px 14px; display:flex; flex-direction:column; gap:4px;
    }
    .stat-box-label { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
    .stat-box-value { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#0f172a; line-height:1; }
    .stat-box.st-green  { border-color:#bbf7d0; background:#f0fdf4; }
    .stat-box.st-amber  { border-color:#fde68a; background:#fffbeb; }
    .stat-box.st-blue   { border-color:#bfdbfe; background:#eff6ff; }
    .stat-box.st-green  .stat-box-value { color:#15803d; }
    .stat-box.st-amber  .stat-box-value { color:#b45309; }
    .stat-box.st-blue   .stat-box-value { color:#1d4ed8; }

    /* Table card */
    .table-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 3px 14px rgba(2,6,23,.07); }
    .table-header-bar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px 10px; border-bottom:1px solid #f1f5f9; }
    .table-header-bar h2 { font-family:'Sora',sans-serif; font-size:13px; font-weight:800; color:#0f172a; }
    .table-header-bar span { font-size:11px; color:#94a3b8; font-weight:600; }

    /* Table */
    table { border-collapse:collapse; width:100%; table-layout:fixed; }
    thead tr { background:linear-gradient(90deg,#0f1f3a 0%,#1a3259 100%); }
    thead th {
      font-family:'Sora',sans-serif; font-size:9pt; font-weight:700;
      color:rgba(255,255,255,.75); text-transform:uppercase; letter-spacing:.5px;
      padding:10px 8px; text-align:left; white-space:nowrap;
    }
    tbody tr { border-bottom:1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom:none; }
    tbody td { padding:9px 8px; font-size:12px; color:#334155; vertical-align:middle;
      word-break:break-word; overflow-wrap:break-word; white-space:normal; }

    /* Explicit column widths (matching print media query proportions) */
    th:nth-child(1),  td:nth-child(1)  { width:32px; text-align:center; }
    th:nth-child(2),  td:nth-child(2)  { width:95px; }
    th:nth-child(3),  td:nth-child(3)  { width:130px; }
    th:nth-child(4),  td:nth-child(4)  { width:85px; }
    th:nth-child(5),  td:nth-child(5)  { width:105px; }
    th:nth-child(6),  td:nth-child(6)  { width:60px; text-align:center; }
    th:nth-child(7),  td:nth-child(7),
    th:nth-child(8),  td:nth-child(8),
    th:nth-child(9),  td:nth-child(9)  { width:65px; }
    th:nth-child(10), td:nth-child(10) { width:80px; }
    th:nth-child(11), td:nth-child(11) { width:70px; text-align:center; }

    /* Actions */
    .action-bar { display:flex; gap:10px; justify-content:flex-end; padding:12px 18px 0; }
    .btn-print {
      display:inline-flex; align-items:center; gap:6px;
      padding:7px 18px; border-radius:8px;
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 100%);
      color:#fff; font-size:12px; font-weight:700; border:none; cursor:pointer;
      font-family:'Manrope',sans-serif; box-shadow:0 3px 10px rgba(15,31,58,.20);
    }
    .report-footer { margin-top:18px; text-align:center; font-size:11px; color:#94a3b8; font-weight:500; }

    ${TOTAL_PRINT_CSS}
  </style>
</head>
<body>
<div class="page">
  <div class="brand-bar">
    <div class="brand-logo">N</div>
    <span class="brand-name">Netwisdome</span>
    <span class="brand-sub">Learning Management System</span>
  </div>

  <div class="hero">
    <div class="hero-inner">
      <div class="hero-left">
        <h1>Student Performance Report</h1>
        <p>Generated on ${esc(exportDate)} &nbsp;·&nbsp; Filtered view</p>
        <div class="hero-badges">
          <span class="hbadge hbadge-total">📋 ${filteredSubmissions.length} Submissions</span>
          <span class="hbadge hbadge-ok">✓ ${completed} Completed</span>
          ${pending > 0 ? `<span class="hbadge hbadge-pend">⏳ ${pending} Pending</span>` : ''}
        </div>
      </div>
      <div class="hero-stats">
        <div class="hstat">
          <div class="hstat-val">${total}</div>
          <div class="hstat-lbl">Students</div>
        </div>
        <div class="hstat">
          <div class="hstat-val">${avgScore}<span>%</span></div>
          <div class="hstat-lbl">Avg Score</div>
        </div>
      </div>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat-box">
      <span class="stat-box-label">Total Students</span>
      <span class="stat-box-value">${total}</span>
    </div>
    <div class="stat-box st-green">
      <span class="stat-box-label">Completed</span>
      <span class="stat-box-value">${completed}</span>
    </div>
    <div class="stat-box st-amber">
      <span class="stat-box-label">Pending</span>
      <span class="stat-box-value">${pending}</span>
    </div>
    <div class="stat-box st-blue">
      <span class="stat-box-label">Avg Score</span>
      <span class="stat-box-value">${avgScore}%</span>
    </div>
  </div>

  <div class="action-bar">
    <button class="btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <div class="table-card">
    <div class="table-header-bar">
      <h2>All Submissions</h2>
      <span>${filteredSubmissions.length} records</span>
    </div>
    <div class="table-scroll" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Sr No</th><th>Student</th><th>Email</th><th>Batch</th>
            <th>Assignment</th><th>Type</th><th>Start Date</th>
            <th>Due Date</th><th>Submitted</th><th>Score</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${tableRows || '<tr><td colspan="11" style="text-align:center;padding:36px;color:#94a3b8;">No data found.</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="report-footer">
    Netwisdome LMS &nbsp;·&nbsp; Student Performance Report &nbsp;·&nbsp; ${esc(exportDate)}
  </div>
</div>
</body>
</html>`);
      win.document.close();
      win.focus();
      showToast('PDF report opened — use Print / Save as PDF');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF export failed. Please try again.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  /* ══════════════════════════════════════════════════════
     EXPORT: STYLED EXCEL  (SheetJS)
  ══════════════════════════════════════════════════════ */
  const handleExportExcel = async () => {
    if (exportingExcel || filteredSubmissions.length === 0) return;
    setExportingExcel(true);
    try {
      const XLSX = await import('xlsx').catch(() => null);
      if (!XLSX) {
        showToast('xlsx package not found. Run: npm install xlsx', 'error');
        return;
      }

      /* ── Helpers ─────────────────────────────────────── */
      const encode = XLSX.utils.encode_cell;

      const setCell = (ws, row, col, value, style) => {
        const addr = encode({ r: row, c: col });
        ws[addr] = xlCell(value, style);
      };

      const applyRowStyle = (ws, rowIdx, colCount, style) => {
        for (let c = 0; c < colCount; c++) {
          const addr = encode({ r: rowIdx, c });
          if (ws[addr]) ws[addr].s = style;
          else ws[addr] = xlCell('', style);
        }
      };

      /* ── Sheet 1: Performance Reports ───────────────── */
      const ws = {};
      const COLS = 11;
      let R = 0;

      /* Row 0 — Main title (merged) */
      setCell(ws, R, 0, 'Netwisdome Learning Management System', xlStyles.title());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.title());
      R++;

      /* Row 1 — Sub-title */
      setCell(ws, R, 0, 'Student Performance Report', xlStyles.subtitle());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.subtitle());
      R++;

      /* Row 2 — Generated date */
      setCell(ws, R, 0, `Generated: ${exportDate}`, xlStyles.metaLabel());
      for (let c = 1; c < COLS; c++) setCell(ws, R, c, '', xlStyles.metaLabel());
      R++;

      /* Row 3 — Summary stats */
      const metaValues = [
        `Students: ${filteredData.length}`,
        `Avg Score: ${reportStats.avgScore}%`,
        `Completed: ${filteredData.filter(s => s.status === 'Completed').length}`,
        `Pending: ${filteredData.filter(s => s.status === 'Pending').length}`,
        '', '', '', '', '', '', '',
      ];
      metaValues.forEach((v, c) => setCell(ws, R, c, v, xlStyles.metaLabel()));
      R++;

      /* Row 4 — spacer */
      for (let c = 0; c < COLS; c++) setCell(ws, R, c, '', { fill: { fgColor: { rgb: 'FFFFFFFF' }, patternType: 'solid' } });
      R++;

      /* Row 5 — Column headers */
      const headers = ['Sr No', 'Student Name', 'Email', 'Batch', 'Assignment',
        'Type', 'Start Date', 'Due Date', 'Submission Date', 'Score', 'Status'];
      headers.forEach((h, c) => setCell(ws, R, c, h, xlStyles.header()));
      const headerRow = R;
      R++;

      /* Rows 6+ — Data */
      filteredSubmissions.forEach((r, i) => {
        const shade  = i % 2 === 1;
        const rawSt  = toDisplayStatus(r.status);
        const scoreV = Number(r.scoreValue) || 0;
        const scoreM = Number(r.totalMarks) || 100;
        const pct    = Math.min(100, Math.round((scoreV / scoreM) * 100));

        setCell(ws, R, 0,  i + 1,              xlStyles.cellCenter(shade));
        setCell(ws, R, 1,  safe(r.name, 'Student'), xlStyles.cell(shade));
        setCell(ws, R, 2,  safe(r.email),       xlStyles.cell(shade));
        setCell(ws, R, 3,  safe(r.batchName),   xlStyles.cell(shade));
        setCell(ws, R, 4,  safe(r.assignment),  xlStyles.cell(shade));
        setCell(ws, R, 5,  safe(r.type),        xlStyles.cellCenter(shade));
        setCell(ws, R, 6,  safe(r.startDateText), xlStyles.cell(shade));
        setCell(ws, R, 7,  safe(r.dueDateText), xlStyles.cell(shade));
        setCell(ws, R, 8,  safe(r.dateText),    xlStyles.cell(shade));
        setCell(ws, R, 9,  safe(r.scoreText),   xlStyles.scoreCell(pct, shade));
        setCell(ws, R, 10, rawSt,               xlStyles.statusCell(rawSt, shade));
        R++;
      });

      /* ws range */
      ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: R - 1, c: COLS - 1 })}`;

      /* Merges: title rows span all columns */
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
      ];

      /* Column widths (Issue 7) */
      ws['!cols'] = [
        { wch: 8  },  // Sr No
        { wch: 24 },  // Student Name
        { wch: 32 },  // Email
        { wch: 22 },  // Batch
        { wch: 28 },  // Assignment
        { wch: 14 },  // Type
        { wch: 16 },  // Start Date
        { wch: 16 },  // Due Date
        { wch: 18 },  // Submission Date
        { wch: 14 },  // Score
        { wch: 14 },  // Status
      ];

      /* Row heights */
      ws['!rows'] = Array.from({ length: R }, (_, i) => {
        if (i < 4) return { hpt: i === 0 ? 32 : 22 };
        if (i === headerRow) return { hpt: 24 };
        return { hpt: 18 };
      });

      /* Freeze pane on header */
      ws['!freeze'] = { xSplit: 0, ySplit: headerRow + 1, topLeftCell: `A${headerRow + 2}`, activeCell: `A${headerRow + 2}`, sqref: `A${headerRow + 2}` };

      /* Auto-filter */
      ws['!autofilter'] = { ref: `A${headerRow + 1}:K${R}` };

      /* ── Sheet 2: Student Summary ────────────────────── */
      const ws2 = {};
      let R2 = 0;
      const S2_COLS = 8;

      setCell(ws2, R2, 0, 'Student Summary Report', xlStyles.title());
      for (let c = 1; c < S2_COLS; c++) setCell(ws2, R2, c, '', xlStyles.title());
      R2++;

      setCell(ws2, R2, 0, `Generated: ${exportDate}`, xlStyles.metaLabel());
      for (let c = 1; c < S2_COLS; c++) setCell(ws2, R2, c, '', xlStyles.metaLabel());
      R2++;

      for (let c = 0; c < S2_COLS; c++) setCell(ws2, R2, c, '', {});
      R2++;

      const s2Headers = ['Student Name', 'Email', 'Batch', 'Reports', 'Avg Score %', 'Completed', 'Pending', 'Status'];
      s2Headers.forEach((h, c) => setCell(ws2, R2, c, h, xlStyles.header()));
      const s2HeaderRow = R2;
      R2++;

      filteredData.forEach((s, i) => {
        const shade   = i % 2 === 1;
        const rawSt   = toDisplayStatus(s.status);
        const avgPct  = parseFloat(s.avgPercent.toFixed(1));

        setCell(ws2, R2, 0, safe(s.name, 'Student'),   xlStyles.cell(shade));
        setCell(ws2, R2, 1, safe(s.email),              xlStyles.cell(shade));
        setCell(ws2, R2, 2, safe(s.batchName),          xlStyles.cell(shade));
        setCell(ws2, R2, 3, s.reportCount,              xlStyles.cellCenter(shade));
        setCell(ws2, R2, 4, avgPct,                     xlStyles.scoreCell(avgPct, shade));
        setCell(ws2, R2, 5, s.completedCount,           xlStyles.cellCenter(shade));
        setCell(ws2, R2, 6, s.pendingCount,             xlStyles.cellCenter(shade));
        setCell(ws2, R2, 7, rawSt,                      xlStyles.statusCell(rawSt, shade));
        R2++;
      });

      ws2['!ref'] = `A1:${XLSX.utils.encode_cell({ r: R2 - 1, c: S2_COLS - 1 })}`;
      ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: S2_COLS - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: S2_COLS - 1 } },
      ];
      ws2['!cols'] = [
        { wch: 24 }, { wch: 30 }, { wch: 22 }, { wch: 10 },
        { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
      ];
      ws2['!freeze'] = { xSplit: 0, ySplit: s2HeaderRow + 1, topLeftCell: `A${s2HeaderRow + 2}`, activeCell: `A${s2HeaderRow + 2}`, sqref: `A${s2HeaderRow + 2}` };
      ws2['!autofilter'] = { ref: `A${s2HeaderRow + 1}:H${R2}` };

      /* ── Workbook ─────────────────────────────────────── */
      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title:       'Student Performance Report',
        Subject:     'Netwisdome LMS',
        Author:      'Netwisdome LMS',
        CreatedDate: new Date(),
      };
      XLSX.utils.book_append_sheet(wb, ws,  'Performance Reports');
      XLSX.utils.book_append_sheet(wb, ws2, 'Student Summary');
      XLSX.writeFile(wb, 'student_performance_report.xlsx');
      showToast('Excel report downloaded successfully!');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Excel export failed. Please try again.', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  /* ══════════════════════════════════════════════════════
     CSV HELPERS
  ══════════════════════════════════════════════════════ */
  const toCsv = (rows) => {
    const hdr  = ['Student Name','Email','Batch','Assignment','Type',
                  'Start Date','Due Date','Submission Date','Score','Status'];
    const body = rows.map((r) => [
      safe(r.name,'Student'), safe(r.email), safe(r.batchName), safe(r.assignment),
      safe(r.type), safe(r.startDateText), safe(r.dueDateText),
      safe(r.dateText || (r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-')),
      safe(r.scoreText), safe(toDisplayStatus(r.status)),
    ]);
    return [hdr, ...body]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(','))
      .join('\n');
  };

  const downloadCsv = (rows, fileName) => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  /* ══════════════════════════════════════════════════════
     INDIVIDUAL STUDENT REPORT POPUP
  ══════════════════════════════════════════════════════ */
  const handleOpenStudentReportsTab = (student) => {
    if (!student?.reports?.length) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const totalReports   = student.reports.length;
    const completedCount = student.reports.filter(r => toDisplayStatus(r.status) === 'Complete').length;
    const pendingCount   = totalReports - completedCount;
    const totalScore     = student.reports.reduce((s, r) => s + (Number(r.scoreValue) || 0), 0);
    const totalMarks     = student.reports.reduce((s, r) => s + (Number(r.totalMarks) || 100), 0);
    const avgPct         = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : '0.0';
    const avatarText     = initials(student.name || 'S');

    const rows = student.reports.map((r, i) => {
      const rawStatus = toDisplayStatus(r.status);
      const statusCls = rawStatus === 'Complete' ? 'badge-complete'
                      : rawStatus === 'Pending'  ? 'badge-pending'
                      : 'badge-failed';
      const scoreVal  = Number(r.scoreValue) || 0;
      const scoreMax  = Number(r.totalMarks)  || 100;
      const scorePct  = Math.min(100, Math.round((scoreVal / scoreMax) * 100));
      const bar       = scoreColor(scorePct);
      const typeCls   = (r.type || '').toUpperCase() === 'MCQ' ? 'type-mcq' : 'type-practical';

      return `<tr class="report-row">
        <td class="td-num" data-label="#">${i + 1}</td>
        <td class="td-assign" data-label="Assignment"><span class="assign-name">${esc(r.assignment||'-')}</span></td>
        <td data-label="Type"><span class="type-badge ${typeCls}">${esc(r.type||'-')}</span></td>
        <td class="td-date" data-label="Start">${esc(r.startDateText||'-')}</td>
        <td class="td-date" data-label="Due">${esc(r.dueDateText||'-')}</td>
        <td class="td-date" data-label="Submitted">${esc(r.dateText||'-')}</td>
        <td class="td-score" data-label="Score">
          <div class="score-wrap">
            <span class="score-text" style="color:${bar}">${esc(r.scoreText||'-')}</span>
            <div class="score-bar-bg">
              <div class="score-bar-fill" style="width:${scorePct}%;background:${bar};"></div>
            </div>
          </div>
        </td>
        <td data-label="Status"><span class="status-badge ${statusCls}">${rawStatus}</span></td>
      </tr>`;
    }).join('');

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(student.name||'Student')} — Reports</title>
  ${FONT_LINK}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 15px; }
    body {
      font-family: 'Manrope', sans-serif;
      background: #f0f4f8;
      color: #0f172a;
      min-height: 100vh;
      padding: 28px 20px 56px;
      animation: pageIn .4s ease both;
    }
    @keyframes pageIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

    .page { max-width: 1040px; margin: 0 auto; }

    /* Brand */
    .brand-bar { display:flex; align-items:center; gap:10px; margin-bottom:24px; }
    .brand-logo {
      width:34px; height:34px; border-radius:9px;
      background:linear-gradient(135deg,#1e3a5f 0%,#ff6b00 100%);
      display:flex; align-items:center; justify-content:center;
      font-family:'Sora',sans-serif; font-size:13px; font-weight:800; color:#fff; flex-shrink:0;
    }
    .brand-name {
      font-family:'Sora',sans-serif; font-size:16px; font-weight:800;
      background:linear-gradient(100deg,#1e3a5f 0%,#ff6b00 110%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .brand-tag { margin-left:auto; font-size:11px; font-weight:600; color:#64748b; }

    /* Header card */
    .header-card {
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 55%,#0b2a4a 100%);
      border-radius:18px; padding:28px 32px; margin-bottom:20px;
      box-shadow:0 8px 28px rgba(15,31,58,.28); position:relative; overflow:hidden;
    }
    .header-card::before {
      content:''; position:absolute; top:-55px; right:-55px;
      width:220px; height:220px; border-radius:50%;
      background:radial-gradient(circle,rgba(255,107,0,.18) 0%,transparent 70%);
      pointer-events:none;
    }
    .header-inner { display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap; position:relative; z-index:1; }

    .avatar {
      width:68px; height:68px; border-radius:16px; flex-shrink:0;
      background:linear-gradient(135deg,#ff6b00 0%,#ff9a40 100%);
      display:flex; align-items:center; justify-content:center;
      font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#fff;
      box-shadow:0 4px 14px rgba(255,107,0,.40);
    }
    .student-info-hd { flex:1; min-width:180px; }
    .student-name-hd {
      font-family:'Sora',sans-serif; font-size:22px; font-weight:800;
      color:#fff; letter-spacing:-.3px; line-height:1.2; margin-bottom:6px;
    }
    .student-meta-hd { display:flex; flex-wrap:wrap; gap:5px 14px; margin-bottom:12px; }
    .meta-item {
      display:flex; align-items:center; gap:5px;
      font-size:12px; font-weight:500; color:rgba(255,255,255,.60);
    }
    .meta-dot { width:4px; height:4px; border-radius:50%; background:rgba(255,107,0,.7); display:inline-block; }
    .header-badges { display:flex; flex-wrap:wrap; gap:7px; }
    .hbadge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; border:1.5px solid; }
    .hbadge-total    { background:rgba(255,255,255,.10); border-color:rgba(255,255,255,.20); color:#fff; }
    .hbadge-complete { background:rgba(16,185,129,.15);  border-color:rgba(16,185,129,.30);  color:#6ee7b7; }
    .hbadge-pending  { background:rgba(245,158,11,.15);  border-color:rgba(245,158,11,.30);  color:#fcd34d; }

    .header-stats { display:flex; flex-direction:column; gap:10px; align-items:flex-end; }
    .stat-pill {
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      border-radius:12px; padding:9px 18px; text-align:center; min-width:105px;
      backdrop-filter:blur(6px);
    }
    .stat-pill-value { font-family:'Sora',sans-serif; font-size:21px; font-weight:800; color:#fff; line-height:1; }
    .stat-pill-value span { font-size:12px; font-weight:600; color:rgba(255,255,255,.5); }
    .stat-pill-label { font-size:10px; font-weight:600; color:rgba(255,255,255,.45); margin-top:2px; }

    /* Section title */
    .section-title {
      display:flex; align-items:center; gap:10px;
      font-family:'Sora',sans-serif; font-size:14px; font-weight:800;
      color:#0f172a; margin-bottom:12px;
    }
    .section-title::after { content:''; flex:1; height:1.5px; background:linear-gradient(90deg,#e2e8f0,transparent); }
    .title-count { font-size:11px; font-weight:700; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:20px; }

    /* Table */
    .table-container {
      background:#fff; border-radius:16px;
      box-shadow:0 4px 18px rgba(2,6,23,.07);
      overflow:hidden;
    }
    .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

    table { border-collapse:collapse; width:100%; min-width:680px; }
    thead tr { background:linear-gradient(90deg,#0f1f3a 0%,#1a3259 100%); }
    thead th {
      font-family:'Sora',sans-serif; font-size:10.5px; font-weight:700;
      color:rgba(255,255,255,.75); text-transform:uppercase; letter-spacing:.6px;
      padding:13px 14px; text-align:left; white-space:nowrap;
    }
    thead th.th-center { text-align:center; }
    tbody tr { border-bottom:1px solid #f1f5f9; transition:background .15s ease; }
    tbody tr:last-child { border-bottom:none; }
    tbody tr:nth-child(even) { background:#fafbfc; }
    tbody tr:hover { background:#f0f4ff !important; }

    .report-row td { padding:13px 14px; font-size:13px; font-weight:500; color:#334155; vertical-align:middle; }
    .td-num   { font-size:11.5px; font-weight:700; color:#94a3b8; width:38px; text-align:center; }
    .td-assign { max-width:170px; }
    .assign-name { font-weight:700; color:#1e293b; font-size:13px; line-height:1.3; }
    .td-date  { white-space:nowrap; font-size:12px; color:#64748b; }

    .type-badge {
      display:inline-block; padding:2px 9px; border-radius:20px;
      font-size:10px; font-weight:800; letter-spacing:.5px;
      text-transform:uppercase; white-space:nowrap;
    }
    .type-mcq       { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
    .type-practical { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }

    .status-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:20px;
      font-size:11px; font-weight:700; white-space:nowrap;
    }
    .status-badge::before { content:''; width:5px; height:5px; border-radius:50%; display:inline-block; }
    .badge-complete { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .badge-complete::before { background:#22c55e; }
    .badge-pending  { background:#fffbeb; color:#b45309; border:1px solid #fde68a; }
    .badge-pending::before  { background:#f59e0b; }
    .badge-failed   { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .badge-failed::before   { background:#ef4444; }

    .td-score { min-width:110px; }
    .score-wrap { display:flex; flex-direction:column; gap:4px; }
    .score-text { font-family:'Sora',sans-serif; font-size:12.5px; font-weight:800; line-height:1; }
    .score-bar-bg { height:4px; border-radius:10px; background:#e2e8f0; overflow:hidden; }
    .score-bar-fill {
      height:100%; border-radius:10px;
      animation:barGrow .7s .3s ease both; transform-origin:left;
    }
    @keyframes barGrow { from { width:0 !important; } }

    /* Footer */
    .report-footer { margin-top:24px; text-align:center; font-size:11.5px; color:#94a3b8; font-weight:500; }
    .print-btn {
      display:inline-flex; align-items:center; gap:6px;
      margin-top:14px; padding:8px 20px; border-radius:9px;
      background:linear-gradient(135deg,#0f1f3a 0%,#1e3a5f 100%);
      color:#fff; font-size:12.5px; font-weight:700; border:none; cursor:pointer;
      box-shadow:0 4px 12px rgba(15,31,58,.22); font-family:'Manrope',sans-serif;
      transition:transform .15s ease, box-shadow .15s ease;
    }
    .print-btn:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(15,31,58,.30); }

    /* Mobile */
    @media (max-width: 680px) {
      body { padding: 14px 10px 44px; }
      .header-card { padding: 20px 18px; }
      .avatar { width:52px; height:52px; font-size:16px; border-radius:13px; }
      .student-name-hd { font-size:17px; }
      .header-stats { flex-direction:row; align-items:center; }
      .stat-pill { min-width:75px; padding:7px 11px; }
      .stat-pill-value { font-size:17px; }
      table, thead, tbody, th, td, tr { display:block; }
      thead tr { position:absolute; top:-9999px; left:-9999px; }
      .report-row {
        background:#fff !important; border-radius:11px; margin-bottom:10px;
        box-shadow:0 2px 8px rgba(2,6,23,.07); border:1px solid #e2e8f0; overflow:hidden;
      }
      .report-row td {
        display:flex; justify-content:space-between; align-items:center;
        padding:9px 13px; border-bottom:1px solid #f1f5f9; font-size:12.5px;
      }
      .report-row td:last-child { border-bottom:none; }
      .report-row td::before {
        content:attr(data-label);
        font-size:9.5px; font-weight:800; text-transform:uppercase;
        color:#94a3b8; letter-spacing:.5px; flex-shrink:0; min-width:90px;
      }
    }

    ${STUDENT_PRINT_CSS}
  </style>
</head>
<body>
<div class="page">
  <div class="brand-bar">
    <div class="brand-logo">N</div>
    <span class="brand-name">Netwisdome</span>
    <span class="brand-tag">Learning Management System</span>
  </div>

  <div class="header-card">
    <div class="header-inner">
      <div class="avatar">${avatarText}</div>
      <div class="student-info-hd">
        <div class="student-name-hd">${esc(student.name||'Student')}</div>
        <div class="student-meta-hd">
          <span class="meta-item"><span class="meta-dot"></span>${esc(student.email||'-')}</span>
          <span class="meta-item"><span class="meta-dot"></span>Batch: ${esc(student.batchName||'-')}</span>
        </div>
        <div class="header-badges">
          <span class="hbadge hbadge-total">📋 ${totalReports} Total Reports</span>
          <span class="hbadge hbadge-complete">✓ ${completedCount} Complete</span>
          ${pendingCount > 0 ? `<span class="hbadge hbadge-pending">⏳ ${pendingCount} Pending</span>` : ''}
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-pill">
          <div class="stat-pill-value">${avgPct}<span>%</span></div>
          <div class="stat-pill-label">Avg Score</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">
    Assignment Reports
    <span class="title-count">${totalReports} entries</span>
  </div>

  <div class="table-container">
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="th-center">Sr.No.</th>
            <th>Assignment</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>Due Date</th>
            <th>Submitted</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">No reports found.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <div class="report-footer">
    <p>Generated by Netwisdome LMS &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })}</p>
    <button class="print-btn" onclick="window.print()">🖨 Print Report</button>
  </div>
</div>
</body>
</html>`);
    win.document.close();
  };

  const handleRowDownload = (row) => {
    if (!row.reports?.length) return;
    const safeName = String(row.name || 'student').trim().replace(/\s+/g, '_');
    downloadCsv(row.reports, `${safeName}_all_reports.csv`);
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="reports-container fade-in">

      {/* Toast */}
      {toast && (
        <div className={`export-toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="reports-header">
        <div className="header-text">
          <h2>Performance Reports</h2>
          <p>Analyze student performance across assignments and export data.</p>
        </div>
        <div className="export-actions">
          <button
            className={`export-pill pdf ${exportingPdf ? 'exporting' : ''}`}
            onClick={handleExportPdf}
            disabled={filteredData.length === 0 || exportingPdf}
            title="Export Performance Report to PDF"
          >
            {exportingPdf
              ? <><span className="spinner" /> Generating…</>
              : <><FileDown size={16} /> Submissions PDF</>}
          </button>
          <button
            className={`export-pill excel ${exportingExcel ? 'exporting' : ''}`}
            onClick={handleExportExcel}
            disabled={filteredData.length === 0 || exportingExcel}
            title="Export Performance Report to Excel"
          >
            {exportingExcel
              ? <><span className="spinner" /> Exporting…</>
              : <><FileSpreadsheet size={16} /> Submissions Excel</>}
          </button>
          <button
            className="export-pill pdf secondary-pill"
            style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', borderColor: '#475569', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportStudentDirectoryPdf}
            title="Download Student Directory Roster (PDF)"
          >
            <FileDown size={16} /> Students PDF
          </button>
          <button
            className="export-pill excel secondary-pill"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportStudentDirectoryExcel}
            title="Download Student Directory Roster (Excel)"
          >
            <FileSpreadsheet size={16} /> Students Excel
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="reports-stats-grid">
        {[
          { label: 'Total Students', value: reportStats.total,     cls: '',          delay: '0ms'   },
          { label: 'Completed',      value: reportStats.completed, cls: 'completed', delay: '60ms'  },
          { label: 'Pending',        value: reportStats.pending,   cls: 'pending',   delay: '120ms' },
          { label: 'Avg Score',      value: `${reportStats.avgScore}%`, cls: 'avg',  delay: '180ms' },
        ].map(({ label, value, cls, delay }) => (
          <div
            key={label}
            className={`report-stat-card ${cls} stat-card-enter`}
            style={{ animationDelay: delay }}
          >
            <span className="stat-title">{label}</span>
            <span className="stat-value">{value}</span>
          </div>
        ))}
      </div>

      {/* 📊 Score Distribution Breakdown & Health Metrics Panel */}
      <div className="reports-analytics-panel" style={{
        background: '#ffffff', borderRadius: '16px', padding: '20px', marginBottom: '20px',
        boxShadow: '0 4px 18px rgba(2,6,23,0.07)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px'
      }}>
        <div>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📊</span> Score Distribution Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {[
              { label: 'Excellent (90%+)', val: gradeDistribution.excellent, color: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' },
              { label: 'Good (75-89%)', val: gradeDistribution.good, color: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' },
              { label: 'Average (50-74%)', val: gradeDistribution.average, color: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' },
              { label: 'Needs Improvement (<50%)', val: gradeDistribution.needsImprovement, color: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                  <span>{item.label}</span>
                  <span>{item.val.count} student{item.val.count === 1 ? '' : 's'} ({item.val.pct}%)</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: item.color, width: `${item.val.pct}%`, borderRadius: '10px', transition: 'width 0.8s ease-out' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '20px' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎯</span> LMS Performance Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', height: 'calc(100% - 32px)' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>At-Risk Rate</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                {filteredData.length > 0 ? ((filteredData.filter(s => s.isAtRisk).length / filteredData.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Cert Eligible</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {filteredData.length > 0 ? ((filteredData.filter(s => s.isEligibleForCertificate).length / filteredData.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Avg Completed Tasks</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: '800', color: '#1e3a5f', marginTop: '4px' }}>
                {filteredData.length > 0 ? (filteredData.reduce((sum, s) => sum + s.completedCount, 0) / filteredData.length).toFixed(1) : 0}
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Avg Pending Tasks</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                {filteredData.length > 0 ? (filteredData.reduce((sum, s) => sum + s.pendingCount, 0) / filteredData.length).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Toggle Button & Collapsible Panel */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0b2a4a 100%)', color: '#ffffff',
            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,31,58,0.15)',
            transition: 'all 0.2s', outline: 'none'
          }}
        >
          {showHeatmap ? '🗺️ Hide Batch Progress Map' : '🗺️ Show Batch Progress Map'}
        </button>

        {showHeatmap && (
          <div className="heatmap-panel fade-in" style={{
            background: '#ffffff', borderRadius: '16px', padding: '20px', marginTop: '12px',
            boxShadow: '0 4px 18px rgba(2,6,23,0.07)', border: '1px dashed #cbd5e1'
          }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>🗺️ Assignment Heatmap Grid</h3>
            {heatmapAssignments.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b' }}>No assignments found for this selection.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#475569', padding: '10px 8px', borderBottom: '2px solid #e2e8f0' }}>Student Name</th>
                      {heatmapAssignments.map(a => (
                        <th key={a} style={{
                          fontSize: '10px', fontWeight: '800', color: '#475569', padding: '10px 8px',
                          borderBottom: '2px solid #e2e8f0', minWidth: '110px', textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }} title={a}>
                          {a.length > 15 ? `${a.substring(0, 12)}...` : a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(student => (
                      <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', padding: '10px 8px' }}>{student.name}</td>
                        {heatmapAssignments.map(a => {
                          const sub = student.reports.find(r => r.assignment === a);
                          let color = '#cbd5e1'; // Not Started
                          let tooltip = 'Not Started';
                          if (sub) {
                            if (sub.status === 'Completed') {
                              const pct = sub.scoreValue / sub.totalMarks;
                              if (pct >= 0.5) {
                                color = '#10b981'; // Passed
                                tooltip = `Passed: ${sub.scoreValue}/${sub.totalMarks} (${sub.dateText})`;
                              } else {
                                color = '#ef4444'; // Failed
                                tooltip = `Failed: ${sub.scoreValue}/${sub.totalMarks} (${sub.dateText})`;
                              }
                            } else {
                              color = '#f59e0b'; // Pending
                              tooltip = 'Submitted (Pending Review)';
                            }
                          }
                          return (
                            <td key={a} style={{ padding: '8px', textAlign: 'center' }}>
                              <div
                                style={{
                                  width: '24px', height: '24px', borderRadius: '6px', background: color,
                                  margin: '0 auto', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)',
                                  transition: 'transform 0.1s'
                                }}
                                title={tooltip}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', marginTop: '16px', fontSize: '11px', fontWeight: '700', color: '#64748b', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981' }} /> Passed (50%+)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#ef4444' }} /> Failed (&lt;50%)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#f59e0b' }} /> Pending review
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#cbd5e1' }} /> Not started
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by student, assignment, batch, email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <div className="date-picker">
            <Calendar size={15} />
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="7">Last 7 Days</option>
              <option value="30">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="date-picker month-picker">
            <Calendar size={15} />
            <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
              <option value="all">All Batches</option>
              {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="date-picker month-picker">
            <Calendar size={15} />
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="all">All Months</option>
              {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn-filter">
            <Filter size={14} /> {filteredData.length} Students
          </button>
        </div>

        {/* Dynamic Categorization Segment Controls */}
        <div className="filter-categories" style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', width: '100%', flexWrap: 'wrap' }}>
          <button
            className={`cat-btn ${activeCategoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('all')}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
              background: activeCategoryFilter === 'all' ? 'linear-gradient(135deg, #1e3a5f 0%, #0b2a4a 100%)' : '#f1f5f9',
              color: activeCategoryFilter === 'all' ? '#ffffff' : '#64748b',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
            }}
          >
            📋 All Students ({filteredData.length})
          </button>
          <button
            className={`cat-btn ${activeCategoryFilter === 'atRisk' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('atRisk')}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
              background: activeCategoryFilter === 'atRisk' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#f1f5f9',
              color: activeCategoryFilter === 'atRisk' ? '#ffffff' : '#ef4444',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
              boxShadow: activeCategoryFilter === 'atRisk' ? '0 2px 8px rgba(239,68,68,0.3)' : 'none'
            }}
          >
            🚨 At-Risk ({filteredData.filter(s => s.isAtRisk).length})
          </button>
          <button
            className={`cat-btn ${activeCategoryFilter === 'eligible' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('eligible')}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
              background: activeCategoryFilter === 'eligible' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
              color: activeCategoryFilter === 'eligible' ? '#ffffff' : '#10b981',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
              boxShadow: activeCategoryFilter === 'eligible' ? '0 2px 8px rgba(16,185,129,0.3)' : 'none'
            }}
          >
            🎓 Certificate Ready ({filteredData.filter(s => s.isEligibleForCertificate).length})
          </button>
        </div>
      </div>

      {/* Selected Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="bulk-actions-bar fade-in" style={{
          background: 'linear-gradient(90deg, #1e3a5f 0%, #0b2a4a 100%)',
          color: '#ffffff', padding: '12px 20px', borderRadius: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px', boxShadow: '0 4px 18px rgba(15,31,58,0.25)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔔</span> Selected {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                const pendingCount = filteredData
                  .filter(s => selectedStudents.includes(s.id))
                  .reduce((sum, s) => sum + s.pendingCount, 0);
                
                setReminderModal({
                  students: filteredData.filter(s => selectedStudents.includes(s.id)),
                  pendingCount,
                  stage: 'draft'
                });
              }}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                background: '#ff6b00', color: '#ffffff', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(255,107,0,0.3)', transition: 'all 0.15s'
              }}
            >
              ✉️ Send reminders
            </button>
            <button
              onClick={() => setSelectedStudents([])}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="custom-table">
            <colgroup>
              <col style={{ width: '45px' }} />
              <col className="col-student" />
              <col className="col-assignment" />
              <col className="col-date" />
              <col className="col-score" />
              <col className="col-status" />
              <col className="col-report" />
            </colgroup>
            <thead>
              <tr>
                <th style={{ width: '45px', paddingLeft: '12px' }}>
                  <input
                    type="checkbox"
                    checked={finalFilteredData.length > 0 && selectedStudents.length === finalFilteredData.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                  />
                </th>
                <th>Student</th>
                <th>Reports</th>
                <th>Latest Submission</th>
                <th>Avg Score</th>
                <th>Status</th>
                <th className="text-center">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : finalFilteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    <div className="empty-state">
                      <FileBarChart2 size={40} />
                      <p>No student records found</p>
                      <span>Try adjusting your filters or search query</span>
                    </div>
                  </td>
                </tr>
              ) : (
                finalFilteredData.map((student) => (
                  <tr key={student.id}>
                    <td style={{ paddingLeft: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                      />
                    </td>

                    {/* Student */}
                    <td>
                      <div className="student-info">
                        <div className="avatar-circle">{initials(student.name)}</div>
                        <div className="student-meta">
                          <span className="student-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {student.name}
                            {student.isAtRisk && (
                              <span style={{
                                background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                                fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                                display: 'inline-block'
                              }}>
                                🚨 At-Risk
                              </span>
                            )}
                            {student.isEligibleForCertificate && (
                              <span style={{
                                background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0',
                                fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                                display: 'inline-block'
                              }}>
                                🎓 Cert Ready
                              </span>
                            )}
                          </span>
                          <small>{student.email || '-'} &bull; {student.batchName || '-'}</small>
                        </div>
                      </div>
                    </td>

                    {/* Reports count */}
                    <td>
                      <div className="reports-cell">
                        <button
                          type="button"
                          className="tag-blue reports-link-btn"
                          onClick={() => handleOpenStudentReportsTab(student)}
                          title="Open all reports in new tab"
                        >
                          {student.reportCount} Reports
                        </button>
                        <div className="small-type">
                          ✓ {student.completedCount} Complete &nbsp;·&nbsp; ⏳ {student.pendingCount} Pending
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td><span className="text-muted">{student.latestDateText}</span></td>

                    {/* Score */}
                    <td>
                      <div className="score-display">
                        <div className="progress-bg">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, student.avgPercent)}%` }}
                          />
                        </div>
                        <span className="score-label">{student.avgScoreText}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${student.status.toLowerCase()}`}>
                        {toDisplayStatus(student.status)}
                      </span>
                    </td>

                    {/* Download */}
                    <td className="text-center">
                      <button
                        className="row-dl-btn"
                        onClick={() => handleRowDownload(student)}
                        title="Download all reports of this student"
                      >
                        <DownloadCloud size={15} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✉️ Bulk Email Reminder Simulation Modal */}
      {reminderModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', maxWidth: '580px', width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {reminderModal.stage === 'draft' && (
              <>
                <div style={{ background: '#1e3a5f', padding: '20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: '800' }}>✉️ Bulk Reminder Draft</h3>
                  <button onClick={() => setReminderModal(null)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Recipients</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '70px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px' }}>
                      {reminderModal.students.map(s => (
                        <span key={s.id} style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Subject</span>
                    <input
                      type="text"
                      readOnly
                      value="Action Required: Pending Assignments Reminder — Netwisdome"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700', color: '#1e293b' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Message Body</span>
                    <div style={{
                      padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                      fontSize: '12.5px', color: '#334155', background: '#fafbfc', lineHeight: '1.5',
                      height: '140px', overflowY: 'auto'
                    }}>
                      <p>Dear student,</p>
                      <p style={{ marginTop: '8px' }}>This is an automated reminder from your Netwisdome LMS administrator regarding your pending assignments. We noticed you have pending submissions that require your attention to maintain passing scores.</p>
                      <p style={{ marginTop: '8px' }}>Please log in to your dashboard and complete your tasks as soon as possible.</p>
                      <p style={{ marginTop: '12px' }}>Best regards,<br/><strong>Netwisdome LMS Admin</strong></p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setReminderModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', background: 'none', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      setReminderModal({ ...reminderModal, stage: 'sending' });
                      try {
                        const payload = {
                          students: reminderModal.students.map(s => ({ email: s.email, name: s.name })),
                          subject: "Action Required: Pending Assignments Reminder — Netwisdome",
                          body: `Dear student,

This is an automated reminder from your Netwisdome LMS administrator regarding your pending assignments. We noticed you have pending submissions that require your attention to maintain passing scores.

Please log in to your dashboard and complete your tasks as soon as possible.

Best regards,
Netwisdome LMS Admin`
                        };
                        const res = await axios.post(`${API_BASE}/api/assignments/send-reminder-email`, payload);
                        setReminderModal({
                          ...reminderModal,
                          stage: 'sent',
                          resultMessage: res.data?.message || 'Emails sent successfully!'
                        });
                      } catch (err) {
                        console.error("Failed to send reminders:", err);
                        setReminderModal({
                          ...reminderModal,
                          stage: 'error',
                          errorMessage: err.response?.data?.message || err.message || 'Failed to dispatch email reminders.'
                        });
                      }
                    }}
                    style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: '#ff6b00', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                  >
                    🚀 Send Reminders
                  </button>
                </div>
              </>
            )}

            {reminderModal.stage === 'sending' && (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <span className="spinner" style={{ width: '40px', height: '40px', borderColor: '#ff6b00', borderTopColor: 'transparent', borderRadius: '50%', borderStyle: 'solid', borderWidth: '3px', animation: 'spin 1s linear infinite' }} />
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Sending reminders...</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Dispatching actual reminder emails to {reminderModal.students.length} students...</p>
              </div>
            )}

            {reminderModal.stage === 'sent' && (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontSize: '24px' }}>✓</div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '800', color: '#15803d' }}>Emails Sent Successfully!</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{reminderModal.resultMessage || `${reminderModal.students.length} students have been notified of their pending tasks.`}</p>
                <button
                  onClick={() => {
                    setReminderModal(null);
                    setSelectedStudents([]);
                    showToast('Reminders dispatched successfully!');
                  }}
                  style={{ marginTop: '10px', padding: '8px 24px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: '#1e3a5f', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            )}

            {reminderModal.stage === 'error' && (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '24px' }}>✕</div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>Email Dispatch Failed</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{reminderModal.errorMessage || 'Please verify your SMTP configurations in your backend .env file.'}</p>
                <button
                  onClick={() => setReminderModal({ ...reminderModal, stage: 'draft' })}
                  style={{ marginTop: '10px', padding: '8px 24px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: '#ff6b00', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;