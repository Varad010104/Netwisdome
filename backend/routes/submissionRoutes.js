const express = require('express');
const router = express.Router();
const { 
  submitAssignment, 
  getSubmissions, 
  evaluateSubmission 
} = require('../controllers/submissionController');

// १. विद्यार्थ्याने असाइनमेंट सबमिट करण्यासाठी (Practical/MCQ)
// URL: POST http://localhost:5000/api/submissions/submit
router.post('/submit', submitAssignment);

// २. ॲडमिनला सर्व सबमिशन्सची लिस्ट मिळवण्यासाठी
// URL: GET http://localhost:5000/api/submissions/all
router.get('/all', getSubmissions);

// ३. ॲडमिनने प्रॅक्टिकलला मार्क्स आणि फीडबॅक देण्यासाठी
// URL: POST http://localhost:5000/api/submissions/evaluate
router.post('/evaluate', evaluateSubmission);

module.exports = router;