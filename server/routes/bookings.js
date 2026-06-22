const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');

// Book Room Route
router.post('/bookings', authenticateToken, async (req, res) => {
  const { roomId, price, roommateEmails } = req.body;
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

    const isGroup = Array.isArray(roommateEmails) && roommateEmails.length > 0;
    
    // Calculate totalPrice
    const basePrice = (price * 3) + 800; // Matching frontend calculation

    const booking = await prisma.booking.create({
      data: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        totalPrice: basePrice,
        status: isGroup ? "PENDING" : "CONFIRMED",
        roomId: parseInt(roomId),
        tenantId: req.user.id,
        isGroup: isGroup
      }
    });

    if (isGroup) {
      // Create GroupMember records and notifications
      const userMailMap = await Promise.all(
        roommateEmails.map(async email => {
          const u = await prisma.user.findUnique({ where: { email: email.trim() } });
          return u;
        })
      );

      const validUsers = userMailMap.filter(u => u !== null && u.id !== req.user.id);

      for (const roommate of validUsers) {
        await prisma.groupMember.create({
          data: {
            bookingId: booking.id,
            userId: roommate.id,
            status: 'PENDING'
          }
        });

        // Notify roommate
        const mainTenant = await prisma.user.findUnique({ where: { id: req.user.id } });
        await sendNotification(
          roommate.id,
          'BOOKING',
          'Shared Booking Invite',
          `${mainTenant.name} invited you to join a shared booking.`,
          '/profile'
        );
      }
    } else {
      // Notify Host directly for standard booking
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
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get group members and invite statuses for a specific booking
router.get('/bookings/:id/group-status', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        groupMembers: true
      }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const members = await Promise.all(booking.groupMembers.map(async m => {
      const u = await prisma.user.findUnique({ where: { id: m.userId }, select: { name: true, email: true } });
      return { ...m, name: u?.name, email: u?.email };
    }));

    res.json({ isGroup: booking.isGroup, members });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group status' });
  }
});

// Respond to group booking invite
router.put('/bookings/group/:id/respond', authenticateToken, async (req, res) => {
  const { status } = req.body; // ACCEPTED or DECLINED
  try {
    const memberRecord = await prisma.groupMember.findFirst({
      where: {
        bookingId: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!memberRecord) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.groupMember.update({
      where: { id: memberRecord.id },
      data: { status }
    });

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { groupMembers: true, room: true }
    });

    const mainTenant = await prisma.user.findUnique({ where: { id: booking.tenantId } });

    if (status === 'DECLINED') {
      // Cancel the entire booking if any member declines
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' }
      });

      await sendNotification(
        booking.tenantId,
        'BOOKING',
        'Group Booking Declined',
        `Roommate invitation was declined. Booking is cancelled.`,
        '/profile'
      );
    } else {
      // Check if all accepted
      const allAccepted = booking.groupMembers.every(m => m.status === 'ACCEPTED');
      if (allAccepted) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'CONFIRMED' }
        });

        // Notify Host
        await sendNotification(
          booking.room.hostId,
          'BOOKING',
          'Shared Booking Confirmed',
          `All invitees accepted. Shared booking for "${booking.room.title}" is confirmed.`,
          '/host/reservations'
        );

        // Notify Main Tenant
        await sendNotification(
          booking.tenantId,
          'BOOKING',
          'Group Booking Confirmed',
          `All roommates accepted. Your group booking is active.`,
          '/profile'
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to respond to group booking invitation' });
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
