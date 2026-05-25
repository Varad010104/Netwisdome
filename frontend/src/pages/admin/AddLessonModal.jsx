import React, { useState, useEffect, useRef } from 'react';
import { 
  X, UploadCloud, FileText, Film, Layers, 
  Image as ImageIcon, Trash2, HelpCircle, 
  Eye, EyeOff, AlertCircle
} from 'lucide-react';
import './AddLessonModal.css';

const AddLessonModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  courses, 
  batches, 
  editNote, 
  API_BASE 
}) => {
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [visibilityStatus, setVisibilityStatus] = useState('published');
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const filesInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    if (editNote) {
      setCourseId(editNote.courseId?._id || editNote.courseId || '');
      setBatchId(editNote.batchId?._id || editNote.batchId || 'all');
      setTopicTitle(editNote.topicTitle || '');
      setLessonTitle(editNote.lessonTitle || '');
      setLessonDescription(editNote.lessonDescription || '');
      setOrderIndex(editNote.orderIndex !== undefined ? editNote.orderIndex : '');
      setVisibilityStatus(editNote.visibilityStatus || 'published');
      setExistingFiles(editNote.uploadedFiles || []);
      setThumbnailPreview(editNote.thumbnail ? `${API_BASE}${editNote.thumbnail}` : '');
      setSelectedFiles([]);
      setThumbnailFile(null);
    } else {
      // Clear form for creation mode
      setCourseId('');
      setBatchId('');
      setTopicTitle('');
      setLessonTitle('');
      setLessonDescription('');
      setOrderIndex('');
      setVisibilityStatus('published');
      setExistingFiles([]);
      setSelectedFiles([]);
      setThumbnailFile(null);
      setThumbnailPreview('');
    }
    setErrorMsg('');
  }, [editNote, isOpen]);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      addSelectedFiles(files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addSelectedFiles(files);
    }
  };

  const addSelectedFiles = (newFiles) => {
    // Validate sizes and types if necessary
    const validFiles = newFiles.filter(file => {
      const sizeLimit = 25 * 1024 * 1024; // 25MB
      if (file.size > sizeLimit) {
        alert(`File ${file.name} exceeds the 25MB size limit.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const removeExistingFile = (fileId) => {
    setExistingFiles(prev => prev.filter(file => file._id !== fileId));
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file for the thumbnail.');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!courseId) return setErrorMsg('Please select a course.');
    if (!batchId) return setErrorMsg('Please select a batch.');
    if (!topicTitle.trim()) return setErrorMsg('Please enter a topic title.');
    if (!lessonTitle.trim()) return setErrorMsg('Please enter a lesson title.');

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('batchId', batchId);
      formData.append('topicTitle', topicTitle.trim());
      formData.append('lessonTitle', lessonTitle.trim());
      formData.append('lessonDescription', lessonDescription.trim());
      formData.append('orderIndex', orderIndex === '' ? 0 : Number(orderIndex));
      formData.append('visibilityStatus', visibilityStatus);

      // Append new files
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Append thumbnail if selected
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailPreview === '') {
        // Thumbnail cleared
        formData.append('thumbnail', '');
      }

      // If editing, append existing files list as a JSON string to retain
      if (editNote) {
        formData.append('existingFiles', JSON.stringify(existingFiles));
      }

      await onSave(formData, editNote?._id);
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      setErrorMsg(error.message || 'Failed to save notes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText size={16} className="file-icon-pdf" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FileText size={16} className="file-icon-word" />;
    if (fileType.includes('presentation') || fileType.includes('ppt')) return <Layers size={16} className="file-icon-ppt" />;
    if (fileType.includes('zip')) return <Layers size={16} className="file-icon-zip" />;
    return <FileText size={16} className="file-icon-default" />;
  };

  return (
    <div className="add-notes-modal-overlay">
      <div className="add-notes-modal-card">
        {/* Modal Header */}
        <header className="modal-header-section">
          <div>
            <h2 className="modal-title-main">
              {editNote ? 'Edit Lesson Notes' : 'Add Learning Notes'}
            </h2>
            <p className="modal-subtitle-text">
              {editNote ? 'Update lesson contents and attachments.' : 'Create a course module topic and attach resource materials.'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </header>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="modal-form-element">
          <div className="modal-form-scroll-body">
            {errorMsg && (
              <div className="modal-alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Course & Batch Selection */}
            <div className="form-grid-row">
              <div className="modal-form-group">
                <label className="modal-label">Select Course *</label>
                <select 
                  value={courseId} 
                  onChange={(e) => setCourseId(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Select Batch *</label>
                <select 
                  value={batchId} 
                  onChange={(e) => setBatchId(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="">-- Choose Batch --</option>
                  <option value="all">-- All Batches (Global) --</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.batchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Topic Title & Lesson Title */}
            <div className="form-grid-row">
              <div className="modal-form-group">
                <label className="modal-label">Topic Title * (e.g. "Chapter 1: Getting Started")</label>
                <input 
                  type="text" 
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Topic heading..." 
                  className="modal-text-input"
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Lesson Title * (e.g. "Lesson 1.1: Simulink Basics")</label>
                <input 
                  type="text" 
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Specific lesson title..." 
                  className="modal-text-input"
                />
              </div>
            </div>

            {/* Row 3: Order Index & Status */}
            <div className="form-grid-row">
              <div className="modal-form-group">
                <label className="modal-label">Sorting Order Index</label>
                <input 
                  type="number" 
                  value={orderIndex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOrderIndex(val === '' ? '' : Number(val));
                  }}
                  placeholder="0" 
                  className="modal-text-input"
                  min="0"
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Visibility Status</label>
                <div className="visibility-toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${visibilityStatus === 'published' ? 'active' : ''}`}
                    onClick={() => setVisibilityStatus('published')}
                  >
                    <Eye size={16} />
                    <span>Published</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${visibilityStatus === 'draft' ? 'active' : ''}`}
                    onClick={() => setVisibilityStatus('draft')}
                  >
                    <EyeOff size={16} />
                    <span>Draft</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Lesson Description */}
            <div className="modal-form-group">
              <label className="modal-label">Lesson Description</label>
              <textarea 
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Provide a brief explanation of what students will learn in this lesson module..." 
                className="modal-textarea-input"
                rows={3}
              />
            </div>

            {/* Row 5: Thumbnail Upload */}
            <div className="modal-form-group">
              <label className="modal-label">Lesson Module Cover Image / Thumbnail (Optional)</label>
              <div className="thumbnail-upload-layout">
                {thumbnailPreview ? (
                  <div className="thumbnail-preview-frame">
                    <img src={thumbnailPreview} alt="Lesson Thumbnail Preview" className="thumbnail-preview-img" />
                    <button 
                      type="button" 
                      className="thumbnail-remove-btn" 
                      onClick={removeThumbnail}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="thumbnail-placeholder-btn"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <ImageIcon size={20} />
                    <span>Select Thumbnail Image</span>
                  </button>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />
                <span className="thumbnail-help-text">
                  Upload a cover image that represents this lesson (JPEG, PNG). If omitted, a elegant slate background will be automatically generated.
                </span>
              </div>
            </div>

            {/* Row 6: Attach Files (PDF, ZIP, DOC, PPT) */}
            <div className="modal-form-group">
              <label className="modal-label">Attached Study Materials / Resources *</label>
              
              {/* Drag & Drop Upload Zone */}
              <div 
                className={`drag-upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => filesInputRef.current?.click()}
              >
                <UploadCloud size={32} className="cloud-upload-icon" />
                <p className="drag-upload-text">
                  Drag and drop your files here, or <span className="browse-link">Browse files</span>
                </p>
                <p className="drag-upload-limit">
                  Supports: PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG (Max 25MB each)
                </p>
              </div>
              
              <input
                ref={filesInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* List of Files selected or existing */}
              {((editNote && existingFiles.length > 0) || selectedFiles.length > 0) && (
                <div className="attachments-list-modal">
                  <p className="attachments-list-label">Selected Files:</p>
                  <div className="attachments-cards-grid">
                    
                    {/* Existing files (if editing) */}
                    {existingFiles.map((file) => (
                      <div key={file._id} className="attachment-file-card existing">
                        <div className="card-left">
                          {getFileIcon(file.originalName.toLowerCase())}
                          <div className="file-info-text">
                            <span className="file-info-name" title={file.originalName}>
                              {file.originalName}
                            </span>
                            <span className="file-info-status">Retained</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="file-card-delete-btn"
                          onClick={() => removeExistingFile(file._id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {/* Newly selected files */}
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="attachment-file-card new-upload">
                        <div className="card-left">
                          {getFileIcon(file.name.toLowerCase())}
                          <div className="file-info-text">
                            <span className="file-info-name" title={file.name}>
                              {file.name}
                            </span>
                            <span className="file-info-status pending">To Upload ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="file-card-delete-btn"
                          onClick={() => removeSelectedFile(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Form Buttons */}
          <footer className="modal-footer-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="modal-spinner"></div>
                  <span>Uploading files...</span>
                </>
              ) : (
                <span>{editNote ? 'Save Changes' : 'Publish Notes'}</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal;
