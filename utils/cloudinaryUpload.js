const cloudinary = require('../config/cloudinary');

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

module.exports = { uploadToCloudinary };