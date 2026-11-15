const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin only analytics
router.get('/platform', authenticate, authorize(['admin']), analyticsController.getPlatformAnalytics);

module.exports = router;
