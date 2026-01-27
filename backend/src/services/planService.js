const Plan = require('../models/Plan');

async function createPlan(data) {
  const plan = new Plan(data);
  await plan.save();
  return plan;
}

async function updatePlan(id, data) {
  return Plan.findByIdAndUpdate(id, data, { new: true });
}

async function deletePlan(id) {
  return Plan.findByIdAndDelete(id);
}

async function getPlans({ activeOnly = false } = {}) {
  const query = {};
  if (activeOnly) query.status = 'active';
  return Plan.find(query).sort({ price_monthly: 1 });
}

async function toggleStatus(id) {
  const plan = await Plan.findById(id);
  if (!plan) throw new Error('Plan not found');
  plan.status = plan.status === 'active' ? 'inactive' : 'active';
  await plan.save();
  return plan;
}
// Add this function inside your planService.js file
async function applyGlobalDiscount(percent) {
  // 1. Fetch all plans
  const plans = await Plan.find({}); 

  // 2. Loop through and calculate new yearly price
  const updatePromises = plans.map(plan => {
    const monthly = plan.price_monthly;
    // Calculate standard yearly cost (12 months)
    const totalYearly = monthly * 12;
    // Calculate discount amount
    const discountAmount = totalYearly * (percent / 100);
    // Set new yearly price
    plan.price_yearly = Math.round(totalYearly - discountAmount);
    
    return plan.save();
  });

  // 3. Wait for all updates to finish
  return Promise.all(updatePromises);
}

// Don't forget to export it at the bottom of the service file:
// module.exports = { ..., applyGlobalDiscount };

module.exports = { createPlan, updatePlan, deletePlan, getPlans, toggleStatus, applyGlobalDiscount };