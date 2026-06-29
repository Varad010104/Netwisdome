import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Search, Filter, BookOpen, 
  Layers, Users, FileText, ChevronDown, 
  ChevronUp, Sparkles, RefreshCw, Plus
} from 'lucide-react';
import NotesCard from './NotesCard';
import API from '../../services/api';
import AddLessonModal from './AddLessonModal';
import './NotesManager.css';

const NotesManager = () => {
  const API_BASE = window.API_BASE_URL || 'http://localhost:5055';

  // API Data states
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  
  // Accordion collapsed state for course groups
  const [expandedGroups, setExpandedGroups] = useState({});

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Load all necessary data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch notes, courses, batches concurrently
      const [notesRes, coursesRes, batchesRes] = await Promise.all([
        API.get('/notes/all'),
        API.get('/courses/all'),
        API.get('/batches/all')
      ]);

      const notesData = notesRes.data;
      const coursesData = coursesRes.data;
      const batchesData = batchesRes.data;

      setNotes(Array.isArray(notesData) ? notesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      
      // Auto-expand all course groups initially
      const initialExpanded = {};
      const uniqueCourses = [...new Set((Array.isArray(notesData) ? notesData : []).map(n => n.courseId?.courseName || 'Unassigned'))];
      uniqueCourses.forEach(c => {
        initialExpanded[c] = true;
      });
      setExpandedGroups(initialExpanded);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Server error. Failed to load Notes Management data.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save (Create or Update)
  const handleSaveNote = async (formData, noteId) => {
    const isEdit = !!noteId;
    const url = isEdit 
      ? `/notes/update/${noteId}` 
      : `/notes/create`;
    
    const response = isEdit 
      ? await API.put(url, formData)
      : await API.post(url, formData);

    const result = response.data;
    
    if (isEdit) {
      setNotes(prev => prev.map(note => note._id === noteId ? result.note : note));
      alert('Lesson notes updated successfully!');
    } else {
      setNotes(prev => [result.note, ...prev]);
      alert('New lesson notes published successfully!');
    }

    // Expand the course group of the newly saved note
    const courseName = result.note?.courseId?.courseName || 'Unassigned';
    setExpandedGroups(prev => ({
      ...prev,
      [courseName]: true
    }));
  };

  // Handle Delete
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to permanently delete this lesson note and all its attachments? This action cannot be undone.')) {
      return;
    }

    try {
      await API.delete(`/notes/delete/${noteId}`);
      setNotes(prev => prev.filter(note => note._id !== noteId));
      alert('Lesson notes deleted successfully.');
    } catch (err) {
      console.error('Error deleting notes:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete note.');
    }
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  // Filter notes based on query and filters
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.lessonTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.lessonDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCourse = 
        !selectedCourseFilter || 
        String(note.courseId?._id || note.courseId) === String(selectedCourseFilter);
        
      const matchesBatch = 
        !selectedBatchFilter || 
        !note.batchId || 
        String(note.batchId?._id || note.batchId) === String(selectedBatchFilter);

      return matchesSearch && matchesCourse && matchesBatch;
    });
  }, [notes, searchQuery, selectedCourseFilter, selectedBatchFilter]);

  // Group filtered notes by Course Name
  const groupedNotes = useMemo(() => {
    const groups = {};
    filteredNotes.forEach(note => {
      const courseName = note.courseId?.courseName || 'Unassigned Courses';
      if (!groups[courseName]) {
        groups[courseName] = [];
      }
      groups[courseName].push(note);
    });

    // Sort notes inside each group by orderIndex ascending
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.orderIndex - b.orderIndex);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredNotes]);

  // Toggle Accordion Group
  const toggleGroup = (courseName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [courseName]: !prev[courseName]
    }));
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const totalFiles = notes.reduce((acc, note) => acc + (note.uploadedFiles?.length || 0), 0);
    return {
      totalNotes: notes.length,
      totalCourses: courses.length,
      totalBatches: batches.length,
      totalFiles: totalFiles
    };
  }, [notes, courses, batches]);

  return (
    <div className="notes-manager-container">
      {/* Header section */}
      <header className="notes-manager-header">
        <div className="header-info">
          <div className="header-icon-circle">
            <BookOpen size={28} />
          </div>
          <div>
            <h1>Learning Materials & Notes</h1>
            <p className="subtitle">Publish course-wise, topic-wise study materials, PDFs, and notes for batches.</p>
          </div>
        </div>
        <button className="primary-action-btn" onClick={handleOpenAddModal}>
          <PlusCircle size={20} />
          <span>Publish Materials</span>
        </button>
      </header>

      {/* Summary counters grid */}
      <section className="metrics-dashboard-grid">
        <div className="metric-card bg-glass">
          <div className="metric-icon-wrap notes-color">
            <BookOpen size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Lessons</span>
            <h2 className="metric-value">{metrics.totalNotes}</h2>
          </div>
        </div>

        <div className="metric-card bg-glass">
          <div className="metric-icon-wrap courses-color">
            <Layers size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Courses</span>
            <h2 className="metric-value">{metrics.totalCourses}</h2>
          </div>
        </div>

        <div className="metric-card bg-glass">
          <div className="metric-icon-wrap batches-color">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Assigned Batches</span>
            <h2 className="metric-value">{metrics.totalBatches}</h2>
          </div>
        </div>

        <div className="metric-card bg-glass">
          <div className="metric-icon-wrap files-color">
            <FileText size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Attached Files</span>
            <h2 className="metric-value">{metrics.totalFiles}</h2>
          </div>
        </div>
      </section>

      {/* Filter and search controls bar */}
      <section className="controls-action-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Search lessons, topics, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field"
          />
        </div>

        <div className="filters-input-wrapper">
          <div className="filter-dropdown-wrap">
            <Filter size={14} className="filter-icon" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="filter-select-field"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <Users size={14} className="filter-icon" />
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="filter-select-field"
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="refresh-dashboard-btn" 
            onClick={fetchDashboardData}
            title="Refresh database records"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

      {/* Main content grid */}
      <section className="notes-hierarchy-section">
        {loading ? (
          <div className="loading-skeletons-wrapper">
            <div className="skeleton-row-bar"></div>
            <div className="skeleton-grid-cards">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          </div>
        ) : error ? (
          <div className="error-state-message text-center">
            <p className="error-text">{error}</p>
            <button className="primary-action-btn" onClick={fetchDashboardData}>
              Try Again
            </button>
          </div>
        ) : groupedNotes.length === 0 ? (
          <div className="premium-empty-state text-center">
            <div className="empty-state-icon">
              <BookOpen size={48} />
            </div>
            <h3>No learning materials found</h3>
            <p>We couldn't find any study notes matching your query. Create a new lesson or adjust your filters.</p>
            <button className="primary-action-btn margin-auto" onClick={handleOpenAddModal}>
              <Plus size={16} />
              Publish First Lesson
            </button>
          </div>
        ) : (
          <div className="course-groups-accordion-list">
            {groupedNotes.map(([courseName, courseNotesList]) => {
              const isExpanded = !!expandedGroups[courseName];
              return (
                <div key={courseName} className="course-group-card">
                  {/* Accordion Header */}
                  <header 
                    className={`course-group-header-btn ${isExpanded ? 'active' : ''}`}
                    onClick={() => toggleGroup(courseName)}
                  >
                    <div className="header-left-details">
                      <div className="course-badge-accent"></div>
                      <h3 className="course-group-title">{courseName}</h3>
                      <span className="course-notes-count-tag">
                        {courseNotesList.length} Lesson{courseNotesList.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button className="accordion-caret-toggle">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </header>

                  {/* Accordion Content Panel */}
                  {isExpanded && (
                    <div className="course-group-content-grid">
                      {courseNotesList.map(note => (
                        <div key={note._id} className="notes-card-grid-item">
                          <NotesCard 
                            note={note} 
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteNote}
                            API_BASE={API_BASE}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upload/Edit Modal */}
      <AddLessonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        courses={courses}
        batches={batches}
        editNote={editingNote}
        API_BASE={API_BASE}
      />
    </div>
  );
};

export default NotesManager;
