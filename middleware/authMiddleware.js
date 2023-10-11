// authMiddleware.js
const jwt = require('jsonwebtoken');

const secretPassword = process.env.secretPassword;
module.exports = (req, res, next) => {
  // Get the token from the request header
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token,secretPassword); // Replace with your actual secret key

    // Attach the user's ID to the request object for future use
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
