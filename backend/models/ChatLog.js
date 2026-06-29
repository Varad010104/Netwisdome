const mongoose = require('mongoose');

const ChatLogSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true // index for ultra-fast history lookups
  },
  sender: {
    type: String,
    enum: ['user', 'wisdomy'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  imageAttached: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatLog', ChatLogSchema);
