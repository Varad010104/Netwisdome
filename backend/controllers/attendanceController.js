const Attendance = require('../models/Attendance');

// Save kiwa Update Attendance
const saveOrUpdateAttendance = async (req, res) => {
    try {
        const { date, batch, records, markedBy } = req.body;
        if (!date || !batch || !Array.isArray(records)) {
            return res.status(400).json({
                success: false,
                message: 'date, batch and records are required'
            });
        }

        const attendanceDate = new Date(date);
        if (Number.isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        attendanceDate.setHours(0, 0, 0, 0);

        const normalizedRecords = records
            .filter((record) => record && record.studentId)
            .map((record) => ({
                studentId: String(record.studentId),
                studentName: record.studentName || '',
                status: ['Present', 'Absent', 'Late'].includes(record.status) ? record.status : 'Present'
            }));

        if (normalizedRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one valid attendance record is required'
            });
        }

        const filter = {
            date: attendanceDate,
            batch: String(batch).trim()
        };

        const update = {
            date: attendanceDate,
            batch: String(batch).trim(),
            records: normalizedRecords,
            markedBy: markedBy || 'Admin'
        };

        const result = await Attendance.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: "Attendance successfully updated!",
            data: result
        });

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Attendance already exists for this date and batch'
            });
        }
        res.status(500).json({
            success: false,
            message: "Error saving attendance",
            error: error.message
        });
    }
};

// Ekavisht tarakhechi attendance baghnyasathi (Frontend la dakhvanyasathi)
const getAttendanceByDate = async (req, res) => {
    try {
        const { date, batch } = req.query;
        if (!date || !batch) {
            return res.status(400).json({
                success: false,
                message: 'date and batch are required'
            });
        }

        const searchDate = new Date(date);
        if (Number.isNaN(searchDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        searchDate.setHours(0, 0, 0, 0);

        const data = await Attendance.findOne({ date: searchDate, batch: String(batch).trim() });
        
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No records found for this date and batch"
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching data",
            error: error.message
        });
    }
};

const getAttendanceByMonth = async (req, res) => {
    try {
        const { month, year, batch } = req.query;
        const m = Number(month);
        const y = Number(year);

        if (!batch || Number.isNaN(m) || Number.isNaN(y) || m < 1 || m > 12) {
            return res.status(400).json({
                success: false,
                message: 'batch, month(1-12) and year are required'
            });
        }

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const rows = await Attendance.find({
            batch: String(batch).trim(),
            date: { $gte: startDate, $lt: endDate }
        }).select('date records batch');

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching month attendance',
            error: error.message
        });
    }
};

const getStudentAttendanceByMonth = async (req, res) => {
    try {
        const { month, year, studentId } = req.query;
        const m = Number(month);
        const y = Number(year);

        if (!studentId || Number.isNaN(m) || Number.isNaN(y) || m < 1 || m > 12) {
            return res.status(400).json({
                success: false,
                message: 'studentId, month(1-12) and year are required'
            });
        }

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const rows = await Attendance.find({
            date: { $gte: startDate, $lt: endDate },
            'records.studentId': String(studentId)
        }).select('date records batch');

        const filtered = rows.map((row) => {
            const record = (row.records || []).find(
                (r) => String(r.studentId) === String(studentId)
            );

            return {
                date: row.date,
                batch: row.batch,
                status: record?.status || null
            };
        }).filter((row) => row.status);

        return res.status(200).json({
            success: true,
            data: filtered
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching student month attendance',
            error: error.message
        });
    }
};

const getStudentAttendanceAll = async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'studentId is required'
            });
        }

        const rows = await Attendance.find({
            'records.studentId': String(studentId)
        }).select('date records batch');

        const filtered = rows.map((row) => {
            const record = (row.records || []).find(
                (r) => String(r.studentId) === String(studentId)
            );

            return {
                date: row.date,
                batch: row.batch,
                status: record?.status || null
            };
        }).filter((row) => row.status);

        return res.status(200).json({
            success: true,
            data: filtered
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching student attendance',
            error: error.message
        });
    }
};

module.exports = { saveOrUpdateAttendance, getAttendanceByDate, getAttendanceByMonth, getStudentAttendanceByMonth, getStudentAttendanceAll };
