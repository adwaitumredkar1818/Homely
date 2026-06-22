const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;
