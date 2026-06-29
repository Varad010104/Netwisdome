import React, { useState, useEffect } from 'react';
import { 
  Send, Plus, Trash2, Code, Clock, FileText, 
  Calendar, Award, CheckCircle, ListFilter, LayoutGrid, Layers
} from 'lucide-react';
import API from '../../services/api';
import './CreateAssignmentTab.css';
import { assignmentMatchesBatch, getAssignmentBatchIds } from '../../utils/assignmentBatch';

const CreateAssignmentTab = () => {
  const [assignmentType, setAssignmentType] = useState('practical');
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [formData, setFormData] = useState({
    title: '', batchIds: [], startDate: '', lastDate: '',
    description: '', rubric: '', totalMarks: '', totalDuration: 30 
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const [mcqQuestions, setMcqQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await API.get('/batches/all');
        setBatches(res.data);
        if (res.data?.length > 0) setSelectedBatchId(res.data[0]._id);
      } catch (error) { console.error("Error fetching batches:", error); }
    };
    fetchBatches();
  }, []);

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try {
      const res = await API.get('/assignments/all');
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { setAssignments([]); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Normalize date inputs to prevent selecting past dates and maintain logical ordering
    if (name === 'startDate') {
      const start = value || '';
      const min = todayStr;
      const currentLast = formData.lastDate || '';

      // If selected start is before today, clamp to today
      const safeStart = start && start < min ? min : start;

      // If lastDate exists and is before the new start, move lastDate forward to start
      const safeLast = currentLast && safeStart && currentLast < safeStart ? safeStart : currentLast;

      setFormData({ ...formData, startDate: safeStart, lastDate: safeLast });
      return;
    }

    if (name === 'lastDate') {
      const last = value || '';
      const min = todayStr;
      const start = formData.startDate || '';

      // If selected last is before today, clamp to today
      let safeLast = last && last < min ? min : last;

      // Ensure lastDate is not before startDate
      if (start && safeLast && safeLast < start) safeLast = start;

      setFormData({ ...formData, lastDate: safeLast });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleBatchToggle = (batchValue, checked) => {
    if (batchValue === 'ALL') {
      setFormData({ ...formData, batchIds: checked ? ['ALL'] : [] });
      return;
    }
    const current = formData.batchIds || [];
    const withoutAll = current.filter((id) => id !== 'ALL');
    const next = checked
      ? Array.from(new Set([...withoutAll, batchValue]))
      : withoutAll.filter((id) => id !== batchValue);
    setFormData({ ...formData, batchIds: next });
  };

  const addMcqQuestion = () => {
    setMcqQuestions([...mcqQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeMcqQuestion = (index) => {
    if (mcqQuestions.length > 1) setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
    else alert("At least one question is required.");
  };

  const handleMcqChange = (index, field, value, optIndex = null) => {
    const updatedQs = [...mcqQuestions];
    if (optIndex !== null) updatedQs[index].options[optIndex] = value;
    else updatedQs[index][field] = value;
    setMcqQuestions(updatedQs);
  };

  const publishAssignment = async () => {
    const min = todayStr;
    if (!formData.title || !formData.batchIds?.length || !formData.lastDate) {
      alert("Please fill all required fields (Title, Batch, and Due Date)");
      return;
    }

    if (formData.startDate && formData.startDate < min) {
      alert("Start date cannot be in the past.");
      return;
    }

    if (formData.lastDate < min) {
      alert("Due date cannot be in the past.");
      return;
    }

    if (formData.startDate && formData.lastDate < formData.startDate) {
      alert("Due date cannot be before the start date.");
      return;
    }
    setLoading(true);
    const finalData = {
      ...formData,
      type: assignmentType,
      questions: assignmentType === 'mcq' ? mcqQuestions : [],
      totalDuration: assignmentType === 'mcq' ? Number(formData.totalDuration) : 0,
      totalMarks: Number(formData.totalMarks)
    };

    try {
      const response = await API.post('/assignments/create', finalData);
      const msg = response?.data?.message || "Assignment Published Successfully!";
      const sent = Number(response?.data?.sent || 0);
      const failed = Number(response?.data?.failed || 0);
      const totalRecipients = Number(response?.data?.emailReport?.totalRecipients || sent + failed);
      const firstFailure = response?.data?.emailReport?.failures?.[0];
      const firstFailureText = firstFailure
        ? `${firstFailure.email ? `${firstFailure.email}: ` : ''}${firstFailure.error || ''}`
        : '';
      const details = firstFailureText ? `\nReason: ${firstFailureText}` : '';
      alert(`${msg}\nEmail sent: ${sent}/${totalRecipients}\nEmail failed: ${failed}${details}`);
      fetchAssignments();
      setFormData({ title: '', batchIds: [], startDate: '', lastDate: '', description: '', rubric: '', totalMarks: '', totalDuration: 30 });
      setMcqQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to publish.");
    } finally { setLoading(false); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await API.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (error) { alert("Failed to delete."); }
  };

  // Divide assignments for the list
  const selectedBatchAssignments = assignments.filter((a) => assignmentMatchesBatch(a, selectedBatchId));
  const selectedBatchName = batches.find((b) => String(b._id) === String(selectedBatchId))?.batchName || '';
  const selectedBatchAssignmentsWithLegacySupport = assignments.filter((assignment) => {
    if (assignmentMatchesBatch(assignment, selectedBatchId)) return true;

    const legacyBatchName = String(
      assignment?.batchName || assignment?.batch || assignment?.batch_name || ''
    )
      .trim()
      .toLowerCase();

    if (legacyBatchName && selectedBatchName) {
      return legacyBatchName === String(selectedBatchName).trim().toLowerCase();
    }

    return false;
  });
  const sourceAssignments = selectedBatchAssignmentsWithLegacySupport.length > 0
    ? selectedBatchAssignmentsWithLegacySupport
    : selectedBatchAssignments;
  const practicalOnes = sourceAssignments.filter(a => a.type === 'practical');
  const mcqOnes = sourceAssignments.filter(a => a.type === 'mcq');
  
  const getBatchName = (id) => batches.find((b) => String(b._id) === String(id))?.batchName || "Unknown";
  const getBatchLabel = (assignment) => {
    const ids = getAssignmentBatchIds(assignment);
    if (!ids.length) return "Unknown";
    if (ids.length === batches.length) return "All Batches";
    return ids.map((id) => getBatchName(id)).join(", ");
  };

  return (
    <div className="assignment-container-premium fade-in">
      <div className="premium-page-header">
        <div className="header-text">
          <h2 className="main-title">Create New Assignment</h2>
          <p className="sub-title">Configure and deploy student assessments.</p>
        </div>
        <div className="header-controls">
          <div className="type-toggle-pills">
            <button className={assignmentType === 'practical' ? 'active' : ''} onClick={() => setAssignmentType('practical')}>Practical</button>
            <button className={assignmentType === 'mcq' ? 'active' : ''} onClick={() => setAssignmentType('mcq')}>MCQ Test</button>
          </div>
          <button className="publish-btn-neon" onClick={publishAssignment} disabled={loading}>
            {loading ? <><span className="loader-spin" aria-hidden="true"></span> Publishing...</> : <><Send size={18} /> Publish</>}
          </button>
        </div>
      </div>

      <div className="dual-column-layout">
        {/* LEFT COLUMN */}
        <div className="layout-column">
          <div className="premium-card">
            <h3 className="card-title"><FileText size={18} className="icon-org" /> Configuration</h3>
            
            <div className="p-input-group">
              <label>Assignment Title</label>
              <input type="text" name="title" value={formData.title} placeholder="e.g. React Fundamentals" onChange={handleInputChange} />
            </div>

            <div className="p-grid">
              <div className="p-input-group">
                <label>Select Batch</label>
                <div className="batch-checkboxes">
                  <label className="batch-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.batchIds.includes('ALL')}
                      onChange={(e) => handleBatchToggle('ALL', e.target.checked)}
                    />
                    <span>All Batches</span>
                  </label>
                  {batches.map((b) => (
                    <label key={b._id} className="batch-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.batchIds.includes(b._id)}
                        onChange={(e) => handleBatchToggle(b._id, e.target.checked)}
                        disabled={formData.batchIds.includes('ALL')}
                      />
                      <span>{b.batchName}</span>
                    </label>
                  ))}
                </div>
                  {loading && (
                    <div className="loading-overlay" role="status" aria-live="polite">
                      <div className="loading-box">
                        <span className="loader-spin" aria-hidden="true"></span>
                        <div className="loading-text">Publishing assignment and sending emails...</div>
                      </div>
                    </div>
                  )}
              </div>
              <div className="p-input-group">
                <label>Total Marks</label>
                <input type="number" name="totalMarks" value={formData.totalMarks} placeholder="100" onChange={handleInputChange} />
              </div>
            </div>

            {assignmentType === 'mcq' && (
              <div className="p-input-group timer-glow">
                <label><Clock size={14} /> Test Duration (Mins)</label>
                <input type="number" name="totalDuration" value={formData.totalDuration} onChange={handleInputChange} />
              </div>
            )}

            <div className="p-input-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} rows="4" placeholder="Instructions..." onChange={handleInputChange}></textarea>
            </div>

            <div className="p-grid">
              <div className="p-input-group">
                <label>Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} min={todayStr} onChange={handleInputChange} />
              </div>
              <div className="p-input-group">
                <label>Due Date</label>
                <input type="date" name="lastDate" value={formData.lastDate} min={todayStr} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="layout-column">
          <div className="premium-card dynamic-content">
            <div className="card-header-between">
              <h3 className="card-title">
                {assignmentType === 'mcq' ? <><CheckCircle size={18} className="icon-green" /> Question Bank</> : <><Code size={18} className="icon-blue" /> Rubric</>}
              </h3>
              {assignmentType === 'mcq' && (
                <button className="p-add-btn" onClick={addMcqQuestion}>
                  <Plus size={16} /> Add Question
                </button>
              )}
            </div>

            <div className="content-scroll-area">
              {assignmentType === 'practical' ? (
                <div className="practical-setup">
                  <p className="setup-hint">Enter the practical problem statement and evaluation rules.</p>
                  <textarea
                    name="rubric"
                    value={formData.rubric}
                    placeholder="Write guidelines here..."
                    className="p-textarea-large"
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              ) : (
                mcqQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-mcq-card slide-up">
                    <div className="p-mcq-head">
                      <span className="q-label">Question {qIdx + 1}</span>
                      <button className="q-remove" onClick={() => removeMcqQuestion(qIdx)}><Trash2 size={14} /></button>
                    </div>
                    <input className="p-q-input" value={q.questionText} placeholder="Type question..." onChange={(e) => handleMcqChange(qIdx, 'questionText', e.target.value)} />
                    <div className="p-opt-grid">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-opt-box">
                          <span>{String.fromCharCode(65 + oIdx)}</span>
                          <input value={opt} placeholder={`Option ${oIdx + 1}`} onChange={(e) => handleMcqChange(qIdx, 'options', e.target.value, oIdx)} />
                        </div>
                      ))}
                    </div>
                    <select className="p-correct-select" value={q.correctAnswer} onChange={(e) => handleMcqChange(qIdx, 'correctAnswer', e.target.value)}>
                      <option value="">Select Correct Answer</option>
                      {q.options.map((opt, i) => <option key={i} value={opt}>{opt || `Option ${i+1}`}</option>)}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LISTING SECTION - Divided by Type */}
      <div className="premium-card list-section">
        <div className="list-header">
          <h3 className="card-title"><Layers size={18} className="icon-org" /> Batch Assignment Explorer</h3>
          <div className="batch-pill-container">
            {batches.map((b) => (
              <button key={b._id} className={`batch-pill ${selectedBatchId === b._id ? 'active' : ''}`} onClick={() => setSelectedBatchId(b._id)}>
                {b.batchName}
              </button>
            ))}
          </div>
        </div>

        <div className="divided-list-grid">
          {/* Practical Section */}
          <div className="list-category">
            <h4 className="category-label"><Code size={14} /> Practical Assignments ({practicalOnes.length})</h4>
            <div className="category-items">
              {practicalOnes.length > 0 ? practicalOnes.map(a => (
                <div key={a._id} className="modern-item">
                  <div className="item-txt">
                    <strong>{a.title}</strong>
                    <span>Due: {new Date(a.lastDate).toLocaleDateString()} | {getBatchLabel(a)}</span>
                  </div>
                  <button className="del-icon-btn" onClick={() => handleDeleteAssignment(a._id)}><Trash2 size={16}/></button>
                </div>
              )) : <p className="none-text">No practicals found.</p>}
            </div>
          </div>

          {/* MCQ Section */}
          <div className="list-category">
            <h4 className="category-label"><CheckCircle size={14} /> MCQ Online Tests ({mcqOnes.length})</h4>
            <div className="category-items">
              {mcqOnes.length > 0 ? mcqOnes.map(a => (
                <div key={a._id} className="modern-item">
                  <div className="item-txt">
                    <strong>{a.title}</strong>
                    <span>Marks: {a.totalMarks} | Duration: {a.totalDuration}m | {getBatchLabel(a)}</span>
                  </div>
                  <button className="del-icon-btn" onClick={() => handleDeleteAssignment(a._id)}><Trash2 size={16}/></button>
                </div>
              )) : <p className="none-text">No MCQ tests found.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentTab;
