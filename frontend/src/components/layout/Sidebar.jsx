import React, { useState } from "react";
import "./Sidebar.css";
import {
  LayoutGrid,
  BookOpen,
  Notebook,
  Rocket,
  Award,
  Menu,
  X,
  LogOut
} from "lucide-react";

const Sidebar = ({ setActivePage, activePage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: "Dashboard" },
    { icon: <BookOpen size={20} />, label: "My Courses" },
    { icon: <Notebook size={20} />, label: "Learning Notes" },
    { icon: <Rocket size={20} />, label: "Statsboard" },
    { icon: <Award size={20} />, label: "Certificates" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <div className="mobile-header">
        <span className="mobile-logo">Netwisdome</span>
        <button onClick={() => setIsOpen(!isOpen)} className="menu-toggle-btn">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <div className={`sidebar-wrapper ${isOpen ? "open" : ""}`}>
        <div className="sidebar">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`menu-item ${activePage === item.label ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.label);
                setIsOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}

          {/* ðŸ”˜ Logout Button - White Color & Stable Design */}
          <div
            className="menu-item"
            onClick={handleLogout}
            style={{
              color: '#ffffff', // âœ… à¤ªà¥‚à¤°à¥à¤£ à¤ªà¤¾à¤‚à¤¢à¤°à¤¾ à¤°à¤‚à¤—
              marginTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <LogOut size={20} color="#ffffff" />
            <span style={{ color: '#ffffff' }}>Logout</span>
          </div>
        </div>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Sidebar;
