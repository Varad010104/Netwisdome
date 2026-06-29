const express = require('express');
const router = express.Router();
const { handleChat, getChatHistory, handleProactiveAlert } = require('../controllers/aiController');

// Secure MERN AI routing suite
router.post('/chat', handleChat);
router.get('/history/:studentId', getChatHistory);
router.post('/proactive-alert', handleProactiveAlert);

module.exports = router;
