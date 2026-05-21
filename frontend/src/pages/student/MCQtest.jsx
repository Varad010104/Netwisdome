import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; 
import axios from "axios"; 
import { ChevronRight, ChevronLeft, Timer, Award, AlertCircle, HelpCircle } from "lucide-react";
import MCQResult from "./MCQResult";
import "./MCQtest.css";
import { getStoredUserInfo } from "../../utils/userInfo";

const MCQtest = () => {
  const { id } = useParams(); 
  const [questions, setQuestions] = useState([]); 
  const [assignmentInfo, setAssignmentInfo] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [answers, setAnswers] = useState([]); 
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentBatchName, setStudentBatchName] = useState(""); // âœ… à¤µà¤¿à¤¦à¥à¤¯à¤¾à¤°à¥à¤¥à¥à¤¯à¤¾à¤šà¥‡ à¤¬à¥…à¤š à¤¨à¤¾à¤µ

  // --- à¥§. à¤¬à¥…à¤•à¤à¤‚à¤¡ à¤®à¤§à¥‚à¤¨ à¤…à¤¸à¤¾à¤‡à¤¨à¤®à¥‡à¤‚à¤Ÿ à¤²à¥‹à¤¡ à¤•à¤°à¤£à¥‡ ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // âœ… LocalStorage à¤®à¤§à¥‚à¤¨ à¤¬à¥…à¤š à¤¨à¤¾à¤µ à¤®à¤¿à¤³à¤µà¤¾ (à¤¡à¥…à¤¶à¤¬à¥‹à¤°à¥à¤¡à¤šà¤¾ à¤°à¥‡à¤«à¤°à¤¨à¥à¤¸)
        const userInfo = getStoredUserInfo();
        const bName = userInfo?.batchId?.batchName || userInfo?.batchName || "Active Batch";
        setStudentBatchName(bName);

        const res = await axios.get(`http://localhost:5055/api/assignments/all`);
        const quiz = res.data.find(q => q._id === id);
        
        if (quiz) {
          setQuestions(quiz.questions);
          setAssignmentInfo(quiz);
          setAnswers(new Array(quiz.questions.length).fill(null));
          
          const durationInSeconds = (quiz.totalDuration || 10) * 60;
          setTimeLeft(durationInSeconds);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // --- à¥¨. à¤—à¥à¤²à¥‹à¤¬à¤² à¤Ÿà¤¾à¤‡à¤®à¤° à¤²à¥‰à¤œà¤¿à¤• ---
  useEffect(() => {
    if (!loading && questions.length > 0 && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !loading && questions.length > 0 && !isFinished) {
      handleFinalSubmit();
    }
  }, [timeLeft, loading, questions.length, isFinished]);

  // --- à¥©. à¤¨à¥‡à¤µà¥à¤¹à¤¿à¤—à¥‡à¤¶à¤¨ à¤²à¥‰à¤œà¤¿à¤• ---
  const handleOptionClick = (option) => {
    setSelectedOption(option);
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = option;
    setAnswers(updatedAnswers);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      const prevIdx = currentQuestion - 1;
      setCurrentQuestion(prevIdx);
      setSelectedOption(answers[prevIdx]); 
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      setSelectedOption(answers[nextIdx]); 
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = () => {
    setIsFinished(true);
  };

  if (loading) return <div className="mcq-wrapper"><h3>Initializing Test Environment...</h3></div>;
  if (questions.length === 0) return <div className="mcq-wrapper"><h3>No questions found!</h3></div>;

  if (isFinished) {
    return <MCQResult questions={questions} userAnswers={answers} assignmentInfo={assignmentInfo} />;
  }

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="mcq-wrapper">
      <div className="mcq-card main-quiz animate-fade-in">
        
        <div className="mcq-header">
          <div className="test-info">
            <div className="icon-badge-modern">
              <Award className="icon-orange" size={24} />
            </div>
            <div>
              <h3 className="test-title">{assignmentInfo?.title}</h3>
              {/* âœ… à¤¬à¤¦à¤²: à¤‡à¤¥à¥‡ à¤†à¤¤à¤¾ ID à¤à¤µà¤œà¥€ à¤‘à¤Ÿà¥‹à¤®à¥…à¤Ÿà¤¿à¤• à¤¬à¥…à¤š à¤¨à¤¾à¤µ (à¤‰à¤¦à¤¾. JAN-2026) à¤¦à¤¿à¤¸à¥‡à¤² */}
              <span className="batch-tag">Batch: {assignmentInfo?.batchId?.batchName || studentBatchName}</span>
            </div>
          </div>
          
          <div className={`timer-pill ${timeLeft < 60 ? 'warning pulse-red' : ''}`}>
            <Timer size={18} />
            <span className="timer-countdown">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="progress-section">
            <div className="progress-labels-row">
                <span className="progress-text">Question {currentQuestion + 1} of {questions.length}</span>
                <span className="progress-percent">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>

        <div className="question-box">
          <div className="q-label">
            <HelpCircle size={16} /> Question {currentQuestion + 1}
          </div>
          <h2 className="question-display">{questions[currentQuestion].questionText}</h2>
        </div>

        <div className="options-grid-modern">
          {questions[currentQuestion].options.map((option, index) => (
            <div
              key={index}
              className={`option-item ${selectedOption === option ? "selected" : ""}`}
              onClick={() => handleOptionClick(option)}
            >
              <div className="option-prefix">{String.fromCharCode(65 + index)}</div>
              <p className="option-text">{option}</p>
              <div className={`custom-radio ${selectedOption === option ? "checked" : ""}`}></div>
            </div>
          ))}
        </div>

        <div className="mcq-footer-modern">
          <div className="footer-btns-left">
              <button 
                className="btn-back-modern" 
                onClick={handleBack}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft size={20} />
                Previous
              </button>
          </div>

          <div className="footer-right-group">
              {selectedOption === null && (
                <div className="tip-box mobile-hide">
                  <AlertCircle size={14} />
                  <span>Choose an answer</span>
                </div>
              )}
              <button 
                className={`btn-submit-modern ${currentQuestion === questions.length - 1 ? 'final' : ''}`} 
                onClick={handleNext}
              >
                {currentQuestion === questions.length - 1 ? "Finish Test" : "Save & Next"}
                <ChevronRight size={20} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQtest;
