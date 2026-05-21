import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Assignments.css";
import { FileText, Calendar, Clock, Hash, ChevronRight, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredUserInfo } from "../../utils/userInfo";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

const Assignments = ({ refreshKey = 0 }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentBatchName, setStudentBatchName] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const userInfo = getStoredUserInfo();

        const bName = userInfo?.batchId?.batchName || userInfo?.batchName || "Active Batch";
        setStudentBatchName(bName);

        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();
        const studentId = userInfo?._id?.toString();

        const [assignmentRes, submissionRes] = await Promise.all([
          axios.get("http://localhost:5055/api/assignments/all"),
          axios.get("http://localhost:5055/api/assignments/submissions/all")
        ]);

        const mcqOnly = (assignmentRes.data || []).filter(
          (item) => item.type === "mcq" && assignmentMatchesBatch(item, studentBatchId)
        );

        const assignmentIdSet = new Set(mcqOnly.map((item) => item._id?.toString()));
        const nextSubmissionMap = {};

        (submissionRes.data || []).forEach((submission) => {
          const submissionAssignmentId = submission.assignmentId?._id?.toString() || submission.assignmentId?.toString();
          const submissionStudentId = submission.studentId?.toString();

          if (assignmentIdSet.has(submissionAssignmentId) && submissionStudentId === studentId) {
            nextSubmissionMap[submissionAssignmentId] = submission;
          }
        });

        setSubmissionMap(nextSubmissionMap);

        const pendingOnly = mcqOnly.filter((item) => !nextSubmissionMap[item._id]);
        setAssignments(pendingOnly.slice(0, 3));
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [refreshKey]);

  return (
    <div className="asgn-wrapper">
      <div className="asgn-header-row">
        <div className="asgn-header-left">
          <h3 className="asgn-heading-main">MCQ Assignments</h3>
        </div>
        <div className="asgn-header-actions" style={{ display: "flex", gap: "10px" }}>
          <button className="asgn-btn-view" onClick={() => navigate("/student/mcq-list")} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <List size={14} /> View All MCQ
          </button>
          <button className="asgn-btn-view" onClick={() => window.location.reload()}>
            Refresh List
          </button>
        </div>
      </div>

      <div className="asgn-list-container">
        {loading ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading MCQ tests...</p>
        ) : assignments.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No MCQ assignments found for your batch.</p>
        ) : (
          assignments.map((item) => {
            return (
              <div
                key={item._id}
                className="asgn-main-card"
                onClick={() => navigate(`/student/mcq-test/${item._id}`)}
              >
                <div className="asgn-content-left">
                  <div className="asgn-icon-frame">
                    <FileText size={18} className="asgn-color-orange" strokeWidth={2} />
                  </div>
                  <div className="asgn-info-stack">
                    <span className="asgn-title-light">{item.title}</span>
                    <div className="asgn-meta-row">
                      <span className="asgn-meta-unit">
                        <Hash size={12} /> {studentBatchName}
                      </span>
                      <span className="asgn-meta-unit">
                        <Calendar size={12} />
                        {new Date(item.lastDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="asgn-actions-right">
                  <span className="asgn-status-pill is-pending">
                    <Clock size={13} strokeWidth={2.5} />
                    Pending
                  </span>
                  <div className="asgn-arrow-box">
                    <ChevronRight size={18} className="asgn-arrow-svg" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Assignments;
