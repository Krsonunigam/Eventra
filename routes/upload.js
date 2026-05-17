const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  }
});

const uploadToFolder = (fieldName, folder) => (req, res, next) => {
  imageUpload.single(fieldName)(req, res, async (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, { folder });
      req.uploadedImage = result;
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

router.post('/profile', auth, uploadToFolder('profilePicture', 'eventra/profiles'), (req, res) => {
  res.json({
    message: 'Uploaded successfully',
    url: req.uploadedImage.secure_url,
    public_id: req.uploadedImage.public_id
  });
});

router.post('/event', auth, uploadToFolder('eventImage', 'eventra/events'), (req, res) => {
  res.json({
    message: 'Uploaded successfully',
    url: req.uploadedImage.secure_url,
    public_id: req.uploadedImage.public_id
  });
});

router.post('/signature', auth, uploadToFolder('signatureImage', 'eventra/signatures'), (req, res) => {
  res.json({
    message: 'Uploaded successfully',
    url: req.uploadedImage.secure_url,
    public_id: req.uploadedImage.public_id
  });
});

module.exports = router;
