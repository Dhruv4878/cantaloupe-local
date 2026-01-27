const Profile = require('../../models/profileModel');

// @desc    Get current user's profile
// @route   GET /api/profile/me
exports.getMyProfile = async (req, res) => {
  try {
    // Find the profile linked to the logged-in user's ID
    // Include creditLimit on populated user so clients can read current credit limits
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['firstName', 'email', 'creditLimit']);

    if (!profile) {
      // If the user has no profile, return a default empty object instead of 404
      // This prevents the frontend dashboard from crashing
      return res.status(200).json({
        social: {},
        onboardingComplete: false,
        accountType: null,
        message: 'No profile found, returning default structure.'
      });
    }

    // Convert Mongoose document to plain object to ensure all fields are included
    const profileObj = profile.toObject ? profile.toObject() : profile;

    // Ensure accountType is always included in the response (even if undefined/null)
    const response = {
      ...profileObj,
      accountType: profileObj.accountType || null,
    };

    res.json(response);
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
    accountType,
    businessName,
    website,
    noWebsite,
    businessDescription,
    businessType,
    targetAudience,
    brandPersonality,
  } = req.body || {};

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Build the profile object to save to the database
  const profileFields = {
    user: req.user.id,
    accountType,
    businessName,
    website,
    noWebsite,
    businessDescription,
    businessType,
    targetAudience,
    brandPersonality,
    onboardingComplete: true,
  };

  // Remove legacy fields from old flows so new profiles stay clean
  const legacyFieldsToUnset = {
    secondaryBrandColor: "",
    brandTone: "",
    keyMessages: "",
    contentThemes: "",
    postingFrequency: "",
    timezone: "",
    industry: "",
    companySize: "",
    businessLogo: "",
    primaryBrandColor: "",
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