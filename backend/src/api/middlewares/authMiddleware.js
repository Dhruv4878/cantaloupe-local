const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');

// Standard suspended message used when an account is inactive
const SUSPENDED_MSG = "you are suspended by admin if its a mistake contact us on email postgen@gmail.com";

// This must be 'module.exports'
module.exports = async function (req, res, next) {
  // Get the token from the 'Authorization' header
  // Example: "Bearer eyJhbGciOiJI..."
  const token = req.header('Authorization')?.split(' ')[1];

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify the token is valid
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Add the user's ID from the token to the request object
    req.user = decoded.user;

    // Ensure user still exists and is active
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.active === false) return res.status(403).json({ message: SUSPENDED_MSG });

    next(); // Proceed to the controller function
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};