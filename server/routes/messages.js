const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');
const { validateMessage } = require('../middleware/validator');

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const sentTo = await prisma.message.findMany({
      where: { senderId: req.user.id },
      select: { receiverId: true }
    });
    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: req.user.id },
      select: { senderId: true }
    });

    const userIds = [...new Set([...sentTo.map(m => m.receiverId), ...receivedFrom.map(m => m.senderId)])];

    const conversations = await Promise.all(userIds.map(async (uid) => {
      const otherUser = await prisma.user.findUnique({ 
        where: { id: uid }, 
        select: { id: true, name: true, email: true, role: true } 
      });
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: req.user.id, receiverId: uid },
            { senderId: uid, receiverId: req.user.id }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      return { user: otherUser, lastMessage };
    }));

    res.json(conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation (with cursor-based pagination)
router.get('/:otherUserId', authenticateToken, async (req, res) => {
  const otherUserId = parseInt(req.params.otherUserId);
  const { limit, before } = req.query;
  
  try {
    const limitNum = parseInt(limit) || 50;
    const where = {
      OR: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id }
      ]
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before)
      };
    }

    // Retrieve descending to get the latest messages before the cursor
    const messages = await prisma.message.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    // Return in ascending order for UI display
    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/', authenticateToken, validateMessage, async (req, res) => {
  const { receiverId, content } = req.body;
  const io = req.app.get('socketio'); // We will set this in server.js
  
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId: parseInt(receiverId)
      }
    });

    // Emit via socket.io for real-time
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', message);
    }
    
    // Send persistent & real-time notification
    await sendNotification(
      receiverId,
      'MESSAGE',
      'New Message',
      `${req.user.name || 'A user'} sent you a message: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      '/inbox'
    );

    res.json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
