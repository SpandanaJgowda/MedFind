const db = require('../config/db');

async function getMyNotifications(req, res) {
  try {
    const rows = await db.query(
      `SELECT id, event_type, title, message, resource_type, resource_id, created_at, read_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [req.user.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

module.exports = { getMyNotifications, markNotificationRead, markAllNotificationsRead };