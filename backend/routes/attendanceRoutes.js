const express = require('express');
const {
  saveOrUpdateAttendance,
  getAttendanceByDate,
  getAttendanceByMonth,
  getStudentAttendanceByMonth,
  getStudentAttendanceAll
} = require('../controllers/attendanceController');

const router = express.Router();

router.post('/', saveOrUpdateAttendance);
router.post('/save', saveOrUpdateAttendance);
router.get('/', getAttendanceByDate);
router.get('/by-date', getAttendanceByDate);
router.get('/month', getAttendanceByMonth);
router.get('/student-month', getStudentAttendanceByMonth);
router.get('/student-all', getStudentAttendanceAll);

module.exports = router;
