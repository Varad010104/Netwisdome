import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  X
} from 'lucide-react';
import './AllAssesmentlist.css';
import { getStoredUserInfo } from "../../utils/userInfo";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

const AllAssesmentlist = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    feedback: ''
  });

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const userInfo = getStoredUserInfo();

        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();
        const studentId = userInfo?._id?.toString();

        const [assignmentRes, submissionRes] = await Promise.all([
          API.get('/assignments/all'),
          API.get('/assignments/submissions/all')
        ]);

        const allAssignments = Array.isArray(assignmentRes.data) ? assignmentRes.data : [];
        const studentAssignments = allAssignments.filter((item) =>
          assignmentMatchesBatch(item, studentBatchId)
        );
        setAssignments(studentAssignments);

        const assignmentIdSet = new Set(studentAssignments.map((item) => item._id?.toString()));
        const nextSubmissionMap = {};

        (submissionRes.data || []).forEach((submission) => {
          const submissionAssignmentId = submission.assignmentId?._id?.toString() || submission.assignmentId?.toString();
          const submissionStudentId = submission.studentId?.toString();

          if (assignmentIdSet.has(submissionAssignmentId) && submissionStudentId === studentId) {
            nextSubmissionMap[submissionAssignmentId] = submission;
          }
        });

        setSubmissionMap(nextSubmissionMap);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const getAssignmentStatus = (assignmentId) => (submissionMap[assignmentId] ? 'Completed' : 'Pending');
  const openFeedbackModal = (assignmentTitle, feedbackText) => {
    setFeedbackModal({
      open: true,
      title: assignmentTitle || 'Assignment',
      feedback: feedbackText || 'Instructor feedback is not available yet.'
    });
  };

  const filteredAssignments = assignments
    .filter((asgn) => {
      const matchesSearch = (asgn.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const currentStatus = getAssignmentStatus(asgn._id);
      const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
      const currentType = (asgn.type || '').toLowerCase();
      const matchesType = typeFilter === 'All' || currentType === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => new Date(b.createdAt || b.lastDate) - new Date(a.createdAt || a.lastDate));

  return (
    <div className="all-asgn-page all-asgn-fade-in">
      <div className="all-asgn-main-container">
        <header className="all-asgn-header">
          <div className="all-asgn-top-bar">
            <button className="all-asgn-back-link" onClick={() => navigate('/student/dashboard')}>
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
          </div>

          <div className="all-asgn-hero-section">
            <h1 className="all-asgn-title">All Assessment List</h1>
            <div className="all-asgn-search-box">
              <Search size={18} className="all-asgn-search-icon" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="all-asgn-input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="all-asgn-filter-bar">
          <div className="all-asgn-filter-group">
            <div className="all-asgn-label-text">
              <Filter size={16} />
              <span>Filter Status:</span>
            </div>
            <select className="all-asgn-select-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Tasks</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="all-asgn-filter-group">
            <div className="all-asgn-label-text">
              <Filter size={16} />
              <span>Filter Type:</span>
            </div>
            <select className="all-asgn-select-dropdown" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="practical">Practical</option>
            </select>
          </div>

          <div className="all-asgn-count-badge">
            Showing <strong>{filteredAssignments.length}</strong> Assessments
          </div>
        </div>

        <div className="all-asgn-table-container">
          <table className="all-asgn-data-table">
            <thead>
              <tr>
                <th>ASSIGNMENT NAME</th>
                <th>TYPE</th>
                <th>START DATE</th>
                <th>STATUS</th>
                <th>DUE DATE</th>
                <th className="all-asgn-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="all-asgn-center all-asgn-p-50">Loading assignments...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                <tr><td colSpan="6" className="all-asgn-center all-asgn-p-50">No assessments found.</td></tr>
              ) : (
                filteredAssignments.map((item) => {
                  const submission = submissionMap[item._id];
                  const isCompleted = Boolean(submission);
                  const scoreValue = submission?.status === 'graded' ? submission?.score : null;
                  const isMcq = (item.type || '').toLowerCase() === 'mcq';

                  return (
                    <tr key={item._id} className="all-asgn-row">
                      <td data-label="Assignment">
                        <div className="all-asgn-flex-cell">
                          <div className="all-asgn-icon-wrapper">
                            <BookOpen size={20} />
                          </div>
                          <div className="all-asgn-content-stack">
                            <div className="all-asgn-name-text">{item.title}</div>
                            <div className="all-asgn-sub-tag">{isMcq ? 'MCQ Assessment' : 'Practical Submission'}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Type">
                        <span className="all-asgn-batch-tag">{isMcq ? 'MCQ' : 'Practical'}</span>
                      </td>
                      <td data-label="Start Date">
                        <div className="all-asgn-date-info">
                          <Calendar size={14} />
                          <span>{item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : '-'}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className={`all-asgn-pill ${isCompleted ? 'all-asgn-done' : 'all-asgn-wait'}`}>
                          {isCompleted ? <CheckCircle2 size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                          <span>{isCompleted ? 'Completed' : 'Pending'}</span>
                        </div>
                      </td>
                      <td data-label="Due Date">
                        <div className="all-asgn-date-info">
                          <Calendar size={14} />
                          <span>{new Date(item.lastDate).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="all-asgn-center">
                        {isCompleted ? (
                          <div className="all-asgn-action-wrap">
                            <div className="all-asgn-score-box" style={submission?.isLate ? { background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' } : {}}>
                              Score: {scoreValue !== null && scoreValue !== undefined ? (submission?.isLate ? `${scoreValue} (Late)` : scoreValue) : 'Pending Review'}
                            </div>
                            <button
                              type="button"
                              className="all-asgn-feedback-btn"
                              title="View Instructor Feedback"
                              onClick={() => openFeedbackModal(item.title, submission?.feedback)}
                            >
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="all-asgn-btn-action"
                            onClick={() => navigate(isMcq ? `/student/mcq-test/${item._id}` : `/student/assignment-detail/${item._id}`)}
                          >
                            {isMcq ? 'Start MCQ' : 'Start Task'} <ChevronRight size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {feedbackModal.open && (
        <div className="all-asgn-modal-overlay" onClick={() => setFeedbackModal({ open: false, title: '', feedback: '' })}>
          <div className="all-asgn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="all-asgn-modal-head">
              <h3>{feedbackModal.title} - Feedback</h3>
              <button
                type="button"
                className="all-asgn-modal-close"
                onClick={() => setFeedbackModal({ open: false, title: '', feedback: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="all-asgn-feedback-content">
              {feedbackModal.feedback}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAssesmentlist;
