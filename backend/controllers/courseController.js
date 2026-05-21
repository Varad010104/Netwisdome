const Course = require('../models/courseModel');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');

const withTimeout = async (promise, timeoutMs, message) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

const createCourse = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected. Please try again in a moment.' });
    }

    const body = req.body || {};
    const {
      courseName,
      description,
      level,
      category,
      duration,
      rating,
      batchId
    } = body;

    if (!courseName || !description || !level || !category) {
      return res.status(400).json({ message: 'courseName, description, level and category are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Course image is required' });
    }

    let batch = null;
    const isUnassigned = String(batchId || '').trim().toUpperCase() === 'UNASSIGNED';
    if (!isUnassigned) {
      if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({ message: 'Valid batchId is required' });
      }
      batch = await withTimeout(
        Batch.findById(batchId).maxTimeMS(5000),
        8000,
        'Database operation timed out while reading batch'
      );
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }
    }

    const parsedRating = Number(rating);
    const safeRating =
      Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5
        ? parsedRating
        : 4.9;

    const newCourse = new Course({
      courseName,
      description,
      level,
      category,
      duration: duration || '',
      rating: safeRating,
      image: `/uploads/${req.file.filename}`,
      batchId: batch?._id || null,
      batchName: batch?.batchName || 'Unassigned'
    });

    const savedCourse = await withTimeout(
      newCourse.save(),
      8000,
      'Database operation timed out while saving course'
    );
    if (batch?._id) {
      await withTimeout(
        Batch.findByIdAndUpdate(batch._id, { course: courseName }).maxTimeMS(5000),
        8000,
        'Database operation timed out while updating batch'
      );
    }
    return res.status(201).json({ message: 'Course created successfully', course: savedCourse });
  } catch (error) {
    const isDbTimeout = /timed out/i.test(error?.message || '');
    return res
      .status(isDbTimeout ? 503 : 500)
      .json({ message: isDbTimeout ? 'Database timeout. Please try again.' : 'Error creating course', error: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected. Please try again in a moment.' });
    }

    const courses = await withTimeout(
      Course.find().sort({ createdAt: -1 }).maxTimeMS(5000),
      8000,
      'Database operation timed out while fetching courses'
    );
    return res.status(200).json(courses);
  } catch (error) {
    const isDbTimeout = /timed out/i.test(error?.message || '');
    return res
      .status(isDbTimeout ? 503 : 500)
      .json({ message: isDbTimeout ? 'Database timeout. Please try again.' : 'Error fetching courses', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected. Please try again in a moment.' });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid course id is required' });
    }

    const deleted = await withTimeout(
      Course.findByIdAndDelete(id).maxTimeMS(5000),
      8000,
      'Database operation timed out while deleting course'
    );

    if (!deleted) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    const isDbTimeout = /timed out/i.test(error?.message || '');
    return res
      .status(isDbTimeout ? 503 : 500)
      .json({ message: isDbTimeout ? 'Database timeout. Please try again.' : 'Error deleting course', error: error.message });
  }
};

module.exports = { createCourse, getCourses, deleteCourse };
