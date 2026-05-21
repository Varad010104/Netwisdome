const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    level: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    category: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.9
    },
    image: {
      type: String,
      required: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: false,
      default: null
    },
    batchName: {
      type: String,
      required: false,
      trim: true,
      default: 'Unassigned'
    }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
