const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(" ")[1];

  // Check if no token
  if (!token) {
    console.log('No token found in request'); // Debug log
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message); // Debug log
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = authMiddleware;
