import React, { useState } from 'react';
import {
  FileText, Download, Eye, CheckCircle2,
  Layers, Bookmark, ArrowRight, PlayCircle,
  HelpCircle, MessageSquare, Award, Sparkles
} from 'lucide-react';
import './LessonViewer.css';

const LessonViewer = ({ note, onPreviewFile, API_BASE }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!note) {
    return (
      <div className="viewer-empty-wrapper">
        <div className="viewer-empty-card text-center">
          <div className="empty-icon-bounce">
            <Layers size={44} />
          </div>
          <h3>Welcome to the Netwisdome LMS</h3>
          <p>Please select a topic and lesson from the navigation sidebar on the left to start exploring study notes and files.</p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes, decimals = 2) => {
    const numericBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (!numericBytes || isNaN(numericBytes) || numericBytes <= 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numericBytes) / Math.log(k));
    return parseFloat((numericBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    const type = typeof fileType === 'string' ? fileType.toLowerCase() : '';
    switch (type) {
      case 'pdf':
        return <FileText className="res-icon pdf" size={18} />;
      case 'doc':
      case 'docx':
        return <FileText className="res-icon doc" size={18} />;
      case 'ppt':
      case 'pptx':
        return <Layers className="res-icon ppt" size={18} />;
      case 'zip':
        return <Layers className="res-icon zip" size={18} />;
      default:
        return <FileText className="res-icon default" size={18} />;
    }
  };

  const handleDownload = (file) => {
    if (!file || !file.fileUrl) return;
    const fileUrl = `${API_BASE}${file.fileUrl}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.originalName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="lms-lesson-viewer">
      {/* Top action bar */}
      <div className="viewer-top-action-bar">
        <span className="topic-breadcrumb">
          {note?.courseId?.courseName || 'Course'} <ArrowRight size={12} /> {note?.topicTitle || 'General'}
        </span>

        <div className="action-buttons-group">
          {/* <button 
            className={`viewer-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark size={15} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button> */}

          {/* <button
            className={`viewer-action-btn complete-btn ${isCompleted ? 'completed' : ''}`}
            onClick={() => setIsCompleted(!isCompleted)}
          >
            <CheckCircle2 size={15} />
            <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
          </button> */}
        </div>
      </div>

      {/* Main lesson content */}
      <div className="viewer-scroll-content">

        {/* Banner area */}
        {note?.thumbnail ? (
          <div className="viewer-banner-media">
            <img src={`${API_BASE}${note.thumbnail}`} alt={note?.lessonTitle || 'Lesson Thumbnail'} />
            <div className="banner-gradient-overlay"></div>
          </div>
        ) : (
          <div className="viewer-banner-fallback">
            <Layers size={48} className="banner-fallback-icon" />
            <div className="fallback-glow-orb"></div>
          </div>
        )}

        {/* Lesson main details */}
        <div className="viewer-lesson-header">
          <span className="topic-context-tag">{note?.topicTitle || 'General'}</span>
          <h1 className="viewer-lesson-title">{note?.lessonTitle || 'Untitled Lesson'}</h1>

          {/* Quick Stats */}
          <div className="quick-stats-row">
            <span className="quick-stat">
              Level: <strong>{note?.courseId?.level || 'Beginner'}</strong>
            </span>
            <span className="quick-stat">
              Category: <strong>{note?.courseId?.category || 'General'}</strong>
            </span>
            {isCompleted && (
              <span className="completion-toast-tag">
                <CheckCircle2 size={12} />
                Lesson Completed
              </span>
            )}
          </div>
        </div>

        {/* Lesson description */}
        <div className="viewer-description-section">
          <h2>Lesson Overview</h2>
          <p className="lesson-description-text">
            {note?.lessonDescription || 'No description provided for this lesson module.'}
          </p>
        </div>

        {/* Learning Materials attached */}
        <div className="viewer-resources-section">
          <h2>Attached Learning Materials</h2>
          {Array.isArray(note?.uploadedFiles) && note.uploadedFiles.length > 0 ? (
            <div className="student-resources-grid">
              {note.uploadedFiles.map((file, idx) => (
                <div key={file?._id || idx} className="student-resource-card">
                  <div className="card-left-info">
                    <div className="file-icon-box">
                      {getFileIcon(file?.fileType)}
                    </div>
                    <div className="file-meta-text">
                      <h4 title={file?.originalName || 'Unnamed File'}>{file?.originalName || 'Unnamed File'}</h4>
                      <span>{formatBytes(file?.fileSize)} • {(file?.fileType || 'FILE').toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="card-right-actions">
                    <button
                      className="res-action-btn view-btn"
                      onClick={() => onPreviewFile(file)}
                      title="Preview in Sandbox"
                    >
                      <Eye size={15} />
                      <span>Preview</span>
                    </button>
                    <button
                      className="res-action-btn download-btn"
                      onClick={() => handleDownload(file)}
                      title="Download file to computer"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-materials-card">
              <p>No learning materials have been attached to this lesson yet.</p>
            </div>
          )}
        </div>



      </div>
    </div>
  );
};

export default LessonViewer;
