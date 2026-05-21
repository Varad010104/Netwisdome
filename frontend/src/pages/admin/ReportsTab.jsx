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
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [dateFilter,      setDateFilter]      = useState('7');
  const [batchFilter,     setBatchFilter]     = useState('all');
  const [monthFilter,     setMonthFilter]     = useState('all');
  const [exportingPdf,    setExportingPdf]    = useState(false);
  const [exportingExcel,  setExportingExcel]  = useState(false);
  const [toast,           setToast]           = useState(null);

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
        return {
          ...s,
          reportCount:    s.reports.length,
          avgPercent,
          avgScoreText:   `${avgPercent.toFixed(1)}%`,
          latestDateText: s.latestDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: s.pendingCount === 0 ? 'Completed' : 'Pending',
        };
      })
      .sort((a, b) => b.latestDate - a.latestDate);
  }, [filteredSubmissions]);

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
          >
            {exportingPdf
              ? <><span className="spinner" /> Generating…</>
              : <><FileDown size={16} /> Export PDF</>}
          </button>
          <button
            className={`export-pill excel ${exportingExcel ? 'exporting' : ''}`}
            onClick={handleExportExcel}
            disabled={filteredData.length === 0 || exportingExcel}
          >
            {exportingExcel
              ? <><span className="spinner" /> Exporting…</>
              : <><FileSpreadsheet size={16} /> Export Excel</>}
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
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="custom-table">
            <colgroup>
              <col className="col-student" />
              <col className="col-assignment" />
              <col className="col-date" />
              <col className="col-score" />
              <col className="col-status" />
              <col className="col-report" />
            </colgroup>
            <thead>
              <tr>
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
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    <div className="empty-state">
                      <FileBarChart2 size={40} />
                      <p>No report data found</p>
                      <span>Try adjusting your filters or search query</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((student) => (
                  <tr key={student.id}>

                    {/* Student */}
                    <td>
                      <div className="student-info">
                        <div className="avatar-circle">{initials(student.name)}</div>
                        <div className="student-meta">
                          <span className="student-name">{student.name}</span>
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

    </div>
  );
};

export default ReportsTab;