import React, { useEffect, useState } from 'react';
import './MyCourses.css';
import { Clock, Star } from 'lucide-react';
import { getStoredUserInfo } from '../../utils/userInfo';

import API from "../../services/api";

const MyCourses = ({ onStartAssessment }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const userInfo = getStoredUserInfo();
        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString() || '';
        const studentBatchName = userInfo?.batchId?.batchName || userInfo?.batchName || '';

        if (!studentBatchId && !studentBatchName) {
          setCourses([]);
          setLoading(false);
          return;
        }

        const res = await API.get('/courses/all');
        const allCourses = res.data;

        const filtered = Array.isArray(allCourses)
          ? allCourses.filter((course) => {
              const courseBatchId = course?.batchId?._id?.toString() || course?.batchId?.toString() || '';
              const courseBatchName = course?.batchName || '';
              return (
                (studentBatchId && courseBatchId && String(studentBatchId) === String(courseBatchId)) ||
                (studentBatchName && courseBatchName && String(studentBatchName) === String(courseBatchName))
              );
            })
          : [];

        setCourses(filtered);
      } catch (error) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <div className="courses-container">
      <div className="header-section">
        <h1>Our Specialized Courses</h1>
        <p>Comprehensive training programs designed for engineers and technical professionals.</p>
      </div>

      <div className="courses-grid">
        {loading && <div className="course-empty">Loading courses...</div>}
        {!loading && courses.length === 0 && (
          <div className="course-empty">No course available yet. Admin will add course soon.</div>
        )}
        {!loading && courses.map((course) => (
          <div key={course._id} className="course-card">
            <div className="card-image">
              <img src={`${window.API_BASE_URL || 'http://localhost:5055'}${course.image}`} alt={course.courseName} />
              <span className="badge-category">{course.category || 'Course'}</span>
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="level-tag">{course.level || 'Level'}</span>
                <span className="rating">
                  <Star size={14} fill="#FFB800" color="#FFB800" /> {course.rating || 4.9}
                </span>
              </div>
              <h3>{course.courseName}</h3>
              <p>{course.description}</p>
              <div className="card-footer">
                <span className="duration"><Clock size={16} /> {course.duration || 'TBD'}</span>
                <button className="enroll-btn" onClick={onStartAssessment}>Start Assesmet</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;
  
