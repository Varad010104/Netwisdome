import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import API from '../../services/api';
import './OverviewTab.css';

const OverviewTab = () => {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('Weekly');

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [studentRes, assignmentRes, submissionRes] = await Promise.allSettled([
          API.get('/auth/students'),
          API.get('/assignments/all'),
          API.get('/assignments/submissions/all')
        ]);

        const studentsData =
          studentRes.status === 'fulfilled' && Array.isArray(studentRes.value?.data)
            ? studentRes.value.data
            : [];
        const assignmentsData =
          assignmentRes.status === 'fulfilled' && Array.isArray(assignmentRes.value?.data)
            ? assignmentRes.value.data
            : [];
        const submissionsData =
          submissionRes.status === 'fulfilled' && Array.isArray(submissionRes.value?.data)
            ? submissionRes.value.data
            : [];

        setStudents(studentsData);
        setAssignments(assignmentsData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Overview fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const activeAssignments = assignments.filter((a) => {
      if (!a?.lastDate) return false;
      return new Date(a.lastDate) >= now;
    }).length;

    const gradedSubmissions = submissions.filter((s) => s.status === 'graded');
    const completionRate = submissions.length > 0
      ? Math.round((gradedSubmissions.length / submissions.length) * 100)
      : 0;

    const avgPerformance = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / gradedSubmissions.length)
      : 0;

    return {
      totalStudents: students.length,
      activeAssignments,
      completionRate,
      avgPerformance: avgPerformance.toFixed(1)
    };
  }, [students, assignments, submissions]);

  const chartData = useMemo(() => {
    const now = new Date();

    if (chartFilter === 'Weekly') {
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return d;
      });

      return days.map((day) => {
        const label = day.toLocaleDateString('en-US', { weekday: 'short' });
        const value = submissions.filter((s) => {
          if (!s?.submittedAt) return false;
          const sd = new Date(s.submittedAt);
          return sd.toDateString() === day.toDateString();
        }).length;
        return { label, value };
      });
    }

    const months = [...Array(6)].map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return d;
    });

    return months.map((m) => {
      const label = m.toLocaleDateString('en-US', { month: 'short' });
      const value = submissions.filter((s) => {
        if (!s?.submittedAt) return false;
        const sd = new Date(s.submittedAt);
        return sd.getMonth() === m.getMonth() && sd.getFullYear() === m.getFullYear();
      }).length;
      return { label, value };
    });
  }, [chartFilter, submissions]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="overview-container fade-in">
      <div className="stats-grid-premium">
        <div className="stat-card-glass">
          <div className="stat-info">
            <p className="stat-label">Total Students</p>
            <h3 className="stat-value">{loading ? '--' : stats.totalStudents}</h3>
          </div>
          <div className="stat-icon-bg orange">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card-glass">
          <div className="stat-info">
            <p className="stat-label">Active Assignments</p>
            <h3 className="stat-value">{loading ? '--' : stats.activeAssignments}</h3>
          </div>
          <div className="stat-icon-bg blue">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stat-card-glass">
          <div className="stat-info">
            <p className="stat-label">Completion Rate</p>
            <h3 className="stat-value">{loading ? '--' : `${stats.completionRate}%`}</h3>
          </div>
          <div className="stat-icon-bg green">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="stat-card-glass">
          <div className="stat-info">
            <p className="stat-label">Avg. Performance</p>
            <h3 className="stat-value">{loading ? '--' : stats.avgPerformance}</h3>
          </div>
          <div className="stat-icon-bg purple">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="analytics-chart-wrapper">
        <div className="chart-header">
          <h4>Performance Analytics</h4>
          <div className="chart-controls">
            <select
              className="chart-filter"
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
            >
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>

        <div className="visual-chart-placeholder">
          {chartData.every((d) => d.value === 0) ? (
            <>
              <BarChart3 size={48} className="placeholder-icon" />
              <p>No submission analytics yet</p>
            </>
          ) : null}

          <div className="fake-bars live-bars">
            {chartData.map((item) => (
              <div className="bar-col" key={item.label}>
                <div
                  className="bar"
                  style={{ height: `${Math.max(8, (item.value / maxChartValue) * 100)}%` }}
                  title={`${item.label}: ${item.value}`}
                ></div>
                <span className="bar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
