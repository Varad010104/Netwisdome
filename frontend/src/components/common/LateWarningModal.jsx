import React from 'react';
import { AlertTriangle, Clock, X, CheckCircle, ChevronRight } from 'lucide-react';
import './LateWarningModal.css';

const LateWarningModal = ({ isOpen, onClose, onConfirm, dueDate, type = 'practical' }) => {
  if (!isOpen) return null;

  const formattedDueDate = dueDate 
    ? new Date(dueDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown Date';

  return (
    <div className="late-modal-overlay" onClick={onClose}>
      <div className="late-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="late-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header Icon */}
        <div className="late-modal-header-icon">
          <div className="icon-pulse-glow"></div>
          <AlertTriangle size={32} className="warning-svg" />
        </div>

        {/* Modal Title */}
        <h2 className="late-modal-title">Due Date Passed!</h2>
        <div className="late-modal-subtitle">
          <Clock size={14} />
          <span>Deadline was {formattedDueDate}</span>
        </div>

        {/* Modal Body */}
        <div className="late-modal-body">
          <p className="late-warning-highlight">
            You are attempting to submit this {type === 'mcq' ? 'MCQ test' : 'practical assignment'} after the official due date.
          </p>
          <div className="late-rules-card">
            <div className="rule-item">
              <span className="rule-bullet red"></span>
              <p>You can still submit to record your attempts and practice code.</p>
            </div>
            <div className="rule-item">
              <span className="rule-bullet red"></span>
              <p><strong>Strict Enforcement:</strong> This submission will be automatically marked as <strong>Failed</strong> with <strong>0 Marks</strong> in the system gradebook.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="late-modal-footer">
          <button className="btn-cancel-late" onClick={onClose}>
            Cancel & Review
          </button>
          <button className="btn-confirm-late" onClick={onConfirm}>
            Submit Anyway (0 Marks)
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LateWarningModal;
