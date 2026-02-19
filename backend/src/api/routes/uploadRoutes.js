const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Template image upload route
router.post('/upload/template-image',
  uploadController.uploadMiddleware,
  uploadController.uploadTemplateImage
);

// Template image delete route
router.delete('/upload/template-image', uploadController.deleteTemplateImage);

module.exports = router;