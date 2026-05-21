import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, PlusCircle, 
  CheckSquare, BarChart3, LogOut, Menu, X 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'attendance', label: 'Attendance', icon: <CheckSquare size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'course', label: 'Course', icon: <PlusCircle size={20} /> },
    { id: 'create', label: 'Assignment', icon: <PlusCircle size={20} /> },
    { id: 'evaluation', label: 'Evaluation', icon: <CheckSquare size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  ];

  // Logout Functionality
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      console.log("Logging out...");
      localStorage.clear();
      window.location.href = "/admin"; 
    }
  };

  return (
    <>
      {/* 📱 Mobile Top Navigation Header */}
      <div className="admin-mobile-header">
        <div className="admin-mobile-brand">
          <img src="/logo.png" alt="Netwisdome" className="admin-mobile-logo-img" />
          <span className="admin-mobile-logo-text">NETWISDOME</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="admin-hamburger-btn">
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Sidebar Drawer Container */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Brand Logo Section */}
        <div className="sidebar-brand">
          <div className="logo-icon">
            <img src="/logo.png" alt="Netwisdome" />
          </div>
          <span className="logo-text">NETWISDOME<span className="accent"></span></span>
        </div>
        
        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false); // Close sidebar on selection (mobile)
              }}
            >
              <div className="icon-wrapper">{item.icon}</div>
              <span className="nav-label">{item.label}</span>
              {activeTab === item.id && <div className="active-indicator" />}
            </button>
          ))}
        </nav>

        {/* Logout Button (At the bottom) */}
        <div className="sidebar-footer">
          <button className="logout-action-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
};

export default Sidebar;
