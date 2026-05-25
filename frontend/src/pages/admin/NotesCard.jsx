import React from 'react';
import { 
  FileText, Edit, Trash2, Calendar, 
  Layers, Users, Eye, EyeOff, FileIcon,
  Download, ArrowRight
} from 'lucide-react';
import './NotesCard.css';

const NotesCard = ({ note, onEdit, onDelete, API_BASE }) => {
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="file-icon pdf" size={16} />;
      case 'doc':
      case 'docx':
        return <FileIcon className="file-icon doc" size={16} />;
      case 'ppt':
      case 'pptx':
        return <Layers className="file-icon ppt" size={16} />;
      case 'zip':
        return <Layers className="file-icon zip" size={16} />;
      default:
        return <FileText className="file-icon default" size={16} />;
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const isPublished = note.visibilityStatus === 'published';

  return (
    <div className="premium-notes-card">
      <div className="card-accent-border"></div>
      
      {/* Thumbnail or fallback gradient */}
      <div className="notes-card-media">
        {note.thumbnail ? (
          <img src={`${API_BASE}${note.thumbnail}`} alt={note.lessonTitle} className="notes-card-img" />
        ) : (
          <div className="notes-card-media-fallback">
            <Layers size={36} className="fallback-media-icon" />
            <div className="fallback-media-glow"></div>
          </div>
        )}
        <div className="notes-badge-container">
          <span className={`status-badge ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
            {note.visibilityStatus}
          </span>
        </div>
      </div>

      <div className="notes-card-body">
        {/* Course and Batch Tags */}
        <div className="notes-card-meta-tags">
          <span className="meta-tag course-tag">
            <Layers size={12} />
            {note.courseId?.courseName || 'Unassigned Course'}
          </span>
          <span className="meta-tag batch-tag">
            <Users size={12} />
            {note.batchId?.batchName || 'All Batches'}
          </span>
        </div>

        {/* Lesson Title and Topic */}
        <div className="notes-card-titles">
          <span className="topic-subtitle">{note.topicTitle}</span>
          <h3 className="lesson-main-title">{note.lessonTitle}</h3>
        </div>

        {/* Description */}
        <p className="lesson-card-description">
          {note.lessonDescription || 'No description provided for this lesson module.'}
        </p>

        {/* File Attachments */}
        <div className="notes-card-attachments">
          <div className="attachments-header">
            <span>Resources ({note.uploadedFiles?.length || 0})</span>
          </div>
          {note.uploadedFiles && note.uploadedFiles.length > 0 ? (
            <div className="attachments-list">
              {note.uploadedFiles.map((file, idx) => (
                <div key={file._id || idx} className="attachment-chip">
                  <div className="chip-left">
                    {getFileIcon(file.fileType)}
                    <span className="attachment-name" title={file.originalName}>
                      {file.originalName}
                    </span>
                  </div>
                  <span className="attachment-size">
                    {formatBytes(file.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="no-attachments-text">No materials attached.</span>
          )}
        </div>
      </div>

      <div className="notes-card-footer">
        <span className="notes-card-date">
          <Calendar size={13} />
          {new Date(note.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
        <div className="notes-card-actions">
          <button 
            className="notes-card-action-btn edit-btn" 
            onClick={() => onEdit(note)}
            title="Edit lesson details"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button 
            className="notes-card-action-btn delete-btn" 
            onClick={() => onDelete(note._id)}
            title="Delete this lesson"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesCard;
