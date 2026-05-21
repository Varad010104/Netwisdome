import React, { useState } from 'react';
import { Calendar as CalendarIcon, ClipboardList, CheckCircle2, Save, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DailyProgress.css';

const DailyProgress = () => {
  const navigate = useNavigate();
  const [logData, setLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    tasksCompleted: ''
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert("Progress Log Saved Successfully!");
    console.log("Logged Data:", logData);
  };

  return (
    <div className="progress-page">
      <div className="progress-container">
        {/* Header */}
        <header className="progress-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Back
          </button>
          <div className="title-group">
            <h1>Daily Progress Log</h1>
            <p>Track your daily learning and tasks</p>
          </div>
        </header>

        {/* Log Form Card */}
        <div className="log-card">
          <form onSubmit={handleSave}>
            
            {/* Date Selector */}
            <div className="input-group">
              <label><CalendarIcon size={18} /> Select Date</label>
              <input 
                type="date" 
                className="modern-input"
                value={logData.date}
                onChange={(e) => setLogData({...logData, date: e.target.value})}
              />
            </div>

            {/* Progress Description */}
            <div className="input-group">
              <label><ClipboardList size={18} /> Progress Description</label>
              <textarea 
                placeholder="What did you learn today? Describe your progress..."
                className="modern-textarea"
                value={logData.description}
                onChange={(e) => setLogData({...logData, description: e.target.value})}
              />
            </div>

            {/* Tasks Completed */}
            <div className="input-group">
              <label><CheckCircle2 size={18} /> Tasks Completed</label>
              <textarea 
                placeholder="List the tasks you finished (e.g., Solved 5 Python problems, Finished UI design...)"
                className="modern-textarea small"
                value={logData.tasksCompleted}
                onChange={(e) => setLogData({...logData, tasksCompleted: e.target.value})}
              />
            </div>

            {/* Save Button */}
            <button type="submit" className="save-log-btn">
              <Save size={20} /> Save Progress Log
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default DailyProgress;
