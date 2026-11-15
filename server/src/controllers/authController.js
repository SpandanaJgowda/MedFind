const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'medifind_super_secure_jwt_secret_key_2026_healthcare', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// 1. Patient Registration
async function registerPatient(req, res) {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, 'patient', phone || null, 'active']
    );

    const userId = result.insertId;

    // Generate token
    const token = generateToken({
      id: userId,
      email: email.toLowerCase().trim(),
      role: 'patient',
      name: name.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'patient',
        phone: phone || null
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
}

// 2. Pharmacy Owner Registration (requires administrator approval)
async function registerPharmacy(req, res) {
  try {
    const {
      pharmacyName,
      ownerName,
      email,
      phone,
      licenseNumber,
      address,
      city,
      state,
      pincode,
      openingHours,
      password,
      confirmPassword,
      latitude,
      longitude
    } = req.body;

    // Validations
    if (!pharmacyName || !ownerName || !email || !phone || !licenseNumber || !address || !city || !state || !pincode || !password) {
      return res.status(400).json({ success: false, message: 'All required pharmacy registration fields must be filled.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check duplicate email
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check duplicate license number
    const existingLicense = await db.query('SELECT id FROM pharmacies WHERE license_number = ?', [licenseNumber.trim().toUpperCase()]);
    if (existingLicense.length > 0) {
      return res.status(400).json({ success: false, message: 'Pharmacy license number is already registered.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default coordinates if not provided (Bengaluru area approx)
    const lat = latitude ? parseFloat(latitude) : 12.9716 + (Math.random() - 0.5) * 0.08;
    const lng = longitude ? parseFloat(longitude) : 77.5946 + (Math.random() - 0.5) * 0.08;

    // Create user with transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [userRes] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        [ownerName.trim(), email.toLowerCase().trim(), passwordHash, 'pharmacy_owner', phone.trim(), 'active']
      );

      const userId = userRes.insertId;

      const [pharmRes] = await conn.query(
        `INSERT INTO pharmacies (
          user_id, name, owner_name, license_number, phone, email,
          address, city, state, pincode, latitude, longitude,
          opening_hours, approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          pharmacyName.trim(),
          ownerName.trim(),
          licenseNumber.trim().toUpperCase(),
          phone.trim(),
          email.toLowerCase().trim(),
          address.trim(),
          city.trim(),
          state.trim(),
          pincode.trim(),
          lat,
          lng,
          openingHours ? openingHours.trim() : '08:00 AM - 10:00 PM',
          'pending' // Requires Admin Approval
        ]
      );

      await conn.commit();

      const token = generateToken({
        id: userId,
        email: email.toLowerCase().trim(),
        role: 'pharmacy_owner',
        name: ownerName.trim(),
        pharmacyId: pharmRes.insertId,
        approvalStatus: 'pending'
      });

      return res.status(201).json({
        success: true,
        message: 'Pharmacy registration submitted successfully! Your account is currently pending administrator verification before your medicine inventory is publicly visible.',
        token,
        user: {
          id: userId,
          name: ownerName.trim(),
          email: email.toLowerCase().trim(),
          role: 'pharmacy_owner',
          phone: phone.trim(),
          pharmacy: {
            id: pharmRes.insertId,
            name: pharmacyName.trim(),
            licenseNumber: licenseNumber.trim().toUpperCase(),
            approvalStatus: 'pending'
          }
        }
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Pharmacy registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during pharmacy registration.' });
  }
}

// 3. Login (Patients, Pharmacy Owners, Admin)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended by an administrator.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If pharmacy owner, get pharmacy details
    let pharmacy = null;
    if (user.role === 'pharmacy_owner') {
      const pharmRows = await db.query('SELECT * FROM pharmacies WHERE user_id = ?', [user.id]);
      if (pharmRows.length > 0) {
        pharmacy = pharmRows[0];
      }
    }

    // Token payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      pharmacyId: pharmacy ? pharmacy.id : null,
      approvalStatus: pharmacy ? pharmacy.approval_status : null
    };

    const token = generateToken(payload);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          licenseNumber: pharmacy.license_number,
          approvalStatus: pharmacy.approval_status,
          address: pharmacy.address,
          city: pharmacy.city,
          phone: pharmacy.phone,
          openingHours: pharmacy.opening_hours
        } : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

// 4. Get Current User Profile
async function getMe(req, res) {
  try {
    const user = req.user;
    let pharmacy = null;

    if (user.role === 'pharmacy_owner') {
      const pharmRows = await db.query('SELECT * FROM pharmacies WHERE user_id = ?', [user.id]);
      if (pharmRows.length > 0) {
        pharmacy = pharmRows[0];
      }
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        pharmacy
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving user profile.' });
  }
}

// 5. Update Profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    await db.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name.trim(), phone || null, userId]);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        ...req.user,
        name: name.trim(),
        phone: phone || null
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// 6. Change Password
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const rows = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
}

module.exports = {
  registerPatient,
  registerPharmacy,
  login,
  getMe,
  updateProfile,
  changePassword
};
