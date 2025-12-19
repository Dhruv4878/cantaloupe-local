const jwt = require('jsonwebtoken');

// This must be 'module.exports'
module.exports = function (req, res, next) {
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
    next(); // Proceed to the controller function
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};