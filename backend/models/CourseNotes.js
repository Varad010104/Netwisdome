const mongoose = require('mongoose');

// NotesFiles Schema as a Subdocument
const notesFileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true }, // e.g., 'pdf', 'doc', 'ppt', 'zip', 'image'
  fileSize: { type: Number, required: true } // in bytes
}, { timestamps: true });

// CourseNotes Schema
const courseNotesSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: false
  },
  topicTitle: {
    type: String,
    required: true,
    trim: true
  },
  lessonTitle: {
    type: String,
    required: true,
    trim: true
  },
  lessonDescription: {
    type: String,
    trim: true
  },
  uploadedFiles: [notesFileSchema],
  thumbnail: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  visibilityStatus: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, { timestamps: true });

module.exports = mongoose.model('CourseNotes', courseNotesSchema);
