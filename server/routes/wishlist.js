const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Get wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        room: { 
          include: { 
            images: true, 
            host: { select: { name: true } }, 
            reviews: true 
          } 
        },
        mess: { 
          include: { 
            images: true, 
            host: { select: { name: true } }, 
            reviews: true 
          } 
        }
      }
    });
    res.json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Toggle wishlist status
router.post('/toggle', authenticateToken, async (req, res) => {
  const { roomId, messId } = req.body;
  try {
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: req.user.id,
        roomId: roomId ? parseInt(roomId) : null,
        messId: messId ? parseInt(messId) : null
      }
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ success: true, action: 'removed' });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: req.user.id,
          roomId: roomId ? parseInt(roomId) : null,
          messId: messId ? parseInt(messId) : null
        }
      });
      return res.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle wishlist' });
  }
});

module.exports = router;
