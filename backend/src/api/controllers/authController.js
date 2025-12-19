const User = require('../../models/userModel.js');
const Profile = require('../../models/profileModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const serviceAccount = require('../../utils/serviceAccountKey.js');

// Initialize Firebase Admin SDK (only if it hasn't been already)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

//Register a new user
exports.registerUser = async (req, res) => {
  // Get user data from the incoming request body
  const { firstName, lastName, email, password } = req.body;

  try {
    // 1. Check if a user with this email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create a new user instance using the model
    user = new User({ firstName, lastName, email, password });

    // 3. Hash the password before saving it
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save the user to the database
    await user.save();

    // 5. Send back a success response
    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

//Login a user and get a token
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Compare the submitted password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Determine whether the user has a completed profile
    let hasProfile = false;
    try {
      const profile = await Profile.findOne({ user: user.id });
      hasProfile = Boolean(profile && (profile.onboardingComplete === true));
    } catch (_) { /* ignore */ }

    // 4. If they match, create a JSON Web Token (JWT)
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your secret key
      { expiresIn: '1h' },   // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token, hasProfile }); // Include profile flag for frontend routing
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Google sign-in: issue JWT directly
exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verify the ID token sent from the frontend
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, email, uid } = decodedToken;

    // Check if the user already exists in your database
    let user = await User.findOne({ email: email });

    if (!user) {
      // If user doesn't exist, create a new one
      const [firstName, ...lastName] = name.split(' ');
      user = new User({
        email: email,
        firstName: firstName,
        lastName: lastName.join(' '),
        googleId: uid, // Use the Firebase UID as the googleId
        // Password is not required because we updated the model
      });
      await user.save();
    }

    // Determine whether the user has a completed profile
    let hasProfile = false;
    try {
      const profile = await Profile.findOne({ user: user.id });
      hasProfile = Boolean(profile && (profile.onboardingComplete === true));
    } catch (_) { /* ignore */ }

    // Now, create YOUR application's JWT to send back to the client
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Send your own token back to the frontend with profile flag
        res.json({ token, hasProfile });
      }
    );
  } catch (error) {
    // Log structured error for easier debugging in production logs
    console.error('Google login error:', {
      code: error.code,
      name: error.name,
      message: error.message,
    });
    const response = { message: 'Invalid or expired token. Please sign in again.' };
    if (process.env.NODE_ENV !== 'production') {
      response.code = error.code || error.name;
    }
    res.status(401).json(response);
  }
};
