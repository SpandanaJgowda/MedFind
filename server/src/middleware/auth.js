const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Authenticate JWT token
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medifind_super_secure_jwt_secret_key_2026_healthcare');

    // Fetch user from DB to ensure account is still active and valid
    const rows = await db.query('SELECT id, name, email, role, phone, status FROM users WHERE id = ?', [decoded.id]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = rows[0];
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account has been suspended. Please contact support.' });
    }

    // If user is pharmacy owner, attach pharmacy info
    if (user.role === 'pharmacy_owner') {
      const pharmRows = await db.query('SELECT id, name, approval_status, license_number FROM pharmacies WHERE user_id = ?', [user.id]);
      if (pharmRows && pharmRows.length > 0) {
        user.pharmacy = pharmRows[0];
        user.pharmacy_id = pharmRows[0].id;
        user.approval_status = pharmRows[0].approval_status;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

// Role-based authorization middleware
function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please sign in.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`
      });
    }

    next();
  };
}

// Optional authentication (attaches user if valid token exists, doesn't block if not)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medifind_super_secure_jwt_secret_key_2026_healthcare');
      const rows = await db.query('SELECT id, name, email, role, phone, status FROM users WHERE id = ?', [decoded.id]);
      if (rows && rows.length > 0 && rows[0].status !== 'suspended') {
        req.user = rows[0];
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
