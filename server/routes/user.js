const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        bookings: { include: { room: { include: { images: true } } } },
        messBookings: { include: { mess: { include: { images: true } } } },
        rooms: { include: { images: true } },
        messes: { include: { images: true, reviews: { include: { user: true } } } },
        wishlist: { include: { room: { include: { images: true } }, mess: { include: { images: true } } } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let inboundBookings = [];
    let inboundSubscriptions = [];
    let roomsWithReviews = user.rooms;
    let messesWithReviews = user.messes;

    if (user.role === 'HOST') {
      // Room management
      inboundBookings = await prisma.booking.findMany({
        where: { room: { hostId: user.id } },
        include: { room: true, tenant: true }
      });
      
      const allRooms = await prisma.room.findMany({
        where: { hostId: user.id },
        include: { 
          images: true,
          reviews: { include: { user: true } },
          bookings: { where: { status: 'CONFIRMED' } }
        }
      });

      roomsWithReviews = allRooms.map(r => {
        const totalRevenue = r.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const isBooked = r.bookings.length > 0; 
        return { ...r, totalRevenue, isBooked };
      });

      // Mess management
      inboundSubscriptions = await prisma.messSubscription.findMany({
        where: { mess: { hostId: user.id } },
        include: { mess: true, tenant: true }
      });
      
      const allMesses = await prisma.mess.findMany({
        where: { hostId: user.id },
        include: { 
          images: true,
          reviews: { include: { user: true } },
          subscriptions: { where: { status: 'CONFIRMED' } }
        }
      });

      messesWithReviews = allMesses.map(m => {
        const totalRevenue = m.subscriptions.reduce((sum, s) => sum + s.totalPrice, 0);
        const isBooked = m.subscriptions.length > 0;
        return { ...m, totalRevenue, isBooked };
      });
    }

    // Monthly revenue breakdown for Landlords
    let monthlyStats = [];
    if (user.role === 'HOST') {
      const allConfirmedItems = [
        ...inboundBookings.filter(b => b.status === 'CONFIRMED').map(b => ({ date: b.createdAt, amount: b.totalPrice })),
        ...inboundSubscriptions.filter(s => s.status === 'CONFIRMED').map(s => ({ date: s.createdAt, amount: s.totalPrice }))
      ];

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const statsMap = {};
      
      allConfirmedItems.forEach(item => {
        const d = new Date(item.date);
        const monthName = months[d.getMonth()];
        statsMap[monthName] = (statsMap[monthName] || 0) + item.amount;
      });

      monthlyStats = months.map(m => ({ month: m, revenue: statsMap[m] || 0 }));
    }

    res.json({
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isVerified: user.isVerified,
        idProofUrl: user.idProofUrl,
        studentIdUrl: user.studentIdUrl
      },
      myBookings: [
        ...user.bookings.map(b => ({ ...b, type: 'ROOM' })),
        ...user.messBookings.map(s => ({ ...s, type: 'MESS', room: s.mess, roomId: s.messId })) 
      ],
      myListings: roomsWithReviews,
      myMesses: messesWithReviews,
      inboundBookings: [
        ...inboundBookings.map(b => ({ ...b, type: 'ROOM' })),
        ...inboundSubscriptions.map(s => ({ ...s, type: 'MESS', room: s.mess, roomId: s.messId }))
      ],
      monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user verification status/files
router.put('/verify', authenticateToken, async (req, res) => {
  const { studentIdUrl, idProofUrl } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        studentIdUrl: studentIdUrl || null,
        idProofUrl: idProofUrl || null,
        isVerified: true // Auto-verify for demonstration purposes
      }
    });

    res.json({ 
      success: true, 
      user: { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        role: updatedUser.role,
        isVerified: updatedUser.isVerified 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// User details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, role: true, email: true, isVerified: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
