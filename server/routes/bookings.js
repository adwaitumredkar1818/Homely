const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');

// Helper function to check if a user has an active or pending booking
async function checkUserHasActiveBooking(userId) {
  // Check if main tenant of an active/pending booking
  const mainBooking = await prisma.booking.findFirst({
    where: {
      tenantId: userId,
      status: { in: ['CONFIRMED', 'PENDING'] }
    }
  });
  if (mainBooking) return true;

  // Check if a member of an active/pending booking
  const memberBooking = await prisma.groupMember.findFirst({
    where: {
      userId: userId,
      status: { in: ['ACCEPTED', 'PENDING'] },
      booking: {
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    }
  });
  return !!memberBooking;
}

// Book Room Route
router.post('/bookings', authenticateToken, async (req, res) => {
  const { roomId, price, roommateEmails } = req.body;
  try {
    // Check if the tenant already has an active or pending booking
    const hasActive = await checkUserHasActiveBooking(req.user.id);
    if (hasActive) {
      return res.status(400).json({ error: 'You can only book one room at a time.' });
    }

    const isGroup = Array.isArray(roommateEmails) && roommateEmails.length > 0;
    let validUsers = [];

    if (isGroup) {
      // Create GroupMember records and notifications
      const userMailMap = await Promise.all(
        roommateEmails.map(async email => {
          const u = await prisma.user.findUnique({ where: { email: email.trim() } });
          return u;
        })
      );

      validUsers = userMailMap.filter(u => u !== null && u.id !== req.user.id);

      // Check if any roommate already has an active/pending booking
      for (const roommate of validUsers) {
        const roommateHasActive = await checkUserHasActiveBooking(roommate.id);
        if (roommateHasActive) {
          return res.status(400).json({ error: `${roommate.name} (${roommate.email}) already has an active or pending booking.` });
        }
      }
    }
    
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

    if (status === 'ACCEPTED') {
      const hasActive = await checkUserHasActiveBooking(req.user.id);
      if (hasActive) {
        return res.status(400).json({ error: 'You already have an active or pending booking.' });
      }
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

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// Leave/Cancel Booking Route
router.post('/bookings/:id/leave', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { groupMembers: true, room: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if the user is either the main tenant or a group member
    const isMainTenant = booking.tenantId === req.user.id;
    const groupMember = booking.groupMembers.find(m => m.userId === req.user.id);

    if (!isMainTenant && !groupMember) {
      return res.status(403).json({ error: 'You are not authorized to leave this booking' });
    }

    // Update the booking status to CANCELLED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    });

    if (booking.isGroup) {
      await prisma.groupMember.updateMany({
        where: { bookingId: bookingId },
        data: { status: 'DECLINED' }
      });
    }

    // Send notifications to Host
    await sendNotification(
      booking.room.hostId,
      'BOOKING',
      'Booking Cancelled',
      `The booking for "${booking.room.title}" was cancelled/left by a tenant.`,
      '/host/reservations'
    );

    res.json({ success: true, message: 'Successfully left the room' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave booking' });
  }
});

module.exports = router;
