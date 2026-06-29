const express = require('express');
const router = express.Router();
const {
  registerStudent,
  login,
  getStudents,
  deleteStudent,
  updateStudent,
  getStudentById,
  checkAdminSetup,
  registerAdmin,
  loginAdmin
} = require('../controllers/authController');

router.post('/register-student', registerStudent);
router.post('/login', login);
router.get('/students', getStudents);
router.get('/student/:id', getStudentById);
router.delete('/student/:id', deleteStudent);
router.put('/student/:id', updateStudent);

// Admin Routes
router.get('/admin/check-setup', checkAdminSetup);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;
