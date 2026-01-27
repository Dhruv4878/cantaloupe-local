const planService = require('../../services/planService');

async function createPlan(req, res) {
  try {
    const { name, price_monthly, price_yearly, features = {}, recommended = false } = req.body;
    if (!name || typeof price_monthly !== 'number') return res.status(400).json({ message: 'Invalid plan data' });

    const plan = await planService.createPlan({ name, price_monthly, price_yearly, features, recommended });
    return res.status(201).json(plan);
  } catch (err) {
    console.error('Create plan error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function updatePlan(req, res) {
  try {
    const updated = await planService.updatePlan(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Plan not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Update plan error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function deletePlan(req, res) {
  try {
    await planService.deletePlan(req.params.id);
    return res.json({ message: 'Plan deleted' });
  } catch (err) {
    console.error('Delete plan error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getPlans(req, res) {
  try {
    const plans = await planService.getPlans();
    return res.json(plans);
  } catch (err) {
    console.error('Get plans error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function toggleStatus(req, res) {
  try {
    const plan = await planService.toggleStatus(req.params.id);
    return res.json(plan);
  } catch (err) {
    console.error('Toggle plan status error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// --- NEW FUNCTION ADDED HERE ---
async function applyGlobalDiscount(req, res) {
  try {
    const { discountPercent } = req.body;
    
    // Validate input
    if (discountPercent === undefined || discountPercent < 0) {
      return res.status(400).json({ message: 'Invalid discount percentage' });
    }

    // Call the service to update DB
    await planService.applyGlobalDiscount(Number(discountPercent));
    
    return res.json({ message: 'Global discount applied successfully' });
  } catch (err) {
    console.error('Global discount error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { 
  createPlan, 
  updatePlan, 
  deletePlan, 
  getPlans, 
  toggleStatus, 
  applyGlobalDiscount // Export the new function
};