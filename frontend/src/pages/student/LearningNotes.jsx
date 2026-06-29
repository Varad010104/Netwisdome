import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, ChevronDown, ChevronRight, Layers, 
  Search, Eye, Download, Menu, X, ArrowLeft,
  Sparkles, HelpCircle
} from 'lucide-react';
import LessonViewer from './LessonViewer';
import ResourcePreviewModal from './ResourcePreviewModal';
import { getStoredUserInfo } from '../../utils/userInfo';
import './LearningNotes.css';

import API from '../../services/api';

const LearningNotes = () => {
  const API_BASE = window.API_BASE_URL || 'http://localhost:5055';

  // API Data states
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation states
  const [activeNote, setActiveNote] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  
  // Preview File state
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Student Info
  const [studentBatch, setStudentBatch] = useState({ id: '', name: '' });

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (userInfo) {
      const batchId = userInfo.batchId?._id || userInfo.batchId || '';
      const batchName = userInfo.batchId?.batchName || userInfo.batchName || 'Active Batch';
      
      setStudentBatch({ id: batchId, name: batchName });
      fetchStudentNotes(batchId);
    } else {
      setError('Student authorization credentials not found. Please re-login.');
      setLoading(false);
    }
  }, []);

  const fetchStudentNotes = async (batchId) => {
    if (!batchId) return;
    try {
      setLoading(true);
      setError('');
      
      const res = await API.get(`/student/notes?batchId=${batchId}`);
      const data = res.data;
      const notesList = Array.isArray(data) ? data : [];
      setNotes(notesList);

      // Auto-select first lesson note if available
      if (notesList.length > 0) {
        // Find notes matching current course selection if any, else first note
        const sortedNotes = [...notesList].sort((a, b) => {
          const idxA = typeof a?.orderIndex === 'number' ? a.orderIndex : 0;
          const idxB = typeof b?.orderIndex === 'number' ? b.orderIndex : 0;
          return idxA - idxB;
        });
        setActiveNote(sortedNotes[0] || null);

        // Auto-expand the topic of the first note
        if (sortedNotes[0]?.topicTitle) {
          setExpandedTopics({ [sortedNotes[0].topicTitle]: true });
        }
      }

    } catch (err) {
      console.error('Error fetching student notes:', err);
      setError(err.message || 'Unable to fetch learning materials.');
    } finally {
      setLoading(false);
    }
  };

  // Get distinct courses lists from the notes list
  const studentCoursesList = useMemo(() => {
    const map = new Map();
    const safeNotes = Array.isArray(notes) ? notes : [];
    safeNotes.forEach(note => {
      if (note?.courseId && typeof note.courseId === 'object' && note.courseId._id) {
        map.set(String(note.courseId._id), note.courseId);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const nameA = a?.courseName || '';
      const nameB = b?.courseName || '';
      return nameA.localeCompare(nameB);
    });
  }, [notes]);

  // Filter notes based on Course selection & Search query
  const filteredNotes = useMemo(() => {
    const safeNotes = Array.isArray(notes) ? notes : [];
    return safeNotes.filter(note => {
      const noteCourseId = note?.courseId && typeof note.courseId === 'object'
        ? note.courseId._id
        : note?.courseId;
      
      const matchesCourse = 
        selectedCourseId === 'ALL' || 
        String(noteCourseId || '') === String(selectedCourseId);
      
      const matchesSearch = 
        note?.lessonTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note?.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note?.lessonDescription?.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesCourse && matchesSearch;
    });
  }, [notes, selectedCourseId, searchQuery]);

  // Group filtered notes: Course -> Topic -> Lessons list
  const structuredCourseData = useMemo(() => {
    const courseGroup = {};
    const safeFilteredNotes = Array.isArray(filteredNotes) ? filteredNotes : [];

    safeFilteredNotes.forEach(note => {
      const courseName = note?.courseId && typeof note.courseId === 'object'
        ? note.courseId.courseName || 'Unassigned Course'
        : 'Unassigned Course';
      const topicName = note?.topicTitle || 'General Chapter';
      
      if (!courseGroup[courseName]) {
        courseGroup[courseName] = {};
      }
      
      if (!courseGroup[courseName][topicName]) {
        courseGroup[courseName][topicName] = [];
      }
      
      courseGroup[courseName][topicName].push(note);
    });

    // Sort lessons within each topic by orderIndex
    Object.keys(courseGroup).forEach(cName => {
      Object.keys(courseGroup[cName]).forEach(tName => {
        if (Array.isArray(courseGroup[cName][tName])) {
          courseGroup[cName][tName].sort((a, b) => {
            const indexA = typeof a?.orderIndex === 'number' ? a.orderIndex : 0;
            const indexB = typeof b?.orderIndex === 'number' ? b.orderIndex : 0;
            return indexA - indexB;
          });
        }
      });
    });

    return Object.entries(courseGroup).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredNotes]);

  const toggleTopicExpand = (topicName) => {
    if (!topicName) return;
    setExpandedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  const handleLessonSelect = (note) => {
    setActiveNote(note);
    // On mobile, close sidebar drawer when lesson is selected to show viewer
    setMobileShowSidebar(false);
  };

  const handleTriggerFilePreview = (file) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  return (
    <div className="learning-notes-dashboard">
      
      {/* 📱 Mobile navigation bar */}
      <div className="student-notes-mobile-header">
        <button 
          className="mobile-back-btn"
          onClick={() => setMobileShowSidebar(!mobileShowSidebar)}
        >
          {mobileShowSidebar ? <X size={22} /> : <Menu size={22} />}
          <span>{mobileShowSidebar ? 'Close Explorer' : 'Browse Topics'}</span>
        </button>
      </div>

      {/* Main split grid */}
      <div className="notes-split-layout">
        
        {/* Left Sidebar: Accordion topics tree explorer */}
        <aside className={`lms-sidebar-explorer ${mobileShowSidebar ? 'open' : ''}`}>
          
          {/* Header info */}
          <div className="explorer-header">
            <div className="badge-lms-tag">
              <BookOpen size={14} />
              <span>Netwisdome Portal</span>
            </div>
            <h3>Learning Materials</h3>
            <p className="batch-name-subtitle">Batch: {studentBatch?.name || 'Active Batch'}</p>
          </div>

          {/* Search bar inside sidebar */}
          <div className="explorer-search">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search chapters or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
          </div>

          {/* Course filter select list */}
          <div className="course-filter-select-wrap">
            <Layers size={14} className="filter-select-icon" />
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSearchQuery('');
              }}
              className="course-select-field"
            >
              <option value="ALL">All Enrolled Courses</option>
              {(Array.isArray(studentCoursesList) ? studentCoursesList : []).map(course => (
                <option key={course?._id} value={course?._id}>
                  {course?.courseName || 'Unnamed Course'}
                </option>
              ))}
            </select>
          </div>

          {/* Collapsible topic accordion list */}
          <div className="explorer-accordion-list">
            {loading ? (
              <div className="sidebar-skeleton-loader">
                <div className="sk-bar"></div>
                <div className="sk-bar"></div>
                <div className="sk-bar"></div>
              </div>
            ) : error ? (
              <p className="sidebar-error-text">{error}</p>
            ) : !Array.isArray(structuredCourseData) || structuredCourseData.length === 0 ? (
              <div className="sidebar-empty-state text-center">
                <p>No chapters or learning notes have been published for this course package yet.</p>
              </div>
            ) : (
              structuredCourseData.map(([courseName, topicsGroup]) => (
                <div key={courseName} className="sidebar-course-group">
                  <div className="sidebar-course-title-tag">
                    <Layers size={12} />
                    <span>{courseName}</span>
                  </div>

                  {Object.entries(topicsGroup || {}).map(([topicTitle, lessonsList]) => {
                    const isExpanded = !!expandedTopics[topicTitle];
                    const safeLessonsList = Array.isArray(lessonsList) ? lessonsList : [];
                    return (
                      <div key={topicTitle} className="sidebar-topic-accordion-node">
                        {/* Topic Header */}
                        <div 
                          className={`topic-node-header ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleTopicExpand(topicTitle)}
                        >
                          <div className="topic-header-title">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span title={topicTitle}>{topicTitle}</span>
                          </div>
                          <span className="topic-lessons-badge">
                            {safeLessonsList.length}
                          </span>
                        </div>

                        {/* Lessons List */}
                        {isExpanded && (
                          <div className="topic-lessons-leaves-list">
                            {safeLessonsList.map(noteItem => {
                              const isActive = activeNote && activeNote._id === noteItem?._id;
                              return (
                                <button
                                  key={noteItem?._id}
                                  className={`lesson-leaf-btn ${isActive ? 'active' : ''}`}
                                  onClick={() => handleLessonSelect(noteItem)}
                                  title={noteItem?.lessonTitle || 'Untitled Lesson'}
                                >
                                  <div className="active-dot-indicator"></div>
                                  <span className="leaf-label">
                                    {noteItem?.lessonTitle || 'Untitled Lesson'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

        </aside>

        {/* Right Section: Lesson Viewer */}
        <main className="lms-content-viewer-panel">
          {loading ? (
            <div className="viewer-skeleton-wrap">
              <div className="sk-banner"></div>
              <div className="sk-title"></div>
              <div className="sk-text"></div>
              <div className="sk-text"></div>
            </div>
          ) : (
            <LessonViewer 
              note={activeNote}
              onPreviewFile={handleTriggerFilePreview}
              API_BASE={API_BASE}
            />
          )}
        </main>

      </div>

      {/* Sandbox Secure Preview Modal */}
      <ResourcePreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        API_BASE={API_BASE}
      />

    </div>
  );
};

export default LearningNotes;
