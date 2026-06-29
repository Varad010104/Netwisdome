import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  Users, UserPlus, Search, Trash2, X, 
  Layers, GraduationCap, Mail, Fingerprint, Calendar, Eye, Info
} from 'lucide-react';
import './StudentsTab.css';

const StudentsTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newBatchName, setNewBatchName] = useState(""); 
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    name: '',
    email: '',
    password: '',
    batchId: ''
  });
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', batchId: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // --- LOGIC (KEEPING IT UNTOUCHED AS REQUESTED) ---
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const batchRes = await API.get('/batches/all');
      const batchData = Array.isArray(batchRes.data) ? batchRes.data : Array.isArray(batchRes.data?.batches) ? batchRes.data.batches : [];
      setBatches(batchData);

      const stuRes = await API.get('/auth/students');
      const studentData = Array.isArray(stuRes.data) ? stuRes.data : Array.isArray(stuRes.data?.students) ? stuRes.data.students : Array.isArray(stuRes.data?.users) ? stuRes.data.users : Array.isArray(stuRes.data?.data) ? stuRes.data.data : [];
      setStudents(studentData);
    } catch (error) { console.error("Error fetching data:", error); }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await API.delete(`/auth/student/${id}`);
        alert("Student Deleted Successfully!");
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete student");
      }
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) return alert("Please enter a batch name!");
    try {
      const res = await API.post('/batches/create', { batchName: newBatchName });
      alert(res.data.message || "Batch created successfully!");
      setNewBatchName(""); 
      fetchData(); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create batch");
    }
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    if (!window.confirm(`Delete batch "${batchName}"?`)) return;
    try {
      await API.delete(`/batches/${batchId}`);
      alert("Batch Deleted Successfully!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete batch");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRegistering) return;
    if(!formData.batchId) return alert("Please select a batch!");
    setIsRegistering(true);
    try {
      const res = await API.post('/auth/register-student', formData);
      alert(`Student Registered Successfully!\nWelcome email is sending in background.`);
      setFormData({ name: '', email: '', password: '', batchId: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (error) { alert(error.response?.data?.message || "Registration failed!"); }
    finally { setIsRegistering(false); }
  };
  // --- END OF LOGIC ---

  const filteredStudents = students.filter((s) => {
    const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      String(s?.name || '').toLowerCase().includes(normalizedSearch) ||
      String(s?.email || '').toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) return false;
    if (selectedBatchFilter === 'all') return true;
    const id = typeof s.batchId === 'object' ? s.batchId?._id : s.batchId;
    if (selectedBatchFilter === 'unassigned') return !id;
    return String(id || '') === String(selectedBatchFilter);
  });

  const openStudentDetails = (student) => {
    setSelectedStudent(student);
    setIsEditingDetails(false);
    setDetailsForm({
      name: student?.name || '',
      email: student?.email || '',
      password: student?.password || '',
      batchId: typeof student?.batchId === 'object' ? (student.batchId?._id || '') : (student?.batchId || '')
    });
    setIsDetailsModalOpen(true);
  };

  const closeStudentDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedStudent(null);
    setIsEditingDetails(false);
    setDetailsForm({ name: '', email: '', password: '', batchId: '' });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent?._id) return;
    if (!detailsForm.name.trim() || !detailsForm.email.trim()) {
      alert('Name and Email are required');
      return;
    }

    try {
      const currentBatchId =
        typeof selectedStudent?.batchId === 'object'
          ? (selectedStudent.batchId?._id || '')
          : (selectedStudent?.batchId || '');

      const payload = {};
      const nextName = detailsForm.name.trim();
      const nextEmail = detailsForm.email.trim();
      const nextPassword = detailsForm.password?.trim();
      const nextBatchId = detailsForm.batchId || '';

      if (nextName !== (selectedStudent?.name || '')) payload.name = nextName;
      if (nextEmail !== (selectedStudent?.email || '')) payload.email = nextEmail;
      if (nextPassword) payload.password = nextPassword;
      if (String(nextBatchId) !== String(currentBatchId || '')) {
        payload.batchId = nextBatchId || null;
      }

      if (Object.keys(payload).length === 0) {
        alert('No changes to update');
        setIsEditingDetails(false);
        return;
      }

      const res = await API.put(`/auth/student/${selectedStudent._id}`, payload);
      alert(res.data?.message || 'Student updated successfully');
      const updatedStudent = res.data?.student || selectedStudent;
      setSelectedStudent(updatedStudent);
      if (updatedStudent?._id) {
        setStudents((prev) => prev.map((s) => (String(s._id) === String(updatedStudent._id) ? updatedStudent : s)));
      }
      setIsEditingDetails(false);
      fetchData();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update student';
      alert(message);
      console.error('Update student failed:', error);
    }
  };

  const issueStudentCertificate = async (student) => {
    if (!student?._id) return;
    try {
      const isIssued = student.certificateStatus === 'issued' || student.certificateIssued === true;
      const nextStatus = isIssued ? 'pending' : 'issued';
      const res = await API.put(`/auth/student/${student._id}`, { certificateStatus: nextStatus });
      const updatedStudent = res.data?.student || student;
      setStudents((prev) => prev.map((s) => (String(s._id) === String(updatedStudent._id) ? updatedStudent : s)));
      const fallbackMsg = nextStatus === 'issued' ? 'Certificate issued successfully' : 'Certificate locked successfully';
      alert(res.data?.message || fallbackMsg);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to issue certificate';
      alert(message);
    }
  };

  return (
    <div className="students-container fade-in">
      {/* Header Section */}
      <div className="tab-header-premium">
        <div className="header-info">
          <div className="icon-circle"><Users size={24} /></div>
          <div>
            <h2 className="tab-title">Student Directory</h2>
            <p className="tab-subtitle">Manage batches and track student enrollments</p>
          </div>
        </div>
        <button className="add-student-btn-neon" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Enroll New Student</span>
        </button>
      </div>

      <div className="management-grid">
        {/* Left Side: Create Batch Card */}
        <div className="batch-card-premium">
          <div className="card-top">
            <Layers size={20} className="text-orange" />
            <h4>Quick Batch Creator</h4>
          </div>
          <p className="card-hint">Create specialized batches for different courses.</p>
          <div className="batch-input-wrapper">
            <input 
              type="text" 
              placeholder="e.g. Full Stack MERN 2026" 
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
            />
            <button className="create-batch-btn" onClick={handleCreateBatch}>Create</button>
          </div>
        </div>

        {/* Right Side: Quick Stats Card */}
        <div className="stats-card-premium">
            <div className="stat-item">
                <span className="stat-value">{students.length}</span>
                <span className="stat-label">Total Students</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <span className="stat-value">{batches.length}</span>
                <span className="stat-label">Total Batches</span>
            </div>
        </div>
      </div>

      <div className="batch-list-card-premium">
        <div className="batch-list-header">
          <h3><Layers size={18} /> Created Batches</h3>
          <span className="batch-count-chip">{batches.length}</span>
        </div>
        {batches.length > 0 ? (
          <div className="batch-list-grid">
            {batches.map((b) => {
              const totalInBatch = students.filter((s) => {
                const id = typeof s.batchId === 'object' ? s.batchId?._id : s.batchId;
                return String(id || '') === String(b._id);
              }).length;

              return (
                <div key={b._id} className="batch-list-item">
                  <div className="batch-item-left">
                    <strong>{b.batchName}</strong>
                    <span>{totalInBatch} students</span>
                  </div>
                  <button
                    className="batch-delete-btn"
                    onClick={() => handleDeleteBatch(b._id, b.batchName)}
                    title="Delete Batch"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="batch-empty-text">No batches created yet.</p>
        )}
      </div>

      {/* Students Table Section */}
      <div className="table-wrapper-premium">
        <div className="table-header-row">
          <h3><GraduationCap size={20} /> Registered Students</h3>
          <div className="table-tools">
            <div className="table-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="batch-filter-select"
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Contact Info</th>
                <th>Assigned Batch</th>
                <th style={{textAlign: 'center'}}>Certificate</th>
                <th style={{textAlign: 'center'}}>Details</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                <tr key={s._id} className="table-row-hover">
                  <td>
                    <div className="profile-cell">
                      <div className="avatar-gradient">{s.name ? s.name.charAt(0).toUpperCase() : 'U'}</div>
                      <div className="profile-info">
                        <span className="profile-name">{s.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                        <Mail size={14} /> {s.email}
                    </div>
                  </td>
                  <td>
                    <span className="batch-tag-premium">
                      {s.batchId?.batchName || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <div className="action-cell">
                      {(s.certificateStatus === 'issued' || s.certificateIssued) && (
                        <button className="certificate-btn issued">
                          Issued
                        </button>
                      )}
                      <button
                        className="certificate-download-btn"
                        onClick={() => issueStudentCertificate(s)}
                      >
                        {s.certificateStatus === 'issued' || s.certificateIssued ? 'Lock' : 'Issue'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="action-btn details"
                        onClick={() => openStudentDetails(s)}
                        title="View Student Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteStudent(s._id)}
                        title="Remove Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Users size={40} />
                    <p>No student records found for selected batch.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="modal-overlay-blur">
          <div className="modal-box-premium slide-up">
            <div className="modal-header-premium">
              <div className="modal-title-group">
                <UserPlus className="text-orange" />
                <h3>Student Enrollment</h3>
              </div>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form className="modal-form-premium" onSubmit={handleRegister}>
              <div className="form-grid-premium">
                <div className="input-field">
                  <label><Users size={14}/> Full Name</label>
                  <input type="text" placeholder="John Doe" value={formData.name} required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="input-field">
                  <label><Mail size={14}/> Email Address</label>
                  <input type="email" placeholder="john@example.com" value={formData.email} required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="input-field">
                  <label><Fingerprint size={14}/> Secure Password</label>
                  <input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" value={formData.password} required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="input-field">
                  <label><Calendar size={14}/> Assign Batch</label>
                  <select 
                    required 
                    value={formData.batchId} 
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  >
                    <option value="">Select a batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions-premium">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-neon" disabled={isRegistering}>
                  {isRegistering ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true"></span>
                      Enrolling...
                    </>
                  ) : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedStudent && (
        <div className="modal-overlay-blur">
          <div className="details-modal-box slide-up">
            <div className="modal-header-premium">
              <div className="modal-title-group">
                <Info className="text-orange" />
                <h3>Student Basic Details</h3>
              </div>
              <button className="close-modal" onClick={closeStudentDetails}><X size={20} /></button>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                {isEditingDetails ? (
                  <input
                    className="detail-input"
                    type="text"
                    value={detailsForm.name}
                    onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                  />
                ) : (
                  <span className="detail-value">{selectedStudent.name || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                {isEditingDetails ? (
                  <input
                    className="detail-input"
                    type="email"
                    value={detailsForm.email}
                    onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                  />
                ) : (
                  <span className="detail-value">{selectedStudent.email || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <span className="detail-label">Password</span>
                {isEditingDetails ? (
                  <input
                    className="detail-input"
                    type="text"
                    value={detailsForm.password}
                    onChange={(e) => setDetailsForm({ ...detailsForm, password: e.target.value })}
                  />
                ) : (
                  <span className="detail-value">{selectedStudent.password || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned Batch</span>
                {isEditingDetails ? (
                  <select
                    className="detail-input"
                    value={detailsForm.batchId}
                    onChange={(e) => setDetailsForm({ ...detailsForm, batchId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>{b.batchName}</option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{selectedStudent.batchId?.batchName || 'Unassigned'}</span>
                )}
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">{selectedStudent.role || 'student'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Joined On</span>
                <span className="detail-value">{formatDate(selectedStudent.createdAt)}</span>
              </div>
            </div>

            <div className="modal-actions-premium">
              {isEditingDetails ? (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingDetails(false)}>Cancel</button>
                  <button type="button" className="btn-primary-neon" onClick={handleUpdateStudent}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingDetails(true)}>
                    Edit
                  </button>
                  <button type="button" className="btn-primary-neon" onClick={closeStudentDetails}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;
