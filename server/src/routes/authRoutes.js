const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public auth routes
router.post('/register/patient', authController.registerPatient);
router.post('/register/pharmacy', authController.registerPharmacy);
router.post('/login', authController.login);

// Protected auth routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
