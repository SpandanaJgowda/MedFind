const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllNotificationsRead);
router.put('/:id/read', notificationController.markNotificationRead);

module.exports = router;