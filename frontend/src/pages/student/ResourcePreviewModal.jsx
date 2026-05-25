import React from 'react';
import { X, Download, FileText, Layers, ExternalLink, HelpCircle } from 'lucide-react';
import './ResourcePreviewModal.css';

const ResourcePreviewModal = ({ isOpen, onClose, file, API_BASE }) => {
  if (!isOpen || !file) return null;

  const fileUrl = `${API_BASE}${file.fileUrl}`;
  const isPdf = file.fileType === 'pdf';
  const isImage = file.fileType === 'image';
  const isDoc = file.fileType === 'doc';
  const isPpt = file.fileType === 'ppt';
  const isZip = file.fileType === 'zip';

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // Force download by creating a temporary link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="preview-modal-overlay">
      <div className={`preview-modal-card ${isPdf ? 'large' : 'medium'}`}>
        
        {/* Modal Header */}
        <header className="preview-header">
          <div className="preview-header-info">
            {isPdf && <FileText className="file-icon-pdf" size={20} />}
            {isImage && <Layers className="file-icon-image" size={20} />}
            {isDoc && <FileText className="file-icon-word" size={20} />}
            {isPpt && <Layers className="file-icon-ppt" size={20} />}
            {isZip && <Layers className="file-icon-zip" size={20} />}
            <div>
              <h3>{file.originalName}</h3>
              <span className="file-size-tag">{formatBytes(file.fileSize)}</span>
            </div>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* Modal Content */}
        <div className="preview-body">
          {isPdf && (
            <div className="pdf-iframe-container">
              <iframe
                src={`${fileUrl}#toolbar=0`}
                title={file.originalName}
                width="100%"
                height="100%"
                frameBorder="0"
                className="pdf-preview-iframe"
              />
            </div>
          )}

          {isImage && (
            <div className="image-preview-container">
              <img src={fileUrl} alt={file.originalName} className="image-preview-element" />
            </div>
          )}

          {(isDoc || isPpt) && (
            <div className="doc-preview-fallback">
              <div className="fallback-inner">
                <FileText size={48} className="fallback-icon-doc" />
                <h4>Office Document Viewer</h4>
                <p>Previews for Word and PowerPoint can be downloaded locally or viewed inside Microsoft Office Web Viewer.</p>
                <div className="fallback-actions-row">
                  <button className="preview-primary-action-btn" onClick={handleDownload}>
                    <Download size={16} />
                    Download File
                  </button>
                  <a 
                    href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(window.location.origin + fileUrl)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="preview-secondary-action-btn"
                  >
                    <ExternalLink size={16} />
                    Online Preview
                  </a>
                </div>
              </div>
            </div>
          )}

          {isZip && (
            <div className="zip-preview-fallback">
              <div className="fallback-inner">
                <Layers size={48} className="fallback-icon-zip" />
                <h4>Compressed Archive File (.zip)</h4>
                <p>This package contains code resources, lab assignments, or project files. Download the archive to extract them on your computer.</p>
                <button className="preview-primary-action-btn margin-auto" onClick={handleDownload}>
                  <Download size={16} />
                  Download ZIP Package
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="preview-footer">
          <span className="secure-tag">
            Netwisdome Secure Sandbox Previewer
          </span>
          <button className="preview-download-footer-btn" onClick={handleDownload}>
            <Download size={14} />
            <span>Download</span>
          </button>
        </footer>

      </div>
    </div>
  );
};

export default ResourcePreviewModal;
