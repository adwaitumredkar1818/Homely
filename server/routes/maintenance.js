const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');

// Create maintenance ticket
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, priority, roomId, imageUrl } = req.body;
  try {
    const ticket = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        roomId: roomId ? parseInt(roomId) : null,
        imageUrl: imageUrl || null,
        userId: req.user.id
      }
    });
    res.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create maintenance ticket' });
  }
});

// Get maintenance tickets
router.get('/', authenticateToken, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'HOST') {
      // Host sees tickets for their properties
      tickets = await prisma.maintenanceRequest.findMany({
        where: { room: { hostId: req.user.id } },
        include: { room: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Tenant sees their own tickets
      tickets = await prisma.maintenanceRequest.findMany({
        where: { userId: req.user.id },
        include: { room: true },
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch maintenance tickets' });
  }
});

// Update ticket status or host response
router.put('/:id', authenticateToken, async (req, res) => {
  const { status, hostResponse } = req.body;
  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can update tickets' });

    const ticket = await prisma.maintenanceRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        status: status || undefined, 
        hostResponse: hostResponse !== undefined ? hostResponse : undefined 
      }
    });

    // Notify Tenant
    await sendNotification(
      ticket.userId,
      'MAINTENANCE',
      'Maintenance Ticket Updated',
      `Your maintenance ticket "${ticket.title}" status has been set to "${ticket.status.toLowerCase()}".`,
      '/profile'
    );

    res.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update maintenance ticket' });
  }
});

module.exports = router;
