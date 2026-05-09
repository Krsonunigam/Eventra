// routes/upload.js
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 🔥 Cloudinary storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventra/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventra/events',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadEvent = multer({
  storage: eventStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ✅ Profile image
router.post('/profile', auth, uploadProfile.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  return res.json({
    message: 'Uploaded successfully',
    url: req.file.path, // 🔥 Cloudinary URL
  });
});

// ✅ Event image
router.post('/event', auth, uploadEvent.single('eventImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  return res.json({
    message: 'Uploaded successfully',
    url: req.file.path, // 🔥 Cloudinary URL
  });
});

module.exports = router;