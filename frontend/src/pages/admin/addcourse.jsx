import React, { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../services/api';
import './addcourse.css';
import { Upload, Trash2, PlusCircle, BookOpenCheck } from 'lucide-react';

const AddCourse = () => {
    const API_BASE = window.API_BASE_URL || 'http://localhost:5055';
    const CREATE_COURSE_TIMEOUT_MS = 180000;
    const [batches, setBatches] = useState([]);
    const [batchLoading, setBatchLoading] = useState(true);
    const [batchError, setBatchError] = useState('');
    const [courseData, setCourseData] = useState({
        courseName: '',
        description: '',
        level: '',
        category: '',
        duration: '',
        rating: '',
        batchId: '',
        image: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState('');
    const [deletingCourseId, setDeletingCourseId] = useState('');
    const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                setBatchLoading(true);
                setBatchError('');
                const res = await API.get('/batches/all');
                const data = res.data;
                const normalized = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.batches)
                        ? data.batches
                        : [];
                setBatches(normalized);
            } catch (error) {
                console.error('Error loading batches:', error);
                setBatches([]);
                setBatchError('Unable to load batches. Please check backend and refresh.');
            } finally {
                setBatchLoading(false);
            }
        };

        const fetchCourses = async () => {
            try {
                setCoursesLoading(true);
                setCoursesError('');
                const res = await API.get('/courses/all');
                const data = res.data;
                setCourses(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error loading courses:', error);
                setCourses([]);
                setCoursesError('Unable to load created courses.');
            } finally {
                setCoursesLoading(false);
            }
        };

        fetchBatches();
        fetchCourses();
    }, []);

    const selectedBatchName = useMemo(() => {
        if (courseData.batchId === 'UNASSIGNED') return 'Unassigned';
        const selected = batches.find((b) => String(b._id) === String(courseData.batchId));
        return selected?.batchName || '';
    }, [batches, courseData.batchId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setCourseData((prev) => ({
            ...prev,
            image: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!courseData.courseName.trim()) {
                alert('Please enter course name');
                return;
            }

            if (!courseData.description.trim()) {
                alert('Please enter course description');
                return;
            }

            if (!courseData.level) {
                alert('Please select level');
                return;
            }

            if (!courseData.category) {
                alert('Please select category');
                return;
            }

            if (!courseData.batchId) {
                alert('Please select a batch');
                return;
            }

            if (!courseData.image) {
                alert('Please select a course image');
                return;
            }
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append('courseName', courseData.courseName);
            formData.append('description', courseData.description);
            formData.append('level', courseData.level);
            formData.append('category', courseData.category);
            formData.append('duration', courseData.duration);
            formData.append('rating', courseData.rating || '');
            formData.append('batchId', courseData.batchId);
            if (courseData.image) {
                formData.append('image', courseData.image);
            }

            const response = await API.post('/courses/create', formData, {
                timeout: CREATE_COURSE_TIMEOUT_MS
            });

            if (response.status === 200 || response.status === 201) {
                alert('Course created successfully!');
                const created = response.data;
                if (created?.course?._id) {
                    setCourses((prev) => [created.course, ...prev]);
                }
                setCourseData({
                    courseName: '',
                    description: '',
                    level: '',
                    category: '',
                    duration: '',
                    rating: '',
                    batchId: '',
                    image: null
                });
                e.target.reset();
            } else {
                alert(response.data?.message || 'Error adding course!');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            alert(error.response?.data?.message || 'Server error while adding course!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!courseId) return;
        const confirmed = window.confirm('Are you sure you want to delete this course?');
        if (!confirmed) return;

        try {
            setDeletingCourseId(courseId);
            await API.delete(`/courses/${courseId}`);
            setCourses((prev) => prev.filter((course) => course._id !== courseId));
        } catch (error) {
            console.error('Error deleting course:', error);
            alert(error.response?.data?.message || 'Server error while deleting course!');
        } finally {
            setDeletingCourseId('');
        }
    };

    const coursesByBatch = useMemo(() => {
        const grouped = {};
        courses.forEach((course) => {
            const key = (course?.batchName || 'Unassigned Batch').trim();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(course);
        });
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [courses]);

    const handleCreateNewCourseClick = () => {
        setShowCreateCourseForm(true);
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const nameInput = document.getElementById('courseName');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    };

    return (
        <div className="add-course-container">
            <header className="course-page-header">
                <div className="course-header-info">
                    <div className="course-icon-circle">
                        <BookOpenCheck size={28} />
                    </div>
                    <div>
                        <h1>Create New Course</h1>
                        <p className="subtitle">Add a comprehensive training program to the platform.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="course-top-action-btn"
                    onClick={handleCreateNewCourseClick}
                >
                    <PlusCircle size={20} />
                    Create New Course
                </button>
            </header>

            <section className="created-courses-section">
                <div className="created-courses-header">
                    <h2>Created Courses (Batch Wise)</h2>
                    <p>Manage created courses grouped by batch.</p>
                </div>

                {coursesLoading && <div className="course-state">Loading created courses...</div>}
                {!coursesLoading && coursesError && <div className="course-state error">{coursesError}</div>}
                {!coursesLoading && !coursesError && coursesByBatch.length === 0 && (
                    <div className="course-state">No courses created yet.</div>
                )}

                {!coursesLoading && !coursesError && coursesByBatch.map(([batchName, batchCourses]) => (
                    <div className="batch-group" key={batchName}>
                        <div className="batch-group-header">
                            <h3>{batchName}</h3>
                            <span>{batchCourses.length} course{batchCourses.length > 1 ? 's' : ''}</span>
                        </div>

                        <div className="batch-courses-grid">
                            {batchCourses.map((course) => (
                                <article className="created-course-card" key={course._id}>
                                    <div className="created-course-image">
                                        <img
                                            src={`${API_BASE}${course.image}`}
                                            alt={course.courseName}
                                        />
                                    </div>
                                    <div className="created-course-content">
                                        <h4>{course.courseName}</h4>
                                        <p>{course.description}</p>
                                        <div className="course-meta">
                                            <span>{course.level}</span>
                                            <span>{course.category}</span>
                                            <span>{course.duration || 'TBD'}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="delete-course-btn"
                                        onClick={() => handleDeleteCourse(course._id)}
                                        disabled={deletingCourseId === course._id}
                                    >
                                        <Trash2 size={16} />
                                        {deletingCourseId === course._id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {showCreateCourseForm && (
                <form ref={formRef} onSubmit={handleSubmit} className="course-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="courseName">Course Name</label>
                        <input
                            type="text"
                            id="courseName"
                            name="courseName"
                            value={courseData.courseName}
                            onChange={handleChange}
                            placeholder="e.g., Simulink for Automotive"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={courseData.description}
                            onChange={handleChange}
                            placeholder="Master control system modeling with Simulink..."
                            rows="5"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label htmlFor="level">Level</label>
                            <select
                                id="level"
                                name="level"
                                value={courseData.level}
                                onChange={handleChange}
                            >
                                <option value="">-- Select Level --</option>
                                <option value="Beginner">Beginner level</option>
                                <option value="Intermediate">Intermediate level</option>
                                <option value="Advanced">Advanced level</option>
                            </select>
                        </div>

                        <div className="form-group half-width">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={courseData.category}
                                onChange={handleChange}
                            >
                                <option value="">-- Select Category --</option>
                                <option value="Simulink">Simulink Category</option>
                                <option value="MATLAB">MATLAB Category</option>
                                <option value="Testing">Testing Category</option>
                                <option value="Embedded">Embedded Category</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label htmlFor="batchId">Select Batch</label>
                            <select
                                id="batchId"
                                name="batchId"
                                value={courseData.batchId}
                                onChange={handleChange}
                                disabled={batchLoading}
                            >
                                <option value="">
                                    {batchLoading ? 'Loading batches...' : '-- Select Batch --'}
                                </option>
                                {batches.map((batch) => (
                                    <option key={batch._id} value={batch._id}>
                                        {batch.batchName}
                                    </option>
                                ))}
                            </select>
                            {!batchLoading && batches.length === 0 && (
                                <p className="selected-batch">No batches found. Create batch first.</p>
                            )}
                            {batchError ? <p className="selected-batch">{batchError}</p> : null}
                            {selectedBatchName ? <p className="selected-batch">Selected Batch: {selectedBatchName}</p> : null}
                        </div>

                        <div className="form-group half-width">
                            <label htmlFor="duration">Duration (e.g., "16 weeks")</label>
                            <input
                                type="text"
                                id="duration"
                                name="duration"
                                value={courseData.duration}
                                onChange={handleChange}
                                placeholder="e.g., 16 weeks"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width rating-group">
                            <label htmlFor="rating">Rating</label>
                            <input
                                type="number"
                                id="rating"
                                name="rating"
                                value={courseData.rating}
                                onChange={handleChange}
                                placeholder="e.g., 4.9"
                                step="0.1"
                                min="1"
                                max="5"
                            />
                        </div>
                    </div>

                    <div className="form-group file-upload-group">
                        <label htmlFor="image">Upload Course Image</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                id="image"
                                name="image"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <div className="upload-placeholder">
                                <Upload size={24} className="upload-icon" />
                                <span>Click or drag image to upload</span>
                            </div>
                        </div>
                        {courseData.image && <p className="file-name">{courseData.image.name}</p>}
                    </div>

                    <button type="submit" className="add-course-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Course'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddCourse;
