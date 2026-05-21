import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import LoginAdmin from './pages/auth/LoginAdmin';
import StudentDashboard from './pages/student/StudentDashboard';
import AssignmentList from './pages/student/AssignmentList';
import AssignmentDetail from './pages/student/AssignmentDetail';
import DailyProgress from './pages/student/DailyProgress';
import AutoResult from './pages/student/AutoResult'; 
import MCQtest from './pages/student/MCQtest'; 
import MCQResult from './pages/student/MCQResult'; 
import MCQList from './pages/student/MCQList'; 
import AdminDashboard from './pages/admin/AdminDashboard';

// --- NEW IMPORT ADDED HERE ---
import AllAssesmentlist from './pages/student/AllAssesmentlist';

// --- ATTENDANCE IMPORT ---
import Attendance from './pages/admin/Attendance'; // हे नाव तुमच्या फाईल पाथनुसार तपासा

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTHENTICATION ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<LoginAdmin />} />

        {/* STUDENT PANEL ROUTES */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        
        {/* PRACTICAL ASSIGNMENTS ROUTES */}
        <Route path="/student/assignments" element={<AssignmentList />} />
        
        {/* --- NEW ROUTE ADDED HERE --- */}
        <Route path="/student/all-assessments" element={<AllAssesmentlist />} />
        
        <Route path="/student/assignment-detail/:id" element={<AssignmentDetail />} /> 

        {/* MCQ TEST ROUTES */}
        <Route path="/student/mcq-list" element={<MCQList />} /> 
        <Route path="/student/mcq-test/:id" element={<MCQtest />} /> 
        <Route path="/student/mcq-result" element={<MCQResult />} /> 

        {/* DAILY LOGS & PROGRESS */}
        <Route path="/student/daily-progress" element={<DailyProgress />} />

        {/* AUTO EVALUATION & RESULTS */}
        <Route path="/student/assignment/result/:id" element={<AutoResult />} /> 

        {/* ADMIN PANEL ROUTES */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* --- ATTENDANCE ROUTE ADDED HERE --- */}
        <Route path="/admin/attendance" element={<Attendance />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;