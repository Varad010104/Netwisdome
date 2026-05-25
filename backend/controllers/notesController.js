const fs = require('fs');
const path = require('path');
const CourseNotes = require('../models/CourseNotes');
const Course = require('../models/courseModel');
const Batch = require('../models/Batch');
const { getFileDetails } = require('../middleware/notesUpload');

// Helper to determine public URL of a file
const getPublicFileUrl = (file) => {
  const { type } = getFileDetails(file.mimetype, file.originalname);
  let subfolder = 'resources';
  if (type === 'pdf') subfolder = 'pdf';
  else if (type === 'doc') subfolder = 'docs';
  else if (type === 'image') subfolder = 'images';
  
  return `/uploads/notes/${subfolder}/${file.filename}`;
};

// Helper to get file type string
const getFileTypeLabel = (file) => {
  const { type } = getFileDetails(file.mimetype, file.originalname);
  return type;
};

// Helper to delete a file from disk
const deleteFileFromDisk = (fileUrl) => {
  try {
    if (!fileUrl) return;
    // Extract local path from url (e.g., /uploads/notes/pdf/filename -> backend/uploads/notes/pdf/filename)
    const relativePath = fileUrl.replace(/^\//, '');
    const absolutePath = path.join(__dirname, '..', relativePath);
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`✅ File deleted from disk: ${absolutePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file from disk: ${fileUrl}`, error.message);
  }
};

// Create a new lesson/topic notes entry
exports.createNote = async (req, res) => {
  try {
    const {
      courseId,
      batchId,
      topicTitle,
      lessonTitle,
      lessonDescription,
      createdBy,
      orderIndex,
      visibilityStatus
    } = req.body;

    if (!courseId || !topicTitle || !lessonTitle) {
      return res.status(400).json({ message: 'courseId, topicTitle, and lessonTitle are required.' });
    }

    // Process files
    const uploadedFilesList = [];
    if (req.files && req.files.files) {
      req.files.files.forEach(file => {
        uploadedFilesList.push({
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: getPublicFileUrl(file),
          fileType: getFileTypeLabel(file),
          fileSize: file.size
        });
      });
    }

    // Process thumbnail
    let thumbnailPath = '';
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      thumbnailPath = getPublicFileUrl(req.files.thumbnail[0]);
    } else if (uploadedFilesList.length > 0) {
      // Fallback: If no thumbnail but there is an image uploaded, use that image
      const firstImage = uploadedFilesList.find(f => f.fileType === 'image');
      if (firstImage) {
        thumbnailPath = firstImage.fileUrl;
      }
    }

    const newNote = new CourseNotes({
      courseId,
      batchId: (batchId === 'all' || !batchId) ? null : batchId,
      topicTitle,
      lessonTitle,
      lessonDescription: lessonDescription || '',
      uploadedFiles: uploadedFilesList,
      thumbnail: thumbnailPath,
      createdBy: createdBy || null,
      orderIndex: orderIndex ? Number(orderIndex) : 0,
      visibilityStatus: visibilityStatus || 'published'
    });

    await newNote.save();
    
    // Populate course & batch details for the response
    const populated = await CourseNotes.findById(newNote._id)
      .populate('courseId', 'courseName category level')
      .populate('batchId', 'batchName');

    res.status(201).json({
      message: 'Lesson notes created successfully!',
      note: populated
    });
  } catch (error) {
    // If upload fails, cleanup files that might have been stored
    if (req.files) {
      if (req.files.files) req.files.files.forEach(f => deleteFileFromDisk(getPublicFileUrl(f)));
      if (req.files.thumbnail && req.files.thumbnail[0]) deleteFileFromDisk(getPublicFileUrl(req.files.thumbnail[0]));
    }
    res.status(500).json({ message: 'Failed to create lesson notes', error: error.message });
  }
};

