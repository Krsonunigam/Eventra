const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'eventra/faces'
    });

    return result;
  } catch (error) {
    
    throw error;
  }
};

module.exports = { uploadToCloudinary, uploadBufferToCloudinary };
