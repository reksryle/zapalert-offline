const jwt = require("jsonwebtoken");

// Middleware to check if user is logged in (like a security guard)
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.zapToken; // Get the security token from cookies
  if (!token) return res.status(401).json({ message: "Unauthorized. No token." }); // No token = no entry

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token is real
    req.user = decoded; // Attach user info to request for later use
    next(); // All good, proceed to the next function
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." }); // Token is fake or expired
  }
};

module.exports = authMiddleware;