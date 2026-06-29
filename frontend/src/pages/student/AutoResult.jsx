import React, { useState, useEffect } from 'react';
import API from '../../services/api'; 
import { 
  Trophy, CheckCircle2, MessageSquare, 
  Download, Timer, Rocket, Search
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './AutoResult.css';
import { getStoredUserInfo } from "../../utils/userInfo";

const AutoResult = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Assignment ID
  
  const [loading, setLoading] = useState(true);
  const [submissionData, setSubmissionData] = useState(null);
  const [isGraded, setIsGraded] = useState(false);

  // --- à¤¬à¥…à¤•à¤ à¤‚à¤¡ à¤®à¤§à¥‚à¤¨ à¤¸à¤¬à¤®à¤¿à¤¶à¤¨ à¤¸à¥ à¤Ÿà¥‡à¤Ÿà¤¸ à¤šà¥‡à¤• à¤•à¤°à¤£à¥‡ ---
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // âœ… 1. LocalStorage à¤®à¤§à¥‚à¤¨ à¤µà¤¿à¤¦à¥ à¤¯à¤¾à¤°à¥ à¤¥à¥ à¤¯à¤¾à¤šà¥€ ID à¤®à¤¿à¤³à¤µà¤¾
        const userInfo = getStoredUserInfo();
        const studentId = userInfo?._id;

        // âœ… 2. API à¤•à¥‰à¤²à¤®à¤§à¥ à¤¯à¥‡ Assignment ID à¤†à¤£à¤¿ Student ID à¤¦à¥‹à¤¨à¥ à¤¹à¥€ à¤ªà¤¾à¤ à¤µà¤¾
        // à¤¤à¥ à¤ à¥ à¤¯à¤¾ à¤¬à¥…à¤•à¤ à¤‚à¤¡ à¤°à¥‚à¤Ÿà¤¨à¥ à¤¸à¤¾à¤° à¤¹à¥‡ à¤®à¥‰à¤¡à¤¿à¤«à¤¾à¤¯ à¤•à¤°à¤¾à¤µà¥‡ à¤²à¤¾à¤—à¥‡à¤², à¤‰à¤¦à¤¾: /submission/:assignmentId/:studentId
        const response = await API.get(`/assignments/submission/${id}/${studentId}`);
        const data = response.data;
        
        if (data) {
          setSubmissionData(data);
          // à¤œà¤° à¤¸à¥ à¤Ÿà¥‡à¤Ÿà¤¸ 'graded' à¤…à¤¸à¥‡à¤² à¤¤à¤° à¤°à¤¿à¤ à¤²à¥ à¤Ÿ à¤¸à¥ à¤•à¥ à¤°à¥€à¤¨ à¤¦à¤¾à¤–à¤µà¤¾
          if (data.status === 'graded') {
            setIsGraded(true);
          }
        }
      } catch (error) {
        console.error("Error fetching submission status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) checkStatus();
  }, [id]);

  if (loading) return (
    <div className="result-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h3>Verifying Submission Status...</h3>
    </div>
  );

  return (
    <div className="result-page">
      <div className="result-container">
        
        {/* Premium Page Header */}
        <header className="result-header-simple" style={{ marginBottom: '40px' }}>
          <div className="header-left">
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--brand-dark)' }}>Assessment Results</h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>Review your grade details and instructor feedback</p>
          </div>
          {isGraded && (
            <button className="download-btn-premium">
              <Download size={18} /> Download Report
            </button>
          )}
        </header>

        {!isGraded ? (
         
          <div className="status-card-premium card">
            <div className="status-content">
              <div className="icon-wrapper-animate">
                <Rocket size={40} className="rocket-icon" />
              </div>
              
              <h2 className="status-title">Submission Successful!</h2>
              <p className="status-subtitle">Your code is safely stored. Instructors will review it manually.</p>
              
              <div className="timeline-container">
                <div className="timeline-item completed">
                  <div className="timeline-icon"><CheckCircle2 size={16}/></div>
                  <div className="timeline-text">Uploaded</div>
                </div>
                <div className="timeline-item active">
                  <div className="timeline-icon pulse"><Search size={16}/></div>
                  <div className="timeline-text">Reviewing</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon"><Trophy size={16}/></div>
                  <div className="timeline-text">Results</div>
                </div>
              </div>

              <div className="notice-banner">
                <Timer size={18} />
                <span>Result will be declared after manual review.</span>
              </div>

              <button className="btn-primary-premium" onClick={() => navigate('/student/dashboard')} style={{ marginTop: '30px' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
         
          <div className="result-graded-wrapper">
            <div className="result-grid-layout">
              <div className="score-card-premium card">
                <div className="score-details">
                  <span className="label-text">Final Grade</span>
                  <div className="score-numbers">
                    <span className="big-score">{submissionData?.score || 0}</span>
                    <span className="score-total">/ 100</span>
                  </div>
                </div>
                <div className="chart-container">
                    <div className="circular-progress-box">
                       <svg viewBox="0 0 36 36" className="circular-chart-v2">
                         <path className="circle-bg-v2" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                         <path className="circle-v2" strokeDasharray={`${submissionData?.score || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                       </svg>
                       <div className="percentage-text">{submissionData?.score || 0}%</div>
                    </div>
                </div>
              </div>

              <div className="feedback-card-premium card">
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} style={{ color: 'var(--brand-orange)' }} />
                  <h3>Instructor's Feedback</h3>
                </div>
                <div className="feedback-content-box" style={{ marginTop: '15px' }}>
                  {submissionData?.feedback || "Great effort! Keep practicing."}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button className="btn-primary-premium" onClick={() => navigate('/student/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoResult;
