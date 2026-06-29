import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import {
  Search, Clock, Save, RotateCcw, ShieldCheck, Trash2, 
  CheckCircle2, AlertCircle, Filter, BookOpen, User, Calendar, Code
} from 'lucide-react';
import './EvaluationTab.css';

const EvaluationTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  // --- LOGIC (REMAINING UNCHANGED) ---
  const fetchSubmissions = async () => {
    try {
      const res = await API.get('/assignments/submissions/all');
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error fetching submissions:', err); }
    finally { setLoading(false); }
  };

  const fetchBatches = async () => {
    try {
      const res = await API.get('/batches/all');
      setAllBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchBatches();
  }, []);

  const batches = useMemo(() => {
    const namesFromSubmissions = submissions.map((sub) => sub.batchName).filter(Boolean);
    const namesFromBatches = allBatches.map((batch) => batch.batchName).filter(Boolean);
    return ['All', ...Array.from(new Set([...namesFromBatches, ...namesFromSubmissions]))];
  }, [submissions, allBatches]);

  const counts = useMemo(() => {
    const pending = submissions.filter((sub) => sub.status === 'pending').length;
    const graded = submissions.filter((sub) => sub.status === 'graded').length;
    return { total: submissions.length, pending, graded };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchBatch = selectedBatch === 'All' || sub.batchName === selectedBatch;
      const submissionType = (sub.assignmentId?.type || '').toLowerCase();
      const matchType = selectedType === 'all' || submissionType === selectedType;
      const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
      const query = searchTerm.toLowerCase();
      const matchSearch =
        (sub.studentName || '').toLowerCase().includes(query) ||
        (sub.assignmentId?.title || '').toLowerCase().includes(query) ||
        (sub.batchName || '').toLowerCase().includes(query);

      return matchBatch && matchType && matchStatus && matchSearch;
    });
  }, [submissions, selectedBatch, selectedType, statusFilter, searchTerm]);

  const selectSubmission = (sub) => {
    setSelectedSubmission(sub);
    setScore(sub.score ?? '');
    setFeedback(sub.feedback || '');
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSubmission) return;
    try {
      await API.post('/assignments/evaluate', {
        submissionId: selectedSubmission._id,
        score: Number(score),
        feedback
      });
      setSelectedSubmission((prev) => prev ? { ...prev, score: Number(score), feedback, status: 'graded' } : prev);
      await fetchSubmissions();
      alert('Evaluation saved successfully!');
    } catch (err) { alert('Failed to save evaluation.'); }
  };

  const handleDeleteSubmission = async () => {
    if (!selectedSubmission) return;
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await API.delete(`/assignments/submissions/${selectedSubmission._id}`);
      setSelectedSubmission(null);
      setScore('');
      setFeedback('');
      await fetchSubmissions();
      alert('Submission deleted successfully!');
    } catch (err) { alert('Failed to delete submission.'); }
  };

  const isMcqSubmission = (sub) => (sub.assignmentId?.type || '').toLowerCase() === 'mcq';
  const getMcqSelectedAnswer = (sub, index) => {
    const answer = (sub.answers || []).find((a) => Number(a.questionIndex) === Number(index));
    return answer?.selectedAnswer || 'Not Answered';
  };
  const selectedTotalMarks = Number(selectedSubmission?.assignmentId?.totalMarks) || 100;
  // --- END OF LOGIC ---

  if (loading) return (
    <div className="evaluation-loading">
      <div className="spinner"></div>
      <p>Loading Submissions...</p>
    </div>
  );

  return (
    <div className="evaluation-container fade-in">
      <header className="evaluation-header-premium">
        <div className="title-section">
          <div className="icon-box-primary"><BookOpen /></div>
          <div>
            <h2 className="main-title">Evaluation Hub</h2>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span className="sc-label">Total</span>
            <span className="sc-value">{counts.total}</span>
          </div>
          <div className="summary-card pending">
            <span className="sc-label">Pending</span>
            <span className="sc-value">{counts.pending}</span>
          </div>
          <div className="summary-card graded">
            <span className="sc-label">Graded</span>
            <span className="sc-value">{counts.graded}</span>
          </div>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
            <span className="filter-label"><Filter size={14}/> Batches:</span>
            <div className="scroll-filters">
                {batches.map((batch) => (
                <button
                    key={batch}
                    className={`filter-chip ${selectedBatch === batch ? 'active' : ''}`}
                    onClick={() => setSelectedBatch(batch)}
                >
                    {batch}
                </button>
                ))}
            </div>
        </div>

        <div className="filter-divider"></div>

        <div className="toggle-group">
            <button className={`toggle-btn ${selectedType === 'all' ? 'active' : ''}`} onClick={() => setSelectedType('all')}>All Types</button>
            <button className={`toggle-btn ${selectedType === 'mcq' ? 'active' : ''}`} onClick={() => setSelectedType('mcq')}>MCQ</button>
            <button className={`toggle-btn ${selectedType === 'practical' ? 'active' : ''}`} onClick={() => setSelectedType('practical')}>Practical</button>
        </div>

        <div className="toggle-group">
            <button className={`toggle-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All Status</button>
            <button className={`toggle-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
            <button className={`toggle-btn ${statusFilter === 'graded' ? 'active' : ''}`} onClick={() => setStatusFilter('graded')}>Completed</button>
        </div>
      </div>

      <div className="evaluation-layout-premium">
        {/* Left Sidebar */}
        <aside className="submissions-sidebar-premium">
          <div className="sidebar-search-premium">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search student or assignment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="list-wrapper">
            {filteredSubmissions.length === 0 ? (
              <div className="no-data"><AlertCircle size={30}/><p>No results found</p></div>
            ) : (
              filteredSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className={`sub-list-card ${selectedSubmission?._id === sub._id ? 'active' : ''}`}
                  onClick={() => selectSubmission(sub)}
                >
                  <div className="card-indicator"></div>
                  <div className="sub-card-body">
                    <div className="row-justify">
                      <span className="student-name-text"><User size={12}/> {sub.studentName || 'Student'}</span>
                      <span className={`status-tag-mini ${sub.status}`}>{sub.status.toUpperCase()}</span>
                    </div>
                    <p className="assignment-title-text">{sub.assignmentId?.title || 'Assignment'}</p>
                    <div className="row-justify mt-1">
                      <span className="batch-name-mini">{sub.batchName}</span>
                      <span className="date-mini"><Calendar size={10}/> {new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Details Pane */}
        <main className="details-pane-premium">
          {selectedSubmission ? (
            <div className="details-content-view slide-up">
              <div className="view-header">
                <div className="header-student-info">
                   <div className="avatar-big">{selectedSubmission.studentName?.charAt(0) || 'S'}</div>
                   <div>
                        <h3>{selectedSubmission.studentName}</h3>
                        <p className="text-muted">Submitted {selectedSubmission.assignmentId?.title}</p>
                   </div>
                </div>
                <div className="header-meta-tags">
                    <span className={`pill-type ${selectedSubmission.assignmentId?.type}`}>{selectedSubmission.assignmentId?.type}</span>
                    <span className="pill-batch">{selectedSubmission.batchName}</span>
                </div>
              </div>

              <div className="submission-viewer">
                {isMcqSubmission(selectedSubmission) ? (
                  <div className="mcq-grid">
                    {(selectedSubmission.assignmentId?.questions || []).map((q, index) => {
                      const selected = getMcqSelectedAnswer(selectedSubmission, index);
                      const correct = q.correctAnswer;
                      const isCorrect = selected === correct;
                      return (
                        <div key={index} className={`mcq-review-item ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                          <span className="q-number">Question {index + 1}</span>
                          <p className="q-text">{q.questionText}</p>
                          <div className="ans-comparison">
                             <div className="ans-box"><span>Student:</span> <strong>{selected}</strong></div>
                             <div className="ans-box"><span>Correct:</span> <strong>{correct}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="practical-viewer">
                    <div className="viewer-top">
                        <span><Code size={14}/> Source Code Submission</span>
                    </div>
                    <pre className="code-block">
                        <code>{selectedSubmission.practicalAnswer || '// No code submitted'}</code>
                    </pre>
                  </div>
                )}
              </div>

              <div className="grading-footer">
                <div className="grading-controls">
                    <div className="score-input-wrapper">
                        <label>Award Score (0-{selectedTotalMarks})</label>
                        <div className="input-with-limit">
                            <input 
                                type="number" 
                                min="0"
                                max={selectedTotalMarks}
                                value={score} 
                                onChange={(e) => setScore(e.target.value)}
                                placeholder="--"
                            />
                            <span className="limit">/ {selectedTotalMarks}</span>
                        </div>
                    </div>
                    <div className="feedback-wrapper">
                        <label>Instructor Feedback</label>
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Type feedback here..."
                        />
                    </div>
                </div>

                <div className="grading-actions">
                    <button className="btn-icon-danger" onClick={handleDeleteSubmission} title="Delete Submission"><Trash2 size={18}/></button>
                    <div className="right-actions">
                        <button className="btn-outline" onClick={() => selectSubmission(selectedSubmission)}><RotateCcw size={16}/> Reset</button>
                        <button className="btn-primary-eval" onClick={handleSaveEvaluation}><Save size={16}/> Submit Grade</button>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-view">
              <div className="empty-illustration">
                <ShieldCheck size={80} strokeWidth={1} />
              </div>
              <h3>Ready to Evaluate?</h3>
              <p>Select a student submission from the sidebar to begin the review process.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EvaluationTab;
