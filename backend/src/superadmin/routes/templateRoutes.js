const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const superAdminAuth = require('../middleware/superAdminAuth');

// All routes require super admin authentication
router.use(superAdminAuth);

// Template management routes
router.get('/templates', templateController.getAllTemplates);
router.post('/templates', templateController.createTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);
router.patch('/templates/:id/toggle-status', templateController.toggleTemplateStatus);

module.exports = router;