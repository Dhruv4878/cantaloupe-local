const Settings = require('../../models/Settings');

async function getGlobalDiscount(req, res) {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      settings = new Settings({ globalDiscount: 0 });
      await settings.save();
    }
    
    return res.json({ globalDiscount: settings.globalDiscount });
  } catch (err) {
    console.error('Get global discount error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function setGlobalDiscount(req, res) {
  try {
    const { globalDiscount } = req.body;
    
    // Validate input
    if (globalDiscount === undefined || globalDiscount < 0 || globalDiscount > 100) {
      return res.status(400).json({ message: 'Invalid discount percentage (0-100)' });
    }

    let settings = await Settings.findOne();
    
    // If no settings exist, create new
    if (!settings) {
      settings = new Settings({ globalDiscount });
    } else {
      settings.globalDiscount = globalDiscount;
      settings.updatedAt = new Date();
    }
    
    await settings.save();
    return res.json({ message: 'Global discount updated', globalDiscount: settings.globalDiscount });
  } catch (err) {
    console.error('Set global discount error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getGlobalDiscount, setGlobalDiscount };
