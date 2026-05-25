const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Define subdirectories inside uploads/notes
const BASE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'notes');
const DIRS = {
  pdf: path.join(BASE_UPLOAD_DIR, 'pdf'),
  docs: path.join(BASE_UPLOAD_DIR, 'docs'),
  images: path.join(BASE_UPLOAD_DIR, 'images'),
  resources: path.join(BASE_UPLOAD_DIR, 'resources'),
};

// Ensure all upload folders exist
Object.values(DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to determine the target folder and type of file
const getFileDetails = (mimetype, filename) => {
  const ext = path.extname(filename).toLowerCase();
  
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    return { dir: DIRS.pdf, type: 'pdf' };
  } else if (
    ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimetype) ||
    ['.doc', '.docx'].includes(ext)
  ) {
    return { dir: DIRS.docs, type: 'doc' };
  } else if (mimetype.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    return { dir: DIRS.images, type: 'image' };
  } else if (
    ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mimetype) ||
    ['.ppt', '.pptx'].includes(ext)
  ) {
    return { dir: DIRS.resources, type: 'ppt' };
  } else if (
    ['application/zip', 'application/x-zip-compressed', 'application/x-zip'].includes(mimetype) ||
    ['.zip'].includes(ext)
  ) {
    return { dir: DIRS.resources, type: 'zip' };
  } else {
    return { dir: DIRS.resources, type: 'resources' }; // Default fallback
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { dir } = getFileDetails(file.mimetype, file.originalname);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate secure and unique filename
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    cb(null, `${Date.now()}-${cleanOriginalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.png', '.jpg', '.jpeg', '.webp'];
  
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${ext || file.mimetype}`), false);
  }
};

// 10MB limit for general uploads, 25MB for resources
const uploadNotes = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
}).fields([
  { name: 'files', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }
]);

module.exports = {
  uploadNotes,
  getFileDetails
};
