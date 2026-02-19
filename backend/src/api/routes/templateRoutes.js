const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// Public routes (no auth required)
router.get('/templates', templateController.getAllTemplates);
router.get('/templates/categories', templateController.getCategories);
router.get('/templates/category/:category', templateController.getTemplatesByCategory);

module.exports = router;