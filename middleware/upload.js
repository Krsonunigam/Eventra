const multer = require('multer');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const upload = {
  single(fieldName, options = {}) {
    return (req, res, next) => {
      memoryUpload.single(fieldName)(req, res, async (error) => {
        if (error) return next(error);
        if (!req.file) return next();

        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, {
            folder: options.folder || 'eventra',
            public_id: options.publicId,
            overwrite: false
          });

          req.file.path = result.secure_url;
          req.file.url = result.secure_url;
          req.file.secure_url = result.secure_url;
          req.file.public_id = result.public_id;
          next();
        } catch (uploadError) {
          next(uploadError);
        }
      });
    };
  }
};

module.exports = upload;
