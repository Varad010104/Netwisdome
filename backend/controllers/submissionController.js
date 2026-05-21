const Submission = require('../models/Submission');
const mongoose = require('mongoose');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, studentName, batchName, answers, practicalAnswer, score, status } = req.body;

    let assignmentType = '';
    let isLate = false;
    let finalScore = score;
    let finalStatus = status;
    let finalFeedback = req.body.feedback || '';

    if (assignmentId && mongoose.Types.ObjectId.isValid(assignmentId)) {
      const assignment = await Assignment.findById(assignmentId);
      if (assignment) {
        assignmentType = assignment.type || '';
        
        // Check if current date is past the assignment due date
        const now = new Date();
        const lastDate = new Date(assignment.lastDate);
        if (now > lastDate) {
          isLate = true;
          finalScore = 0; // Forced to 0 marks
          finalStatus = 'graded'; // Auto-graded
          finalFeedback = `[Late Submission] Automatically graded as 0 (Failed) due to submission after the due date (${lastDate.toLocaleDateString('en-GB')}).`;
        }
      }
    }

    // Practical/MCQ assignment एकदाच submit करू द्या
    if (assignmentType === 'practical' || assignmentType === 'mcq') {
      const existingSubmission = await Submission.findOne({ assignmentId, studentId });
      if (existingSubmission) {
        const label = assignmentType === 'mcq' ? 'MCQ test' : 'Practical assignment';
        return res.status(409).json({ message: `${label} already submitted.` });
      }
    }

    let resolvedStudentName = studentName;
    let resolvedBatchName = batchName;

    if ((!resolvedStudentName || !resolvedBatchName) && studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      const user = await User.findById(studentId).populate('batchId');
      if (user) {
        resolvedStudentName = resolvedStudentName || user.name;
        resolvedBatchName = resolvedBatchName || user.batchId?.batchName || '';
      }
    }

    if (!resolvedStudentName || !resolvedBatchName) {
      return res.status(400).json({ message: 'studentName and batchName are required' });
    }

    const newSubmission = new Submission({
      assignmentId,
      studentId,
      studentName: resolvedStudentName,
      batchName: resolvedBatchName,
      answers,
      practicalAnswer,
      score: finalScore,
      status: finalStatus,
      feedback: finalFeedback,
      isLate
    });

    const savedSubmission = await newSubmission.save();
    res.status(201).json({ message: 'Submission successful!', data: savedSubmission });
  } catch (error) {
    res.status(500).json({ message: 'Error saving submission', error: error.message });
  }
};

const getSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission status', error: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().populate('assignmentId');
    const normalizeName = (value) =>
      String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
    const compactName = (value) => normalizeName(value).replace(/\s+/g, '');

    // Attach student email robustly so reports/export can always use it.
    const validStudentIds = submissions
      .map((s) => String(s.studentId || ''))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const uniqueIds = [...new Set(validStudentIds)];
    const idUsers = uniqueIds.length > 0
      ? await User.find({ _id: { $in: uniqueIds } }).select('_id name email batchId')
      : [];

    const userById = new Map(idUsers.map((u) => [String(u._id), u]));

    const allStudents = await User.find({ role: { $ne: 'admin' } })
      .select('_id name email');

    const userByName = new Map();
    const userByCompactName = new Map();
    allStudents.forEach((u) => {
      const key = normalizeName(u.name);
      const compact = compactName(u.name);
      if (key && !userByName.has(key)) userByName.set(key, u);
      if (compact && !userByCompactName.has(compact)) userByCompactName.set(compact, u);
    });

    const enriched = submissions.map((sub) => {
      const sid = String(sub.studentId || '');
      const fromId = userById.get(sid);
      const normalizedName = normalizeName(sub.studentName);
      const fromName = userByName.get(normalizedName);
      const fromCompactName = userByCompactName.get(compactName(sub.studentName));
      const resolvedUser = fromId || fromName || fromCompactName;

      const row = sub.toObject();
      row.studentEmail = resolvedUser?.email || '';
      return row;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId, score, feedback } = req.body;
    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { score, feedback, status: 'graded' },
      { new: true }
    );
    res.status(200).json({ message: 'Evaluation updated!', data: updatedSubmission });
  } catch (error) {
    res.status(500).json({ message: 'Error updating evaluation', error: error.message });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Submission.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting submission', error: error.message });
  }
};

module.exports = {
  submitAssignment,
  getSubmissions,
  evaluateSubmission,
  getSubmissionStatus,
  deleteSubmission
};


