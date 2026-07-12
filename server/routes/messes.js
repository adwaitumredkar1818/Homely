const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { prisma, getDistance, JWT_SECRET } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifier');

// Get all messes (with optional filters & pagination)
router.get('/', async (req, res) => {
  const { search, type, collegeLat, collegeLng, maxDistance, maxPrice, minRating, minReviews, page, limit } = req.query;
  try {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } }
      ];
    }
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const messes = await prisma.mess.findMany({ 
      where,
      include: { 
        host: true, 
        rooms: true,
        images: true,
        reviews: true
      }
    });

    let mappedMesses = messes.map(m => {
      const reviewCount = m.reviews.length;
      const rating = reviewCount > 0 
        ? m.reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviewCount
        : 4.0 + ((m.id * 13) % 11) / 10; // Mock fallback
      
      return {
        ...m,
        image: m.images?.[0]?.url || null,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount || (5 + (m.id * 7) % 50),
        isVerified: m.isVerified
      };
    });

    if (maxPrice) {
      mappedMesses = mappedMesses.filter(m => m.price <= parseInt(maxPrice));
    }
    
    if (minRating) {
      mappedMesses = mappedMesses.filter(m => m.rating >= parseFloat(minRating));
    }
    
    if (minReviews) {
      mappedMesses = mappedMesses.filter(m => m.reviewCount >= parseInt(minReviews));
    }

    if (collegeLat && collegeLng && maxDistance) {
      const cLat = parseFloat(collegeLat);
      const cLng = parseFloat(collegeLng);
      const mDist = parseFloat(maxDistance);
      mappedMesses = mappedMesses.filter(m => {
        const dist = getDistance(cLat, cLng, m.lat, m.lng);
        m.distanceToCollege = parseFloat(dist.toFixed(2));
        return dist <= mDist;
      });
    }

    // Optional Pagination Slicing
    if (page) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 12;
      const skip = (pageNum - 1) * limitNum;
      
      const paginatedMesses = mappedMesses.slice(skip, skip + limitNum);
      return res.json({
        messes: paginatedMesses,
        totalCount: mappedMesses.length,
        hasMore: skip + limitNum < mappedMesses.length
      });
    }

    res.json(mappedMesses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messes' });
  }
});

// Get single mess detail
router.get('/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = -1;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // ignore invalid token for public route
      }
    }

    const mess = await prisma.mess.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        host: true,
        images: true,
        rooms: true,
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        subscriptions: { where: { tenantId: userId } }
      }
    });

    if (!mess) return res.status(404).json({ error: 'Mess not found' });

    const reviewCount = mess.reviews.length;
    let stats = { taste: 0, hygiene: 0, variety: 0, value: 0 };
    
    if (reviewCount > 0) {
      mess.reviews.forEach(rv => {
        stats.taste += rv.taste;
        stats.hygiene += rv.hygiene;
        stats.variety += rv.variety;
        stats.value += rv.value;
      });
      Object.keys(stats).forEach(k => stats[k] = parseFloat((stats[k] / reviewCount).toFixed(1)));
    }

    const avgRating = reviewCount > 0 
      ? parseFloat((mess.reviews.reduce((acc, rv) => acc + rv.overallRating, 0) / reviewCount).toFixed(1))
      : 4.2;

    res.json({
      ...mess,
      rating: avgRating,
      reviewCount: reviewCount || (20 + (mess.id * 5) % 100),
      stats: reviewCount > 0 ? stats : null,
      isSubscribed: mess.subscriptions.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mess details' });
  }
});

// Create standalone mess
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, price, location, type, lat, lng, image, images } = req.body;
  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can list messes' });

    const mess = await prisma.mess.create({
      data: {
        name,
        description,
        price: parseFloat(price) || 3000,
        location,
        type: type || 'VEG',
        lat: lat || 18.5204 + (Math.random() * 0.05),
        lng: lng || 73.8567 + (Math.random() * 0.05),
        hostId: req.user.id
      }
    });

    const imageList = (images && images.length > 0) ? images : (image ? [image] : ['']);
    for (const imgUrl of imageList) {
      await prisma.messImage.create({
        data: { url: imgUrl, messId: mess.id }
      });
    }

    res.json({ success: true, mess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create mess listing' });
  }
});

