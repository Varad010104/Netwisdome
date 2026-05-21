import React, { useEffect, useMemo, useState } from "react";
import "./Leaderboard.css";
import { Trophy } from "lucide-react";
import axios from "axios";

const Leaderboard = ({ currentBatchName = "" }) => {
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const [studentsRes, submissionsRes] = await Promise.all([
          axios.get("http://localhost:5055/api/auth/students"),
          axios.get("http://localhost:5055/api/assignments/submissions/all")
        ]);

        setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
        setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const leaders = useMemo(() => {
    const batchStudents = students.filter((s) => {
      const batchName = s.batchId?.batchName || "";
      return currentBatchName ? batchName === currentBatchName : true;
    });

    const studentMap = new Map(
      batchStudents.map((s) => [String(s._id), {
        studentId: String(s._id),
        name: s.name || "Student",
        points: 0,
        gradedCount: 0
      }])
    );

    submissions.forEach((sub) => {
      if (sub.status !== "graded") return;
      if (currentBatchName && sub.batchName !== currentBatchName) return;

      const sid = String(sub.studentId || "");
      const score = Number(sub.score) || 0;

      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          studentId: sid,
          name: sub.studentName || "Student",
          points: 0,
          gradedCount: 0
        });
      }

      const row = studentMap.get(sid);
      row.points += score;
      row.gradedCount += 1;
    });

    return Array.from(studentMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((row, index) => ({
        rank: index + 1,
        name: row.name,
        points: `${row.points} points`
      }));
  }, [students, submissions, currentBatchName]);

  return (
    <div className="leaderboard-simple">
      <div className="leaderboard-header">
        <Trophy size={20} color="#e67e22" />
        <h4>Leaderboard</h4>
      </div>

      <div className="leader-list">
        {loading ? (
          <div className="leader-empty">Loading leaderboard...</div>
        ) : leaders.length === 0 ? (
          <div className="leader-empty">No ranked data for this batch yet.</div>
        ) : (
          leaders.map((user) => (
            <div key={`${user.rank}-${user.name}`} className="leader-row-simple">
              <div className="row-left">
                <span className="rank-text">{user.rank}</span>
                <span className="user-name">{user.name}</span>
              </div>
              <span className="points-text">{user.points}</span>
            </div>
          ))
        )}
      </div>

      <button className="view-all-simple" type="button">
        {currentBatchName ? `Batch: ${currentBatchName}` : "All Batches"}
      </button>
    </div>
  );
};

export default Leaderboard;
