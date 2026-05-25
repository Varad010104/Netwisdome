const express = require('express');
const router = express.Router();
const { uploadNotes } = require('../middleware/notesUpload');
const {
  createNote,
  updateNote,
  deleteNote,
  getAllNotes,
  getNotesByCourse,
  getNotesByBatch,
  getStudentNotes,
  getStudentNotesByCourse
} = require('../controllers/notesController');

// --- ADMIN NOTES APIs ---

// Create new lesson/topic notes
router.post('/notes/create', uploadNotes, createNote);

// Update lesson/topic notes
router.put('/notes/update/:id', uploadNotes, updateNote);

// Delete lesson/topic notes
router.delete('/notes/delete/:id', deleteNote);

// Get all notes
router.get('/notes/all', getAllNotes);

// Get notes by Course ID
router.get('/notes/course/:courseId', getNotesByCourse);

// Get notes by Batch ID
router.get('/notes/batch/:batchId', getNotesByBatch);


// --- STUDENT NOTES APIs ---

// Get notes only for student's assigned batch/course
router.get('/student/notes', getStudentNotes);

// Get notes by Course ID for student's assigned batch
router.get('/student/notes/:courseId', getStudentNotesByCourse);

module.exports = router;
