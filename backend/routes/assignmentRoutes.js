const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, deleteAssignment } = require('../controllers/assignmentController');
const { submitAssignment, getSubmissions, evaluateSubmission, getSubmissionStatus, deleteSubmission } = require('../controllers/submissionController'); 

// --- Assignment Routes ---
router.post('/create', createAssignment);
router.get('/all', getAssignments);
router.delete('/:id', deleteAssignment);

// --- Submission Routes ---
router.post('/submit', submitAssignment); // Student साठी सबमिट करणे
router.get('/submissions/all', getSubmissions); // Admin साठी सर्व लिस्ट पाहणे
router.delete('/submissions/:id', deleteSubmission);
router.get('/submission/:assignmentId/:studentId', getSubmissionStatus); // Submission status check

// ✅ इव्हॅल्युएशनसाठी आपण आधी बनवलेले evaluateSubmission वापरूया जेणेकरून एरर येणार नाही
router.post('/evaluate', evaluateSubmission); 

module.exports = router;
