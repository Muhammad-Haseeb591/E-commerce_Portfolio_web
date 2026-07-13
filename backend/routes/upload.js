const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err);
      return res.status(500).json({
        error: err.message || "Upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'Upload successful',
      url: req.file.path,
      public_id: req.file.filename,
    });
  });
});

router.post('/upload-multiple', (req, res) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err);
      return res.status(500).json({ error: err.message || "Upload failed" });
    }
    const urls = req.files.map((f) => f.path);
    res.json({ message: 'Upload successful', urls });
  });
});

module.exports = router;