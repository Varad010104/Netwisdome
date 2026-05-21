const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  batchName: { type: String, required: true },
  answers: [{ questionIndex: Number, selectedAnswer: String }], // MCQ sathi
  practicalAnswer: String, // Practical code/text sathi
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'graded'], default: 'pending' },
  feedback: String,
  isLate: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);