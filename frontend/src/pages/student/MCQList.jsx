import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Search, Timer, Calendar, ChevronLeft, PlayCircle, FileText, Filter, CheckCircle2, MessageSquare, X } from "lucide-react";
import "./MCQList.css";
import { assignmentMatchesBatch } from "../../utils/assignmentBatch";

const MCQList = () => {
  const [tests, setTests] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: "",
    feedback: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        const studentBatchId = userInfo?.batchId?._id?.toString() || userInfo?.batchId?.toString();
        const studentId = userInfo?._id?.toString();

        const [assignmentRes, submissionRes] = await Promise.all([
          API.get("/assignments/all"),
          API.get("/assignments/submissions/all")
        ]);

        const filteredByBatch = (assignmentRes.data || []).filter(
          (test) => test.type === "mcq" && assignmentMatchesBatch(test, studentBatchId)
        );
        setTests(filteredByBatch);

        const testIdSet = new Set(filteredByBatch.map((item) => item._id?.toString()));
        const nextSubmissionMap = {};

        (submissionRes.data || []).forEach((submission) => {
          const submissionAssignmentId = submission.assignmentId?._id?.toString() || submission.assignmentId?.toString();
          const submissionStudentId = submission.studentId?.toString();

          if (testIdSet.has(submissionAssignmentId) && submissionStudentId === studentId) {
            nextSubmissionMap[submissionAssignmentId] = submission;
          }
        });

        setSubmissionMap(nextSubmissionMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const getTestStatus = (testId) => (submissionMap[testId] ? "Completed" : "Pending");
  const openFeedbackModal = (testTitle, feedbackText) => {
    setFeedbackModal({
      open: true,
      title: testTitle || "MCQ Test",
      feedback: feedbackText || "Instructor feedback is not available yet."
    });
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = getTestStatus(test._id);
    const matchesStatus = statusFilter === "All" || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mlist-container animate-fade-in">
      <header className="mlist-header">
        <div className="mlist-header-left">
          <button className="btn-back" onClick={() => navigate("/student/dashboard")}>
            <ChevronLeft size={20} /> Back
          </button>
          <h2 className="mlist-title">MCQ Test Portal</h2>
        </div>
      </header>

      <div className="mlist-top-controls">
        <div className="mlist-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tests by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mlist-filter-box">
          <Filter size={18} className="text-gray" />
          <select className="mlist-status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="mlist-table-wrapper">
        {loading ? (
          <div className="mlist-loader">
            <div className="spinner"></div>
            <p>Loading tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="mlist-empty">
            <Search size={40} />
            <p>No tests found for your batch.</p>
          </div>
        ) : (
          <table className="mlist-table">
            <thead>
              <tr>
                <th><FileText size={16} /> Test Name</th>
                <th><Calendar size={16} /> Start Date</th>
                <th><CheckCircle2 size={16} /> Status</th>
                <th><Timer size={16} /> Duration</th>
                <th><Calendar size={16} /> Due Date</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => {
                const submission = submissionMap[test._id];
                const isCompleted = Boolean(submission);
                const scoreValue = submission?.status === "graded" ? submission?.score : null;

                return (
                  <tr key={test._id} className="mlist-row-hover">
                    <td className="td-title">
                      <div className="title-cell">
                        <div className="title-icon">MCQ</div>
                        {test.title}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {test.startDate ? new Date(test.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-"}
                      </div>
                    </td>
                    <td>
                      <span className={`mlist-status-pill ${isCompleted ? "completed" : "pending"}`}>
                        {isCompleted ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="font-semibold">{test.totalDuration || 30} Mins</td>
                    <td>
                      <div className="date-cell">
                        {new Date(test.lastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                    </td>
                    <td className="text-center">
                      {isCompleted ? (
                        <div className="mlist-action-wrap">
                          <div className="mlist-score-badge">
                            Score: {scoreValue !== null && scoreValue !== undefined ? `${scoreValue}%` : "Pending Review"}
                          </div>
                          <button
                            type="button"
                            className="mlist-feedback-btn"
                            title="View Instructor Feedback"
                            onClick={() => openFeedbackModal(test.title, submission?.feedback)}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn-table-start" onClick={() => navigate(`/student/mcq-test/${test._id}`)}>
                          Start <PlayCircle size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {feedbackModal.open && (
        <div className="mlist-modal-overlay" onClick={() => setFeedbackModal({ open: false, title: "", feedback: "" })}>
          <div className="mlist-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mlist-modal-head">
              <h3>{feedbackModal.title} - Feedback</h3>
              <button
                type="button"
                className="mlist-modal-close"
                onClick={() => setFeedbackModal({ open: false, title: "", feedback: "" })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mlist-feedback-content">
              {feedbackModal.feedback}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQList;
