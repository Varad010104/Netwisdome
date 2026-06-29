import React, { useEffect, useMemo, useState } from "react";
import "./LearningStreak.css";
import { Flame } from "lucide-react";

import API from "../../services/api";

const LearningStreak = ({ studentId = "", batchName = "" }) => {
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const [attendanceByDay, setAttendanceByDay] = useState({});

  useEffect(() => {
    const fetchMonthAttendance = async () => {
      if (!studentId) {
        setAttendanceByDay({});
        return;
      }

      try {
        const query = new URLSearchParams({
          month: String(month + 1),
          year: String(year),
          studentId: String(studentId)
        }).toString();

        const response = await API.get(`/attendance/student-month?${query}`);
        const map = {};

        if (response.status === 200) {
          const result = response.data;
          const rows = Array.isArray(result?.data) ? result.data : [];

          rows.forEach((row) => {
            const rowDate = new Date(row.date);
            const day = rowDate.getDate();
            if (row?.status) {
              map[day] = row.status;
            }
          });

          setAttendanceByDay(map);
          return;
        }

        // Fallback for old backend: fetch day-by-day by-date endpoint
        if (!batchName || batchName === "Loading..." || batchName === "Active Batch") {
          setAttendanceByDay({});
          return;
        }

        const dayRequests = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(async (day) => {
          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const date = `${year}-${mm}-${dd}`;
          const q = new URLSearchParams({ date, batch: batchName }).toString();

          try {
            const dayRes = await API.get(`/attendance/by-date?${q}`);
            if (dayRes.status !== 200) return null;
            const dayJson = dayRes.data;
            const records = dayJson?.data?.records || [];
            const record = records.find((r) => String(r.studentId) === String(studentId));
            return record?.status ? { day, status: record.status } : null;
          } catch {
            return null;
          }
        });

        const dayResults = await Promise.all(dayRequests);
        dayResults.forEach((item) => {
          if (item?.status) {
            map[item.day] = item.status;
          }
        });

        setAttendanceByDay(map);
      } catch (error) {
        console.error("Failed to fetch month attendance", error);
        setAttendanceByDay({});
      }
    };

    fetchMonthAttendance();
  }, [studentId, batchName, daysInMonth, month, year]);

  const calendarCells = useMemo(() => {
    return [
      ...Array.from({ length: firstDayIndex }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
  }, [firstDayIndex, daysInMonth]);

  const getCellClass = (date) => {
    if (!date) return "calendar-cell blank";
    const status = attendanceByDay[date];

    if (status === "Present") return "calendar-cell present";
    if (status === "Absent") return "calendar-cell absent";
    if (status === "Late") return "calendar-cell late";

    return "calendar-cell inactive";
  };

  return (
    <div className="streak-compact-container">
      <div className="streak-inner-card">
        <div className="streak-top">
          <div className="title-group">
            <Flame size={16} className="flame-icon" fill="#e67e22" />
            <h5>Attendance Calendar</h5>
          </div>
          <span className="date-label">
            {today.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="days-row">
          {weekDays.map((day, idx) => <span key={idx}>{day}</span>)}
        </div>

        <div className="calendar-grid-mini">
          {calendarCells.map((date, idx) => (
            <div key={`${date || "blank"}-${idx}`} className={getCellClass(date)}>
              {date || ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningStreak;
