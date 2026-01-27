const express = require('express');
const router = express.Router();
const superAdminAuth = require('../middleware/superAdminAuth');
const adminPlanController = require('../controllers/adminPlanController');

// Protected CRUD for plans
router.post('/plans', superAdminAuth, adminPlanController.createPlan);
router.put('/plans/:id', superAdminAuth, adminPlanController.updatePlan);
router.delete('/plans/:id', superAdminAuth, adminPlanController.deletePlan);
router.get('/plans', superAdminAuth, adminPlanController.getPlans);
router.patch('/plans/:id/status', superAdminAuth, adminPlanController.toggleStatus);

module.exports = router;
