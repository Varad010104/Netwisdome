import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OverviewTab from './OverviewTab';
import StudentsTab from './StudentsTab';
import CreateAssignmentTab from './CreateAssignmentTab';
import EvaluationTab from './EvaluationTab';
import ReportsTab from './ReportsTab';
import AddCourse from './addcourse';
import Attendance from './Attendance';
import Footer from '../../components/common/footer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('userInfo');
    if (!raw) {
      navigate('/admin');
      return;
    }
    try {
      const user = JSON.parse(raw);
      if (user?.role !== 'admin') {
        navigate('/admin');
      }
    } catch {
      navigate('/admin');
    }
  }, [navigate]);

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <div className="content-area">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'course' && <AddCourse />}
          {activeTab === 'create' && <CreateAssignmentTab />}
          {activeTab === 'evaluation' && <EvaluationTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default AdminDashboard;
