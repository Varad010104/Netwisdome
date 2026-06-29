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
import './AssignmentList.css';
import { getStoredUserInfo } from "../../utils/userInfo";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

const AssignmentList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    feedback: ''
  });

  useEffect(() => {
    const fetchPracticals = async () => {
      try {
        const userInfo = getStoredUserInfo();

        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();
        const studentId = userInfo?._id?.toString();

        const [assignmentRes, submissionRes] = await Promise.all([
          API.get('/assignments/all'),
          API.get('/assignments/submissions/all')
        ]);

        const practicalAssignments = (assignmentRes.data || []).filter(
          (asgn) => asgn.type === 'practical' && assignmentMatchesBatch(asgn, studentBatchId)
        );
        setAssignments(practicalAssignments);

        const assignmentIdSet = new Set(practicalAssignments.map((item) => item._id?.toString()));
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

    fetchPracticals();
  }, []);

  const getAssignmentStatus = (assignmentId) => (submissionMap[assignmentId] ? 'Completed' : 'Pending');
  const openFeedbackModal = (assignmentTitle, feedbackText) => {
    setFeedbackModal({
      open: true,
      title: assignmentTitle || 'Assignment',
      feedback: feedbackText || 'Instructor feedback is not available yet.'
    });
  };

  const filteredAssignments = assignments.filter((asgn) => {
    const matchesSearch = asgn.title.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = getAssignmentStatus(asgn._id);
    const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="asgn-list-page animate-fade-in">
      <div className="asgn-list-container">
        <header className="asgn-list-header">
          <div className="asgn-header-top">
            <button className="asgn-back-btn" onClick={() => navigate('/student/dashboard')}>
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
          </div>

          <div className="asgn-header-main">
            <h1 className="asgn-main-heading">Practical Task List</h1>
            <div className="asgn-search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="asgn-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="asgn-filter-card">
          <div className="asgn-filter-left">
            <div className="asgn-filter-label">
              <Filter size={16} />
              <span>Filter Status:</span>
            </div>
            <select className="asgn-custom-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Tasks</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="asgn-stats mobile-hide">
            Showing <strong>{filteredAssignments.length}</strong> Practical Tasks
          </div>
        </div>

        <div className="asgn-table-wrapper">
          <table className="asgn-modern-table">
            <thead>
              <tr>
                <th>ASSIGNMENT NAME</th>
                <th>START DATE</th>
                <th>STATUS</th>
                <th>DUE DATE</th>
                <th className="text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center pad-50">Loading assignments...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                <tr><td colSpan="5" className="text-center pad-50">No tasks found for your batch.</td></tr>
              ) : (
                filteredAssignments.map((item) => {
                  const submission = submissionMap[item._id];
                  const isCompleted = Boolean(submission);
                  const scoreValue = submission?.status === 'graded' ? submission?.score : null;

                  return (
                    <tr key={item._id} className="asgn-table-row">
                      <td data-label="Assignment">
                        <div className="asgn-info-cell">
                          <div className="asgn-icon-box">
                            <BookOpen size={20} />
                          </div>
                          <div className="asgn-text-group">
                            <div className="asgn-primary-title">{item.title}</div>
                            <div className="asgn-secondary-tag">Practical Submission</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Start Date">
                        <div className="asgn-date-display">
                          <Calendar size={14} />
                          <span>{item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : '-'}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className={`asgn-status-pill ${isCompleted ? 'completed' : 'pending'}`}>
                          {isCompleted ? <CheckCircle2 size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                          <span>{isCompleted ? 'Completed' : 'Pending'}</span>
                        </div>
                      </td>
                      <td data-label="Due Date">
                        <div className="asgn-date-display">
                          <Calendar size={14} />
                          <span>{new Date(item.lastDate).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        {isCompleted ? (
                          <div className="asgn-action-wrap">
                            <div className="asgn-score-badge" style={submission?.isLate ? { background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' } : {}}>
                              Score: {scoreValue !== null && scoreValue !== undefined ? (submission?.isLate ? `${scoreValue} (Late)` : scoreValue) : 'Pending Review'}
                            </div>
                            <button
                              type="button"
                              className="asgn-feedback-btn"
                              title="View Instructor Feedback"
                              onClick={() => openFeedbackModal(item.title, submission?.feedback)}
                            >
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        ) : (
                          <button className="asgn-action-btn" onClick={() => navigate(`/student/assignment-detail/${item._id}`)}>
                            Start Task <ChevronRight size={16} />
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
        <div className="asgn-modal-overlay" onClick={() => setFeedbackModal({ open: false, title: '', feedback: '' })}>
          <div className="asgn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="asgn-modal-head">
              <h3>{feedbackModal.title} - Feedback</h3>
              <button
                type="button"
                className="asgn-modal-close"
                onClick={() => setFeedbackModal({ open: false, title: '', feedback: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="asgn-feedback-content">
              {feedbackModal.feedback}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