// Update lesson/topic notes
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      courseId,
      batchId,
      topicTitle,
      lessonTitle,
      lessonDescription,
      orderIndex,
      visibilityStatus,
      existingFiles // JSON array of files to retain
    } = req.body;

    const note = await CourseNotes.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Course notes not found' });
    }

    // Parse list of existing files to keep
    let filesToKeep = [];
    if (existingFiles) {
      try {
        filesToKeep = typeof existingFiles === 'string' ? JSON.parse(existingFiles) : existingFiles;
      } catch (e) {
        console.error('Error parsing existingFiles:', e.message);
      }
    }

    // Find and delete files from disk that are removed
    const filesToKeepUrls = filesToKeep.map(f => f.fileUrl);
    note.uploadedFiles.forEach(file => {
      if (!filesToKeepUrls.includes(file.fileUrl)) {
        deleteFileFromDisk(file.fileUrl);
      }
    });

    // Process new files
    const updatedFilesList = [...filesToKeep];
    if (req.files && req.files.files) {
      req.files.files.forEach(file => {
        updatedFilesList.push({
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: getPublicFileUrl(file),
          fileType: getFileTypeLabel(file),
          fileSize: file.size
        });
      });
    }

    // Process new thumbnail
    let thumbnailPath = note.thumbnail;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      // Delete old thumbnail if it was a file upload and is being changed
      if (note.thumbnail && note.thumbnail !== thumbnailPath) {
        deleteFileFromDisk(note.thumbnail);
      }
      thumbnailPath = getPublicFileUrl(req.files.thumbnail[0]);
    } else if (req.body.thumbnail === '') {
      // Explicit thumbnail removal
      deleteFileFromDisk(note.thumbnail);
      thumbnailPath = '';
    }

    // Update fields
    if (courseId) note.courseId = courseId;
    if (batchId !== undefined) note.batchId = (batchId === 'all' || !batchId) ? null : batchId;
    if (topicTitle) note.topicTitle = topicTitle;
    if (lessonTitle) note.lessonTitle = lessonTitle;
    if (lessonDescription !== undefined) note.lessonDescription = lessonDescription;
    if (orderIndex !== undefined) note.orderIndex = Number(orderIndex);
    if (visibilityStatus) note.visibilityStatus = visibilityStatus;
    
    note.uploadedFiles = updatedFilesList;
    note.thumbnail = thumbnailPath;

    await note.save();

    const populated = await CourseNotes.findById(note._id)
      .populate('courseId', 'courseName category level')
      .populate('batchId', 'batchName');

    res.status(200).json({
      message: 'Lesson notes updated successfully!',
      note: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lesson notes', error: error.message });
  }
};

// Delete lesson/topic notes
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await CourseNotes.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Course notes not found' });
    }

    // Delete all attached files from disk
    note.uploadedFiles.forEach(file => {
      deleteFileFromDisk(file.fileUrl);
    });

    // Delete thumbnail if it exists
    if (note.thumbnail) {
      deleteFileFromDisk(note.thumbnail);
    }

    await CourseNotes.findByIdAndDelete(id);

    res.status(200).json({ message: 'Lesson notes and associated files deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lesson notes', error: error.message });
  }
};

// Get all notes (Admin view)
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await CourseNotes.find()
      .populate('courseId', 'courseName category level')
      .populate('batchId', 'batchName')
      .sort({ orderIndex: 1, createdAt: -1 });
      
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

// Get notes by Course
exports.getNotesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const notes = await CourseNotes.find({ courseId })
      .populate('courseId', 'courseName category level')
      .populate('batchId', 'batchName')
      .sort({ orderIndex: 1, createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course notes', error: error.message });
  }
};

// Get notes by Batch
exports.getNotesByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const notes = await CourseNotes.find({ batchId })
      .populate('courseId', 'courseName category level')
      .populate('batchId', 'batchName')
      .sort({ orderIndex: 1, createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batch notes', error: error.message });
  }
};

// Student API: Get notes only for their assigned course/batch
exports.getStudentNotes = async (req, res) => {
  try {
    // Expect batchId in query or retrieve it based on query params
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ message: 'batchId query parameter is required for students' });
    }

    // Only get published notes matching the batchId
    const notes = await CourseNotes.find({
      $or: [
        { batchId: batchId },
        { batchId: null },
        { batchId: { $exists: false } }
      ],
      visibilityStatus: 'published'
    })
    .populate('courseId', 'courseName description level category image')
    .populate('batchId', 'batchName')
    .sort({ orderIndex: 1, createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student notes', error: error.message });
  }
};

// Student API: Get notes filtered by Course for their assigned Batch
exports.getStudentNotesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ message: 'batchId query parameter is required for students' });
    }

    const notes = await CourseNotes.find({
      courseId: courseId,
      $or: [
        { batchId: batchId },
        { batchId: null },
        { batchId: { $exists: false } }
      ],
      visibilityStatus: 'published'
    })
    .populate('courseId', 'courseName description level category image')
    .populate('batchId', 'batchName')
    .sort({ orderIndex: 1, createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student course notes', error: error.message });
  }
};
