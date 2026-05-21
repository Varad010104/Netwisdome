const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // कोणत्या तारखेची हजेरी आहे
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // कोणत्या बॅचसाठी आहे (उदा. APR-2026)
  batch: {
    type: String,
    required: true
  },
  // विद्यार्थ्यांची यादी आणि त्यांची स्थिती
  records: [
    {
      studentId: {
        type: String, // किंवा mongoose.Schema.Types.ObjectId जर Student मॉडेल असेल तर
        required: true
      },
      studentName: String,
      status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
      }
    }
  ],
  // कोणी हजेरी घेतली (Admin/Teacher ID)
  markedBy: {
    type: String
  }
}, { timestamps: true });

// एकाच दिवशी एकाच बॅचची दोनदा हजेरी नको म्हणून 'Unique Index'
attendanceSchema.index({ date: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);