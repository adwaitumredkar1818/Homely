const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');

// Book Room Route
router.post('/bookings', authenticateToken, async (req, res) => {
  const { roomId, price } = req.body;
  try {
    // Check if the tenant already has an active or pending booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        tenantId: req.user.id,
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    });

    if (activeBooking) {
      return res.status(400).json({ error: 'You can only book one room at a time.' });
    }

    const booking = await prisma.booking.create({
      data: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        totalPrice: (price * 3) + 800, // Matching frontend calculation
        status: "CONFIRMED",
        roomId: parseInt(roomId),
        tenantId: req.user.id
      }
    });

    // Notify Host
    const room = await prisma.room.findUnique({ where: { id: parseInt(roomId) } });
    if (room) {
      await sendNotification(
        room.hostId,
        'BOOKING',
        'New Booking Request',
        `A tenant requested a booking for "${room.title}".`,
        '/host/reservations'
      );
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update reservation status (ROOM or MESS)
router.patch('/host/reservations/:type/:id/status', authenticateToken, async (req, res) => {
  const { type, id } = req.params; // type: ROOM or MESS
  const { status } = req.body; // CONFIRMED, CANCELLED

  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can manage reservations' });

    let updated;
    if (type === 'ROOM') {
      updated = await prisma.booking.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { room: true }
      });
      await sendNotification(
        updated.tenantId,
        'BOOKING',
        `Booking ${status}`,
        `Your booking request for "${updated.room.title}" was ${status.toLowerCase()}.`,
        '/profile'
      );
    } else {
      updated = await prisma.messSubscription.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { mess: true }
      });
      await sendNotification(
        updated.tenantId,
        'BOOKING',
        `Subscription ${status}`,
        `Your subscription request for mess "${updated.mess.name}" was ${status.toLowerCase()}.`,
        '/profile'
      );
    }

    res.json({ success: true, reservation: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

module.exports = router;
