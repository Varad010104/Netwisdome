import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/common/footer";

import TopStats from "./TopStats";
import ProgressCard from "./ProgressCard";
import Assignments from "./Assignments";
import LearningStreak from "./LearningStreak";
import Leaderboard from "./Leaderboard";
import AssignedAssignments from "./AssignedAssignments";
import Certificates from "./Certificates";
import MyCourses from "./MyCourses";
import LearningNotes from "./LearningNotes";
import { getStoredUserInfo } from "../../utils/userInfo";

import API from "../../services/api";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Dashboard");
  const [user, setUser] = useState({ name: "Student", batchName: "Loading...", studentId: "" });
  const [dataRefresh, setDataRefresh] = useState(0);

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (userInfo) {
      setUser({
        name: userInfo.name || "Student",
        batchName: userInfo.batchId?.batchName || userInfo.batchName || "Active Batch",
        studentId: userInfo._id || ""
      });
      setDataRefresh(Date.now());
    }

    const refreshFromServer = async () => {
      if (!userInfo?._id) return;
      try {
        const res = await API.get("/auth/students");
        const data = res.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.students) ? data.students : [];
        const updated = list.find((s) => String(s?._id) === String(userInfo._id));
        if (updated) {
          const stored = {
            ...userInfo,
            name: updated.name,
            email: updated.email,
            batchId: updated.batchId || userInfo.batchId,
            batchName: updated.batchId?.batchName || updated.batchName || userInfo.batchName
          };
          localStorage.setItem("userInfo", JSON.stringify(stored));
          setUser({
            name: stored.name || "Student",
            batchName: stored.batchId?.batchName || stored.batchName || "Active Batch",
            studentId: stored._id || userInfo._id || ""
          });
          setDataRefresh(Date.now());
        }
      } catch (err) {
        console.error("Failed to refresh user info:", err);
      }
    };

    refreshFromServer();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar setActivePage={setActivePage} activePage={activePage} />

      {/* CENTER CONTENT AREA */}
      <div className="dashboard-content-scrollable">
        {/* Header */}
        {activePage !== "Learning Notes" && (
          <div style={{ padding: '24px 24px 8px 24px', flexShrink: 0 }}>
            <div className="premium-header-row" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '8px'
            }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#1e293b' }}>
                  Hello, <span style={{ color: '#f76707' }}>{user.name}!</span>
                </h1>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff5f0',
                padding: '6px 16px',
                borderRadius: '10px',
                border: '1px solid #ffdecb'
              }}>
                <span style={{ color: '#f76707', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Batch: {user.batchName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        {activePage === "Learning Notes" ? (
          <LearningNotes />
        ) : (
          <div className="dashboard-content-inner" style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
            {activePage === "Dashboard" && (
              <>
                <div className="dashboard-assessment-btn-wrap">
                  <button className="dashboard-assessment-btn" onClick={() => navigate("/student/all-assessments")}>
                    View all Assesment
                  </button>
                </div>
                <AssignedAssignments refreshKey={dataRefresh} />
                <ProgressCard />
                <Assignments refreshKey={dataRefresh} />
              </>
            )}

            {activePage === "Certificates" && (
              <Certificates />
            )}

            {activePage === "My Courses" && (
              <MyCourses onStartAssessment={() => setActivePage("Dashboard")} />
            )}

            {activePage === "Statsboard" && (
              <Leaderboard currentBatchName={user.batchName} />
            )}
          </div>
        )}

        {activePage !== "Learning Notes" && (
          <div style={{ marginTop: 'auto', flexShrink: 0 }}>
            <Footer />
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      {activePage !== "Learning Notes" && (
        <div className="dashboard-right-fixed">
          <LearningStreak studentId={user.studentId} batchName={user.batchName} />
          <Leaderboard currentBatchName={user.batchName} />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
