import React from "react";
import "./TopStats.css";
import { CheckCircle, Clock, TrendingUp, ChevronRight } from "lucide-react";

const TopStats = () => {
  return (
    <div className="top-stats-container">
      {/* Completed Card */}
      <div className="stat-card">
        <div className="card-header">
          <div className="header-left">
            <div className="icon-circle">
              <CheckCircle size={20} strokeWidth={3} />
            </div>
            <div className="title-info">
              <h4>Completed</h4>
              <p className="sub-text">Performance: 92%</p>
            </div>
          </div>
          <div className="status-pill">
            <TrendingUp size={12} /> +4.2%
          </div>
        </div>

        <div className="assignment-mini-list">
          <div className="mini-item">
            <span>Python</span>
            <span className="mini-score">95%</span>
          </div>
          <div className="mini-item">
            <span>UI/UX</span>
            <span className="mini-score">92%</span>
          </div>
        </div>
      </div>

      {/* Pending Card */}
      <div className="stat-card">
        <div className="card-header">
          <div className="header-left">
            <div className="icon-circle">
              <Clock size={20} strokeWidth={3} />
            </div>
            <div className="title-info">
              <h4>Pending</h4>
              <p className="sub-text">Target: 90%+</p>
            </div>
          </div>
          <div className="status-pill" style={{background: '#f1f5f9', color: '#64748b'}}>
            Track
          </div>
        </div>

        <div className="assignment-mini-list">
          <div className="mini-item">
            <span>ML Quiz</span>
            <ChevronRight size={14} color="#ff6d00" />
          </div>
          <div className="mini-item">
            <span>React</span>
            <ChevronRight size={14} color="#ff6d00" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopStats;
