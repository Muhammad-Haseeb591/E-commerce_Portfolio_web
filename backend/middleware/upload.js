const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',           // folder name in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    // transformation: [{ width: 800, height: 800, crop: 'limit' }], // optional
  },
});

const upload = multer({ storage });

module.exports = upload;