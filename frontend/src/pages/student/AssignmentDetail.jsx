import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { 
  FileText, Info, AlertCircle, Send, Code2, 
  ChevronLeft, CheckCircle2, Clock, BookOpen, Target
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './AssignmentDetail.css';
import { getStoredUserInfo } from "../../utils/userInfo";

const AssignmentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeQuestion, setActiveQuestion] = useState(null);
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for UX
  const [studentBatchName, setStudentBatchName] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const userInfo = getStoredUserInfo();
        const bName = userInfo?.batchId?.batchName || userInfo?.batchName || '';
        setStudentBatchName(bName);

        const res = await axios.get(`http://localhost:5055/api/assignments/all`);
        const found = res.data.find(item => item._id === id);
        if (found) {
          setActiveQuestion(found);
        }
      } catch (err) {
        console.error("Error fetching detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim()) {
      alert("Please enter your solution before submitting.");
      return;
    }
    
    setIsSubmitting(true); // Disable button & show spinner
    
    try {
      const userInfo = getStoredUserInfo();
      if (!userInfo) {
        alert("You must be logged in to submit.");
        navigate('/');
        return;
      }

      const submissionData = {
        assignmentId: id,
        studentId: userInfo._id,
        studentName: userInfo.name,
        batchName: userInfo.batchId?.batchName || userInfo.batchName || activeQuestion?.batchId?.batchName || '',
        practicalAnswer: submission,
        status: 'pending'
      };
      
      await axios.post('http://localhost:5055/api/assignments/submit', submissionData);
      navigate(`/student/assignment/result/${id}`);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Error submitting assignment. Please try again.");
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <h2>Preparing Workspace...</h2>
      <p style={{color: '#64748b', marginTop: '8px'}}>Fetching assignment details safely.</p>
    </div>
  );
  
  if (!activeQuestion) return (
    <div className="error-screen">
      <AlertCircle size={48} color="#ef4444" style={{marginBottom: '16px'}} />
      <h3>Assignment Not Found!</h3>
      <button onClick={handleBack} className="submit-action-btn" style={{marginTop: '20px'}}>
        Go Back
      </button>
    </div>
  );

  const batchDisplayName =
    activeQuestion.batchId?.batchName ||
    activeQuestion.batchName ||
    studentBatchName ||
    "General Batch";

  return (
    <div className="assignment-page-wrapper">
      <header className="premium-nav">
        <div className="nav-left">
          <button className="back-circle-btn" onClick={handleBack} title="Go Back">
            <ChevronLeft size={22} />
          </button>
          <div className="title-block">
            <div className="badge-row">
              <span className="type-badge">PRACTICAL</span>
              <span className="batch-badge">{batchDisplayName}</span>
            </div>
            <h1>{activeQuestion.title}</h1>
          </div>
        </div>
        
        <div className="nav-right">
          <div className="status-pill animated-pulse">
            <div className="pulse-dot"></div>
            <Clock size={16} /> 
            <span>Active Submission</span>
          </div>
        </div>
      </header>

      <main className="assignment-content">
        <div className="details-sidebar custom-scrollbar">
          {/* Problem Statement Card */}
          <section className="info-card">
            <div className="ad-card-header">
              <div className="ad-icon-box purple">
                <BookOpen size={20} />
              </div>
              <h3>Problem Statement</h3>
            </div>
            <div className="problem-content">
              {activeQuestion.questionText || activeQuestion.description || "No description provided."}
            </div>
          </section>

          {/* Quick Info Grid */}
          <section className="info-card">
            <div className="ad-card-header">
              <div className="ad-icon-box orange">
                <Target size={20} />
              </div>
              <h3>Guidelines</h3>
            </div>
            <div className="guidelines-list">
              <div className="guide-item">
                <CheckCircle2 size={18} className="text-green" />
                <span><strong>Total Marks:</strong> {activeQuestion.totalMarks || 0} Points</span>
              </div>
              <div className="guide-item">
                <CheckCircle2 size={18} className="text-green" />
                <span><strong>Deadline:</strong> {new Date(activeQuestion.lastDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="guide-item">
                <CheckCircle2 size={18} className="text-green" />
                <span><strong>Format:</strong> Source Code / Logic Explanation</span>
              </div>
            </div>
          </section>

          {/* Grading Rubric Card */}
          <section className="info-card highlight-border">
            <div className="ad-card-header">
              <div className="ad-icon-box red">
                <AlertCircle size={20} />
              </div>
              <h3>Instructions & Rubric</h3>
            </div>
            <div className="rubric-box">
              {activeQuestion.rubric || "Submit your solution following standard coding practices. Ensure your logic is clear for full marks."}
            </div>
          </section>
        </div>

        <div className="editor-workspace">
          <div className="editor-container">
            <div className="editor-header">
              <div className="header-left">
                {/* Visual Mac-style window controls for IDE aesthetic */}
                <div className="mac-controls">
                  <div className="mac-dot red"></div>
                  <div className="mac-dot yellow"></div>
                  <div className="mac-dot green"></div>
                </div>
                <Code2 size={18} className="text-orange" />
                <h3>Solution Workspace</h3>
              </div>
              <div className="header-right">
                <span className="lang-indicator">CODE / TEXT</span>
              </div>
            </div>
            
            <textarea 
              className="code-editor-area custom-scrollbar"
              placeholder="// Type or paste your solution here...&#10;// Make sure to explain your logic if required."
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              spellCheck="false"
            />
            
            <div className="editor-footer">
              <p className="footer-note">Ensure your code is complete before submitting. You cannot undo this action.</p>
              <button 
                className="submit-action-btn" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Assignment</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentDetail;