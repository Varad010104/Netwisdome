import React, { useEffect, useMemo, useState } from "react";
import "./ProgressCard.css";
import { Calendar } from "lucide-react";
import { getStoredUserInfo } from "../../utils/userInfo";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

import API from "../../services/api";

const ProgressCard = () => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userInfo = getStoredUserInfo();
        const studentId = userInfo?._id?.toString();
        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();

        if (!studentId || !studentBatchId) {
          setProgress(0);
          return;
        }

        const [assignmentsRes, submissionsRes] = await Promise.all([
          API.get("/assignments/all"),
          API.get("/assignments/submissions/all")
        ]);

        const assignmentsData = assignmentsRes.data;
        const submissionsData = submissionsRes.data;

        const batchAssignments = (Array.isArray(assignmentsData) ? assignmentsData : []).filter((a) =>
          assignmentMatchesBatch(a, studentBatchId)
        );

        if (totalAssignments === 0) {
          setProgress(0);
          return;
        }

        const assignmentIdSet = new Set(batchAssignments.map((a) => String(a._id)));
        const completedCount = new Set(
          (Array.isArray(submissionsData) ? submissionsData : [])
            .filter((s) => String(s.studentId) === studentId)
            .map((s) => s.assignmentId?._id?.toString() || s.assignmentId?.toString())
            .filter((id) => assignmentIdSet.has(String(id)))
        ).size;

        const calculatedProgress = Math.round((completedCount / totalAssignments) * 100);
        setProgress(Math.min(100, Math.max(0, calculatedProgress)));
      } catch (error) {
        console.error("Progress fetch error:", error);
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const progressText = useMemo(() => {
    if (loading) return "Loading...";
    return `${progress}% Completed`;
  }, [loading, progress]);

  return (
    <div className="progress-card">
      <div className="progress-header">
        <h4>Overall Course Progress</h4>
        <Calendar size={18} className="header-icon" strokeWidth={2.5} />
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="progress-footer">
        <span className="percent-text">{progressText}</span>
      </div>
    </div>
  );
};

export default ProgressCard;
