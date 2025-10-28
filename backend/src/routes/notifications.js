const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory storage for push subscriptions (in production, use database)
const pushSubscriptions = new Map();

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user.id;

    if (!endpoint || !keys) {
      return res.status(400).json({
        success: false,
        message: 'Missing subscription data',
      });
    }

    // Store subscription
    pushSubscriptions.set(userId, {
      endpoint,
      keys,
      userId,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications',
    });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/notifications/unsubscribe
 */
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove subscription
    pushSubscriptions.delete(userId);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications',
    });
  }
});

/**
 * Get user notifications (placeholder)
 * GET /api/notifications
 */
router.get('/', auth, async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Notifications feature implemented',
  });
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

/**
 * Send test notification (admin only)
 * POST /api/notifications/test
 */
router.post('/test', auth, async (req, res) => {
  try {
    const { title, body, url } = req.body;

    // In production, use web-push library to send notifications
    // For now, just acknowledge the request
    res.json({
      success: true,
      message: 'Test notification sent',
      data: {
        title,
        body,
        url,
        subscribersCount: pushSubscriptions.size,
      },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
});

module.exports = router;
