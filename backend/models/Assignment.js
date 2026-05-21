const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  batchIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  }],

  type: {
    type: String,
    enum: ['mcq', 'practical'],
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  lastDate: {
    type: Date,
    required: true
  },

  totalDuration: {
    type: Number,
    default: 0
  },

  totalMarks: {
    type: Number,
    default: 0
  },

  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String,
  }],

  description: {
    type: String,
    default: ''
  },

  rubric: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);