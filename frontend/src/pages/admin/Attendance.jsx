import React, { useEffect, useMemo, useState } from 'react';
import './Attendance.css';
import { Search, Users, CheckCircle, XCircle } from 'lucide-react';

const API_BASES = ['http://localhost:5055', 'http://localhost:5000', ''];

const Attendance = () => {
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [recordsDate, setRecordsDate] = useState(getTodayISO());
  const [recordsBatch, setRecordsBatch] = useState('');

  const parseJsonSafe = async (response) => {
    const raw = await response.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { __raw: raw, __invalidJson: true };
    }
  };

  const withBase = (base, path) => {
    if (!base) return path;
    return `${base}${path}`;
  };

  const requestWithFallback = async (paths, options = {}) => {
    const errors = [];

    for (const base of API_BASES) {
      for (const path of paths) {
        const url = withBase(base, path);
        try {
          const response = await fetch(url, options);
          const json = await parseJsonSafe(response);

          if (!response.ok) {
            const msg = json?.message || json?.error || (json?.__raw ? String(json.__raw).slice(0, 100) : `HTTP ${response.status}`);
            errors.push(`${url} -> ${msg}`);
            continue;
          }

          if (json?.__invalidJson) {
            errors.push(`${url} -> Invalid JSON`);
            continue;
          }

          return { response, data: json, url };
        } catch (error) {
          errors.push(`${url} -> ${error.message}`);
        }
      }
    }

    throw new Error(`Attendance API failed. ${errors[0] || 'No reachable endpoint.'}`);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const studentsReq = requestWithFallback(['/api/auth/students'], { method: 'GET' });
        const batchesReq = requestWithFallback(['/api/batches/all'], { method: 'GET' });

        const [studentsRes, batchesRes] = await Promise.all([studentsReq, batchesReq]);

        const studentsJson = studentsRes.data;
        const batchesJson = batchesRes.data;

        const normalizedStudents = (Array.isArray(studentsJson) ? studentsJson : []).map((student) => ({
          id: String(student._id),
          name: student.name || 'Student',
          email: student.email || '-',
          batch: student?.batchId?.batchName || student.batchName || 'Unassigned',
          status: null
        }));

        const batchNames = [
          ...new Set(
            (Array.isArray(batchesJson) ? batchesJson : [])
              .map((batch) => batch.batchName)
              .filter(Boolean)
          )
        ];

        setAllStudents(normalizedStudents);
        setBatches(batchNames);

        if (batchNames.length > 0) {
          setSelectedBatch(batchNames[0]);
        } else if (normalizedStudents.length > 0) {
          setSelectedBatch(normalizedStudents[0].batch);
        }
      } catch (error) {
        console.error('Failed to load attendance data:', error);
        alert(error.message || 'Failed to load attendance data.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadAttendanceForSelectedDate = async () => {
      if (!selectedBatch) return;

      setRecordsLoading(true);
      setRecordsError('');
      setAttendanceRecords([]);

      const studentsOfBatch = allStudents
        .filter((student) => student.batch === selectedBatch)
        .map((student) => ({ ...student, status: null }));

      setStudents(studentsOfBatch);
      if (studentsOfBatch.length === 0) return;

      try {
        const query = new URLSearchParams({
          date: selectedDate,
          batch: selectedBatch
        }).toString();

        const { data } = await requestWithFallback([
          `/api/attendance/by-date?${query}`,
          `/api/attendance?${query}`,
          `/api?${query}`
        ]);

        const attendance = data?.data;
        if (!attendance?.records) {
          setRecordsLoading(false);
          return;
        }

        const statusMap = new Map(attendance.records.map((record) => [String(record.studentId), record.status]));

        setAttendanceRecords(attendance.records);
        setStudents((prev) =>
          prev.map((student) => ({
            ...student,
            status: statusMap.get(student.id) || null
          }))
        );
      } catch (error) {
        const message = error?.message || '';
        if (message.includes('No records found')) {
          setRecordsError('');
          setAttendanceRecords([]);
          return;
        }
        console.error('Failed to fetch attendance by date:', error);
        setRecordsError(message || 'Failed to load attendance records.');
      } finally {
        setRecordsLoading(false);
      }
    };

    loadAttendanceForSelectedDate();
  }, [allStudents, selectedBatch, selectedDate]);

  useEffect(() => {
    if (!recordsBatch && batches.length > 0) {
      setRecordsBatch(batches[0]);
    }
  }, [batches, recordsBatch]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!recordsBatch) return;
      setRecordsLoading(true);
      setRecordsError('');
      setAttendanceRecords([]);

      try {
        const query = new URLSearchParams({
          date: recordsDate,
          batch: recordsBatch
        }).toString();

        const { data } = await requestWithFallback([
          `/api/attendance/by-date?${query}`,
          `/api/attendance?${query}`,
          `/api?${query}`
        ]);

        const attendance = data?.data;
        if (!attendance?.records) {
          setRecordsLoading(false);
          return;
        }

        setAttendanceRecords(attendance.records);
      } catch (error) {
        const message = error?.message || '';
        if (message.includes('No records found')) {
          setRecordsError('');
          setAttendanceRecords([]);
          return;
        }
        console.error('Failed to fetch attendance by date:', error);
        setRecordsError(message || 'Failed to load attendance records.');
      } finally {
        setRecordsLoading(false);
      }
    };

    loadRecords();
  }, [recordsBatch, recordsDate]);

  const toggleAttendance = (id, status) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, status } : student)));
  };

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      if (!query) return true;
      return student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
    });
  }, [students, searchTerm]);

  const studentEmailMap = useMemo(() => {
    const map = new Map();
    allStudents.forEach((student) => {
      map.set(String(student.id), student.email || '-');
    });
    return map;
  }, [allStudents]);

  const handleSubmitAttendance = async () => {
    if (!selectedBatch) {
      alert('Please select a batch.');
      return;
    }
    if (students.length === 0) {
      alert('No students found in selected batch.');
      return;
    }

    const payload = {
      date: selectedDate,
      batch: selectedBatch,
      records: students.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        status: student.status || 'Present'
      })),
      markedBy: 'Admin'
    };

    try {
      setSaving(true);
      const { data } = await requestWithFallback(
        ['/api/attendance/save', '/api/attendance', '/api'],
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to save attendance');
      }

      alert(data.message || 'Attendance saved successfully.');
    } catch (error) {
      console.error('Attendance save failed:', error);
      alert(error.message || 'Attendance save failed.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-title">
          <Users size={24} />
          <div>
            <h2>Mark Student Attendance</h2>
          </div>
        </div>

        <div className="header-controls">
          <input
            type="date"
            className="attendance-date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="batch-select"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="attendance-table-header">
        <div>STUDENT PROFILE</div>
        <div>CONTACT INFO</div>
        <div>BATCH</div>
        <div className="text-center">ATTENDANCE</div>
      </div>

      <div className="attendance-table-wrapper">
        <table className="attendance-table main-attendance-table">
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">Loading students...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4">No students found.</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="profile-cell">
                      <div className="avatar">{student.name.charAt(0)}</div>
                      <div className="info">
                        <p className="name">{student.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="email-cell">{student.email}</td>
                  <td><span className="batch-badge">{student.batch}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`btn-present ${student.status === 'Present' ? 'active' : ''}`}
                        onClick={() => toggleAttendance(student.id, 'Present')}
                      >
                        <CheckCircle size={18} /> Present
                      </button>
                      <button
                        className={`btn-absent ${student.status === 'Absent' ? 'active' : ''}`}
                        onClick={() => toggleAttendance(student.id, 'Absent')}
                      >
                        <XCircle size={18} /> Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="attendance-footer">
        <button className="save-btn" onClick={handleSubmitAttendance} disabled={saving || loading}>
          {saving ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </div>

      <div className="attendance-records">
        <div className="records-header">
          <h3>Attendance Records</h3>
          <div className="records-controls">
            <input
              type="date"
              className="attendance-date-input"
              value={recordsDate}
              onChange={(e) => setRecordsDate(e.target.value)}
            />
            <select
              className="records-batch-select"
              value={recordsBatch}
              onChange={(e) => setRecordsBatch(e.target.value)}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table attendance-records-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>CONTACT INFO</th>
                <th>BATCH</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recordsLoading ? (
                <tr>
                  <td colSpan="3">Loading attendance...</td>
                </tr>
              ) : recordsError ? (
                <tr>
                  <td colSpan="3">{recordsError}</td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="3">No attendance found for selected date.</td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={`${record.studentId}-${record.status}-${record.createdAt || ''}`}>
                    <td>{record.studentName || 'Student'}</td>
                    <td className="email-cell">{studentEmailMap.get(String(record.studentId)) || '-'}</td>
                    <td>{recordsBatch || '-'}</td>
                    <td>
                      <span className={`records-status ${record.status ? record.status.toLowerCase() : ''}`}>
                        {record.status || '-'}
                      </span>
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

export default Attendance;
