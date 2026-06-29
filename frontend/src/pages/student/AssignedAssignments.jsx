import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Calendar, Clock } from "lucide-react";
import "./AssignedAssignments.css";
import { getStoredUserInfo } from "../../utils/userInfo";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

const AssignedAssignments = ({ refreshKey = 0 }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentBatchName, setStudentBatchName] = useState("");

  useEffect(() => {
    const fetchPracticalAssignments = async () => {
      try {
        setLoading(true);
        const userInfo = getStoredUserInfo();

        const bName = userInfo?.batchId?.batchName || userInfo?.batchName || "Active Batch";
        setStudentBatchName(bName);

        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();
        const studentId = userInfo?._id?.toString();

        const [assignmentRes, submissionRes] = await Promise.all([
          API.get("/assignments/all"),
          API.get("/assignments/submissions/all")
        ]);

        const practicalAssignments = (assignmentRes.data || []).filter(
          (item) => item.type === "practical" && assignmentMatchesBatch(item, studentBatchId)
        );

        setAssignments(practicalAssignments);

        const assignmentIdSet = new Set(practicalAssignments.map((item) => item._id?.toString()));
        const nextSubmissionMap = {};

        (submissionRes.data || []).forEach((submission) => {
          const submissionAssignmentId = submission.assignmentId?._id?.toString() || submission.assignmentId?.toString();
          const submissionStudentId = submission.studentId?.toString();

          if (assignmentIdSet.has(submissionAssignmentId) && submissionStudentId === studentId) {
            nextSubmissionMap[submissionAssignmentId] = submission;
          }
        });

        setSubmissionMap(nextSubmissionMap);
      } catch (error) {
        console.error("Error fetching practical assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPracticalAssignments();
  }, [refreshKey]);

  const pendingAssignments = assignments.filter((item) => !submissionMap[item._id]);

  return (
    <div className="mcq-container">
      <div className="mcq-header">
        <div className="mcq-header-left">
          <h3>Assigned Practical Assignments</h3>
        </div>
        <button className="mcq-view-all" onClick={() => navigate("/student/assignments")}>
          View All Practicals
        </button>
      </div>

      <div className="mcq-grid-header">
        <div className="col-name">ASSIGNMENT NAME</div>
        <div className="col-batch text-center">BATCH</div>
        <div className="col-deadline text-center">DEADLINE</div>
        <div className="col-status text-center">STATUS</div>
        <div className="col-action text-right">ACTION</div>
      </div>

      <div className="mcq-list-wrapper">
        {loading ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading practical tasks...</p>
        ) : pendingAssignments.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No practical assignments assigned for your batch.</p>
        ) : (
          pendingAssignments.slice(0, 5).map((item) => {
            return (
              <div
                key={item._id}
                className="mcq-row-card"
                onClick={() => navigate(`/student/assignment-detail/${item._id}`)}
              >
                <div className="col-name">
                  <span className="mcq-title">{item.title}</span>
                </div>

                <div className="col-batch text-center">
                  <span className="mcq-batch-tag">{studentBatchName}</span>
                </div>

                <div className="col-deadline text-center">
                  <span className="mcq-date-val">
                    <Calendar size={14} />
                    {new Date(item.lastDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div className="col-status text-center">
                  <div className="mcq-status-pill pending">
                    <Clock size={13} />
                    <span>PENDING</span>
                  </div>
                </div>

                <div className="col-action text-right">
                  <div className="mcq-go-btn"><ChevronRight size={18} /></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignedAssignments;
