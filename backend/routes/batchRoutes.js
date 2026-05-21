const express = require('express');
const router = express.Router();
const { createBatch, getAllBatches, deleteBatch } = require('../controllers/batchController');

// Routes व्याख्या
router.post('/create', createBatch);
router.get('/all', getAllBatches);
router.delete('/:id', deleteBatch);
router.delete('/delete/:id', deleteBatch);

module.exports = router; // ✅ हे सर्वात महत्त्वाचे आहे
