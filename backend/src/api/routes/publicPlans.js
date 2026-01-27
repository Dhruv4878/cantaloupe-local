const express = require('express');
const router = express.Router();
const Plan = require('../../models/Plan');
const Settings = require('../../models/Settings');

// GET /api/public/plans -> return active plans with global discount applied
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ status: 'active' }).sort({ price_monthly: 1 });
    
    // Fetch global discount
    let settings = await Settings.findOne();
    const globalDiscount = settings?.globalDiscount || 0;
    
    // Apply global discount to yearly prices
    const plansWithDiscount = plans.map(plan => {
      const planObj = plan.toObject();
      if (globalDiscount > 0) {
        const monthlyTotal = planObj.price_monthly * 12;
        const discountAmount = monthlyTotal * (globalDiscount / 100);
        planObj.price_yearly = Math.round(monthlyTotal - discountAmount);
        planObj.globalDiscount = globalDiscount;
      } else {
        planObj.price_yearly = planObj.price_yearly || planObj.price_monthly * 12;
        planObj.globalDiscount = 0;
      }
      return planObj;
    });
    
    return res.json(plansWithDiscount);
  } catch (err) {
    console.error('Public plans error:', err);
    return res.status(500).json({ message: 'Failed to fetch plans' });
  }
});

module.exports = router;