// Update Mess Route
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, description, price, location, type, lat, lng, images, image } = req.body;
  try {
    const messId = parseInt(req.params.id);
    const existingMess = await prisma.mess.findUnique({
      where: { id: messId }
    });
    if (!existingMess) return res.status(404).json({ error: 'Mess not found' });
    if (existingMess.hostId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const updatedMess = await prisma.mess.update({
      where: { id: messId },
      data: {
        name: name || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        location: location || undefined,
        type: type || undefined,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined
      }
    });

    const targetImages = images || (image ? [image] : null);
    if (targetImages) {
      await prisma.messImage.deleteMany({ where: { messId } });
      const imageList = targetImages.length > 0 ? targetImages : [''];
      for (const imgUrl of imageList) {
        await prisma.messImage.create({
          data: { url: imgUrl, messId }
        });
      }
    }

    res.json({ success: true, mess: updatedMess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update mess' });
  }
});

// Delete Mess Route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const messId = parseInt(req.params.id);
    const existingMess = await prisma.mess.findUnique({
      where: { id: messId }
    });
    if (!existingMess) return res.status(404).json({ error: 'Mess not found' });
    if (existingMess.hostId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    // Clean up dependent tables
    await prisma.messSubscription.deleteMany({ where: { messId } });
    await prisma.messReview.deleteMany({ where: { messId } });
    await prisma.messImage.deleteMany({ where: { messId } });
    await prisma.wishlist.deleteMany({ where: { messId } });

    await prisma.mess.delete({
      where: { id: messId }
    });

    res.json({ success: true, message: 'Mess listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete mess' });
  }
});

// Mess Subscription Route
router.post('/:id/subscribe', authenticateToken, async (req, res) => {
  const messId = parseInt(req.params.id);
  const { type, price } = req.body; // type: TRIAL or MONTHLY
  try {
    const subscription = await prisma.messSubscription.create({
      data: {
        type: type || 'MONTHLY',
        totalPrice: parseFloat(price),
        status: "CONFIRMED",
        messId,
        tenantId: req.user.id
      }
    });

    // Notify Host
    const mess = await prisma.mess.findUnique({ where: { id: messId } });
    if (mess) {
      await sendNotification(
        mess.hostId,
        'BOOKING',
        'New Subscription Request',
        `A tenant subscribed to your mess "${mess.name}".`,
        '/host/messes'
      );
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to subscribe to mess' });
  }
});

// Mess Review Route
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const messId = parseInt(req.params.id);
  const { taste, hygiene, variety, value, comment } = req.body;

  try {
    const overallRating = (taste + hygiene + variety + value) / 4;
    const review = await prisma.messReview.create({
      data: {
        taste, hygiene, variety, value,
        overallRating,
        comment,
        userId: req.user.id,
        messId
      }
    });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit mess review' });
  }
});

// Mess Recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const messId = parseInt(req.params.id);
    const targetMess = await prisma.mess.findUnique({ where: { id: messId } });
    if (!targetMess) return res.status(404).json({ error: 'Mess not found' });

    const allMesses = await prisma.mess.findMany({
      where: { id: { not: messId } },
      include: { images: true, host: true }
    });

    const recommendations = allMesses
      .map(m => {
        const reviewCount = m.reviews.length;
        const rating = reviewCount > 0 
          ? m.reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviewCount
          : 4.0 + ((m.id * 13) % 11) / 10;
        const distance = getDistance(targetMess.lat, targetMess.lng, m.lat, m.lng);
        const priceDiff = Math.abs(m.price - targetMess.price);

        return {
          ...m,
          image: m.images?.[0]?.url || null,
          rating: parseFloat(rating.toFixed(1)),
          reviewCount: reviewCount || (5 + (m.id * 7) % 50),
          distance,
          priceDiff
        };
      })
      .sort((a, b) => a.distance - b.distance || a.priceDiff - b.priceDiff)
      .slice(0, 4);

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Leave Mess Subscription Route
router.post('/subscriptions/:id/leave', authenticateToken, async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const subscription = await prisma.messSubscription.findUnique({
      where: { id: subId },
      include: { mess: true }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.tenantId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to cancel this subscription' });
    }

    // Update status to CANCELLED
    await prisma.messSubscription.update({
      where: { id: subId },
      data: { status: 'CANCELLED' }
    });

    // Notify Host
    await sendNotification(
      subscription.mess.hostId,
      'BOOKING',
      'Subscription Cancelled',
      `A tenant cancelled their subscription to "${subscription.mess.name}".`,
      '/host/messes'
    );

    res.json({ success: true, message: 'Successfully cancelled mess subscription' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
