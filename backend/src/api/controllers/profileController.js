const Profile = require('../../models/profileModel');

// @desc    Get current user's profile
// @route   GET /api/profile/me
exports.getMyProfile = async (req, res) => {
  try {
    // Find the profile linked to the logged-in user's ID
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['firstName', 'email']);

    if (!profile) {
      // If the user has no profile, return a default empty object instead of 404
      // This prevents the frontend dashboard from crashing
      return res.status(200).json({ 
        social: {}, 
        onboardingComplete: false,
        message: 'No profile found, returning default structure.'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create or update a user's profile
// @route   POST /api/profile
exports.createOrUpdateProfile = async (req, res) => {
  // Destructure all the expected fields from the form
  const {
    businessName,
    website,
    businessDescription,
    industry,
    companySize,
    businessLogo: bodyBusinessLogo,
    logoUrl: bodyLogoUrl,
    primaryBrandColor,
  } = req.body || {};

  // Consolidate logo field and log inputs
  const businessLogo = bodyBusinessLogo || bodyLogoUrl || '';

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Require a logo URL (Cloudinary secure_url) for the new 3-step flow
  // (Optional: You can remove this check if you want to allow profile creation without logo)
  if (!businessLogo) {
    return res
      .status(400)
      .json({ message: 'businessLogo is required. Please upload a logo first.' });
  }

  // Build the profile object to save to the database
  const profileFields = {
    user: req.user.id,
    businessName,
    website,
    businessDescription,
    industry,
    companySize,
    businessLogo,
    primaryBrandColor,
    onboardingComplete: true,
  };

  // Remove legacy fields from old 5-step flow so new profiles stay clean
  const legacyFieldsToUnset = {
    secondaryBrandColor: "",
    brandTone: "",
    targetAudience: "",
    keyMessages: "",
    contentThemes: "",
    postingFrequency: "",
    timezone: "",
  };

  try {
    // Find and update, or create if not exists (upsert)
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields, $unset: legacyFieldsToUnset },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error.message);
    res.status(500).send('Server Error');
  }
};