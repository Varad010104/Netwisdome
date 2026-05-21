import React, { useState, useEffect } from "react";
import { Trophy, CheckCircle, XCircle, Home, Eye, ChevronUp, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Result save karnyasaathi
import "./MCQResult.css";
import { getStoredUserInfo } from "../../utils/userInfo";

const MCQResult = ({ questions, userAnswers, assignmentInfo }) => {
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Logic: User ne select keleli string vs Backend chi correct string compare karne
  const score = questions.reduce((acc, q, index) => {
    // Backend questions madhe field 'correctAnswer' aahe
    return acc + (userAnswers[index] === q.correctAnswer ? 1 : 0);
  }, 0);

  const percentage = Math.round((score / questions.length) * 100);

  // --- RESULT BACKEND LA SAVE KARNE ---
  useEffect(() => {
    const saveResult = async () => {
      if (isSaved) return;
      try {
        const userInfo = getStoredUserInfo();
        if (!userInfo?._id) return;

        const submissionData = {
          assignmentId: assignmentInfo?._id,
          studentId: userInfo._id,
          studentName: userInfo.name,
          batchName: userInfo.batchId?.batchName || userInfo.batchName || assignmentInfo?.batchId?.batchName || '',
          answers: userAnswers.map((ans, idx) => ({
            questionIndex: idx,
            selectedAnswer: ans
          })),
          score: percentage,
          status: 'graded' // MCQ auto-graded asstat
        };

        await axios.post('http://localhost:5055/api/assignments/submit', submissionData);
        setIsSaved(true);
        console.log("Result saved to database!");
      } catch (err) {
        if (err.response?.status === 409) {
          setIsSaved(true);
          return;
        }
        console.error("Error saving result:", err);
      }
    };

    if (assignmentInfo?._id) {
      saveResult();
    }
  }, [assignmentInfo, userAnswers, percentage, isSaved]);

  return (
    <div className="result-wrapper">
      <div className={`result-card ${showReview ? 'expand' : ''}`}>
        
        <div className="result-header">
          <div className="trophy-container">
            <Trophy size={50} className="trophy-icon" />
            <Star className="star-icon s1" size={16} />
            <Star className="star-icon s2" size={16} />
          </div>
          <h2 className="main-title">Quiz Completed!</h2>
          <p className="sub-text">Test: {assignmentInfo?.title}</p>
        </div>

        <div className="stats-container">
          <div className="score-circle" style={{ 
              background: `conic-gradient(#ff6d00 ${percentage * 3.6}deg, #f1f5f9 0deg)` 
          }}>
            <div className="score-inner">
              <span className="score-num">{percentage}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>

          <div className="pills-row">
            <div className="pill p-correct"><CheckCircle size={16}/> {score} Correct</div>
            <div className="pill p-wrong"><XCircle size={16}/> {questions.length - score} Incorrect</div>
          </div>
        </div>

        <div className="footer-actions">
          <button className="btn-secondary-custom" onClick={() => setShowReview(!showReview)}>
            {showReview ? <ChevronUp size={18} /> : <Eye size={18} />} 
            {showReview ? "Hide Review" : "Detailed Review"}
          </button>
          <button className="btn-primary-custom" onClick={() => navigate("/student/dashboard")}>
            <Home size={18} /> Dashboard
          </button>
        </div>

        {showReview && (
          <div className="review-section-new animate-slide-up">
            <div className="review-title-bar">
                <h3>Detailed Performance Review</h3>
                <div className="review-legend">
                    <span className="l-item"><i className="dot d-c"></i> Correct</span>
                    <span className="l-item"><i className="dot d-w"></i> Incorrect</span>
                </div>
            </div>

            {questions.map((q, index) => {
              const isCorrect = userAnswers[index] === q.correctAnswer;
              return (
                <div key={index} className={`q-review-box ${isCorrect ? 'c-bg' : 'w-bg'}`}>
                  <div className="q-header-row">
                    <span className="q-tag">Question {index + 1}</span>
                    {isCorrect ? <CheckCircle className="s-icon c" size={18}/> : <XCircle className="s-icon w" size={18}/>}
                  </div>
                  
                  <p className="q-text-bold">{q.questionText}</p>

                  <div className="ans-comparison">
                    <div className="ans-unit">
                        <span className="ans-title">YOUR ANSWER:</span>
                        <p className={`ans-val ${isCorrect ? 'c-text' : 'w-text'}`}>
                            {userAnswers[index] || "Not Attempted"}
                        </p>
                    </div>

                    {!isCorrect && (
                      <div className="ans-unit border-left">
                          <span className="ans-title">CORRECT ANSWER:</span>
                          <p className="ans-val c-text">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MCQResult;
