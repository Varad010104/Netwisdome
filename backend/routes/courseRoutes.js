const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createCourse, getCourses, deleteCourse } = require('../controllers/courseController');
const { uploadCourseImage } = require('../middleware/upload');

router.post('/create', (req, res, next) => {
  uploadCourseImage.single('image')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image size must be 5MB or smaller' });
      }
      return res.status(400).json({ message: err.message || 'File upload error' });
    }

    return res.status(400).json({ message: err.message || 'Invalid image upload' });
  });
}, createCourse);
router.get('/all', getCourses);
router.delete('/:id', deleteCourse);

module.exports = router;
