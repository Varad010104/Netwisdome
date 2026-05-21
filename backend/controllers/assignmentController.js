/**
 * assignmentController.js — Netwisdome LMS
 * Handles assignment creation (with email notification), listing, and deletion.
 */

const Assignment = require('../models/Assignment');
const User       = require('../models/User');
const Batch      = require('../models/Batch');
const mongoose   = require('mongoose');

// Import the exact exported name from the mailer
const { sendAssignmentPublishedEmails } = require('../utils/mailer'); 

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeBatchIdsForStorage = async (rawBatchIds = []) => {
  const selected = Array.isArray(rawBatchIds) ? rawBatchIds : [];
  const hasAll = selected.some((id) => String(id).toUpperCase() === 'ALL');

  // SUPPORT 7: Fetch ALL batches if "ALL" is selected
  if (hasAll) {
    const allBatches = await Batch.find({}, '_id').lean();
    return allBatches.map((b) => b._id);
  }

  return selected
    .map((id) => String(id))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const resolveRecipientsAndBatchName = async (batchIds = []) => {
  let batchName = 'All Batches';

  // Fetch all non-admin users in selected batches and normalize/dedupe emails
  const rawUsers = await User.find(
    { 
      role: { $ne: 'admin' },
      batchId: { $in: batchIds },
      email: { $exists: true, $ne: '' }
    },
    'name email'
  ).lean();
  const seen = new Set();
  const students = (rawUsers || []).filter((u) => {
    const email = String(u?.email || '').trim().toLowerCase();
    if (!email || !isValidEmail(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  if (batchIds.length === 1) {
    const batch = await Batch.findById(batchIds[0], 'batchName').lean();
    batchName = batch?.batchName || 'Selected Batch';
  } else {
    const batches = await Batch.find({ _id: { $in: batchIds } }, 'batchName').lean();
    batchName = batches.map((b) => b.batchName).join(', ') || 'Selected Batches';
  }

  return { students, batchName };
};


// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/assignments/create
 * Creates a new assignment and dispatches email notifications to relevant students.
 */
const createAssignment = async (req, res) => {
  try {
    const {
      title, batchIds, startDate, lastDate, description,
      rubric, totalMarks, totalDuration, type, questions
    } = req.body;

    // 1. Validation
    if (!title || !batchIds?.length || !lastDate) {
      return res.status(400).json({ message: 'Title, at least one batch, and due date are required.' });
    }

    const normalizedBatchIds = await normalizeBatchIdsForStorage(batchIds);
    if (!normalizedBatchIds.length) {
      return res.status(400).json({ message: 'No valid batch selected.' });
    }

    // 2. Persist Assignment in MongoDB
    const assignment = await Assignment.create({
      title,
      batchIds: normalizedBatchIds,
      startDate: startDate || null,
      lastDate,
      description: description || '',
      rubric: rubric || '',
      totalMarks: Number(totalMarks) || 0,
      totalDuration: Number(totalDuration) || 0,
      type: type || 'practical',
      questions: type === 'mcq' ? (questions || []) : []
    });

    // 3. Resolve Students & Metadata
    const { students, batchName } = await resolveRecipientsAndBatchName(normalizedBatchIds);
    console.log(`\n📌 Assignment Created. Found ${students.length} students to notify.`);

    // 4. Dispatch Individual Emails Safely (Do NOT crash the app)
    let emailReport = { sent: 0, failed: 0, totalRecipients: students.length, enabled: true, failures: [] };
    try {
      const assignmentDataForEmail = { ...assignment.toObject(), batchName };
      
      // Await the report so we can respond with accurate sent/failed counts
      const fullReport = await sendAssignmentPublishedEmails(students, assignmentDataForEmail);
      
      if (fullReport) {
        emailReport.sent = fullReport.sent || 0;
        emailReport.failed = fullReport.failed || 0;
        emailReport.totalRecipients = fullReport.totalRecipients ?? students.length;
        emailReport.enabled = Boolean(fullReport.enabled ?? true);
        emailReport.failures = Array.isArray(fullReport.failures) ? fullReport.failures : [];
      }
    } catch (mailErr) {
      console.error('❌ [CRITICAL] Unhandled mail error (Ignored):', mailErr.message);
      // Failsafe: Continue execution even if the email system totally crashes
    }

    // 5. Final Success Response exactly as requested
    return res.status(201).json({
      message: "Assignment published successfully",
      sent: emailReport.sent,
      failed: emailReport.failed,
      emailReport,
      assignment 
    });

  } catch (error) {
    console.error('[createAssignment] Error:', error);
    return res.status(500).json({
      message: 'Server error while creating assignment.',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/assignments/all
 * Returns all assignments, sorted by creation date descending.
 */
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();

    // Backward compatibility: normalize legacy batch id keys to batchIds
    const normalized = assignments.map((item) => {
      if (Array.isArray(item.batchIds) && item.batchIds.length > 0) return item;
      const legacyBatchId = item.batchId || item.batchid || item.batchID;
      if (!legacyBatchId) return item;
      return { ...item, batchIds: [legacyBatchId] };
    });

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('[getAssignments] Error:', error);
    return res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/assignments/:id
 * Deletes an assignment by ID.
 */
const deleteAssignment = async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    return res.status(200).json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('[deleteAssignment] Error:', error);
    return res.status(500).json({ message: 'Failed to delete assignment.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { createAssignment, getAssignments, deleteAssignment };
