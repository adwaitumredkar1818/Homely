const express = require('express');
const router = express.Router();
const { prisma, getDistance } = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { validateRoom } = require('../middleware/validator');

// Get all rooms (with filters & optional pagination)
router.get('/', async (req, res) => {
  const { search, maxPrice, minRating, minReviews, amenities, collegeLat, collegeLng, maxDistance, page, limit } = req.query;

  try {
    let dbRooms = await prisma.room.findMany({ 
        include: { images: true, host: true } 
    });

    // 1. Initial Mapping and Deterministic Randomization
    let mappedRooms = dbRooms.map((r, index) => {
      try {
        const rating = 3.5 + (((r.id * 17) % 16) / 10);
        const reviews = 10 + ((r.id * 83) % 400);
        
        let parsedAmenities = [];
        try {
          parsedAmenities = typeof r.amenities === 'string' ? JSON.parse(r.amenities) : r.amenities;
        } catch (e) {
          parsedAmenities = [];
        }

        let parsedMesses = [];
        try {
          parsedMesses = typeof r.messes === 'string' ? JSON.parse(r.messes || '[]') : (r.messes || []);
        } catch (e) {
          parsedMesses = [];
        }

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          price: r.price,
          location: r.location,
          lat: r.lat,
          lng: r.lng,
          amenities: parsedAmenities,
          messes: parsedMesses,
          image: r.images?.[0]?.url || null, 
          rating: parseFloat(rating.toFixed(1)), 
          reviews: reviews,
          isVerified: r.isVerified,
          host: r.host
        };
      } catch (err) {
        console.error(`Error processing room:`, err);
        throw err;
      }
    });

    // 2. Filters
    if (search) {
      const lowerSearch = search.toLowerCase();
      mappedRooms = mappedRooms.filter(r => 
        r.title.toLowerCase().includes(lowerSearch) || 
        r.location.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (maxPrice) {
      mappedRooms = mappedRooms.filter(r => r.price <= parseInt(maxPrice));
    }
    
    if (minRating) {
      mappedRooms = mappedRooms.filter(r => r.rating >= parseFloat(minRating));
    }
    
    if (minReviews) {
      mappedRooms = mappedRooms.filter(r => r.reviews >= parseInt(minReviews));
    }
    
    if (amenities) {
      const amenityFilters = amenities.split(',').map(a => a.trim());
      mappedRooms = mappedRooms.filter(r => 
        amenityFilters.every(filter => r.amenities.includes(filter))
      );
    }

    if (collegeLat && collegeLng && maxDistance) {
      const cLat = parseFloat(collegeLat);
      const cLng = parseFloat(collegeLng);
      const mDist = parseFloat(maxDistance);
      mappedRooms = mappedRooms.filter(r => {
        const dist = getDistance(cLat, cLng, r.lat, r.lng);
        r.distanceToCollege = parseFloat(dist.toFixed(2));
        return dist <= mDist;
      });
    }

    // 3. Optional Pagination Slicing
    if (page) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 12;
      const skip = (pageNum - 1) * limitNum;
      
      const paginatedRooms = mappedRooms.slice(skip, skip + limitNum);
      return res.json({
        rooms: paginatedRooms,
        totalCount: mappedRooms.length,
        hasMore: skip + limitNum < mappedRooms.length
      });
    }

    res.json(mappedRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get single room details
router.get('/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        host: true,
        images: true,
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });

    let amenities = [];
    try {
      amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
    } catch(e) {
      amenities = [];
    }

    let messes = [];
    try {
      messes = typeof room.messes === 'string' ? JSON.parse(room.messes || '[]') : (room.messes || []);
    } catch(e) {
      messes = [];
    }

    const reviewCount = room.reviews.length;
    const avgRating = reviewCount > 0 
      ? parseFloat((room.reviews.reduce((acc, rv) => acc + rv.overallRating, 0) / reviewCount).toFixed(1))
      : 4.5;

    res.json({
      ...room,
      amenities,
      messes,
      rating: avgRating,
      reviewCount: reviewCount || (12 + (room.id * 7) % 200)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

// Create Room Route
router.post('/', authenticateToken, validateRoom, async (req, res) => {
  const { title, description, price, location, amenities, messes, lat, lng, images } = req.body;
  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can create rooms' });

    const roomLat = lat ? parseFloat(lat) : 18.5204 + (Math.random() * 0.1);
    const roomLng = lng ? parseFloat(lng) : 73.8567 + (Math.random() * 0.1);

    const mappedMesses = (messes || []).map((mName, idx) => ({
      name: mName,
      lat: roomLat + (0.001 * (idx + 1) * (Math.random() > 0.5 ? 1 : -1)),
      lng: roomLng + (0.001 * (idx + 1) * (Math.random() > 0.5 ? 1 : -1))
    }));

    const dbRoom = await prisma.room.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        lat: roomLat,
        lng: roomLng,
        amenities: JSON.stringify(amenities),
        messes: JSON.stringify(mappedMesses),
        hostId: req.user.id
      }
    });
    
    const imageList = (images && images.length > 0) ? images : [''];
    for (const imgUrl of imageList) {
      await prisma.image.create({
        data: {
          url: imgUrl,
          roomId: dbRoom.id
        }
      });
    }

    res.json({ success: true, room: dbRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post new room' });
  }
});

// Update Room Route
router.put('/:id', authenticateToken, validateRoom, async (req, res) => {
  const { title, description, price, location, amenities, messes, lat, lng, images } = req.body;
  try {
    const roomId = parseInt(req.params.id);
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (!existingRoom) return res.status(404).json({ error: 'Room not found' });
    if (existingRoom.hostId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const roomLat = lat ? parseFloat(lat) : existingRoom.lat;
    const roomLng = lng ? parseFloat(lng) : existingRoom.lng;

    const mappedMesses = messes ? (typeof messes === 'string' ? JSON.parse(messes) : messes).map((mName, idx) => ({
      name: typeof mName === 'string' ? mName : (mName.name || ''),
      lat: mName.lat || (roomLat + (0.001 * (idx + 1) * (Math.random() > 0.5 ? 1 : -1))),
      lng: mName.lng || (roomLng + (0.001 * (idx + 1) * (Math.random() > 0.5 ? 1 : -1)))
    })) : undefined;

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        title: title || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        location: location || undefined,
        lat: roomLat,
        lng: roomLng,
        amenities: amenities ? JSON.stringify(amenities) : undefined,
        messes: mappedMesses ? JSON.stringify(mappedMesses) : undefined
      }
    });

    if (images) {
      await prisma.image.deleteMany({ where: { roomId } });
      const imageList = images.length > 0 ? images : [''];
      for (const imgUrl of imageList) {
        await prisma.image.create({
          data: {
            url: imgUrl,
            roomId
          }
        });
      }
    }

    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete Room Route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (!existingRoom) return res.status(404).json({ error: 'Room not found' });
    if (existingRoom.hostId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    await prisma.booking.deleteMany({ where: { roomId } });
    await prisma.review.deleteMany({ where: { roomId } });
    await prisma.image.deleteMany({ where: { roomId } });
    await prisma.wishlist.deleteMany({ where: { roomId } });
    await prisma.maintenanceRequest.deleteMany({ where: { roomId } });

    await prisma.room.delete({
      where: { id: roomId }
    });

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Room Review Route
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const roomId = parseInt(req.params.id);
  const { cleanliness, accuracy, communication, location, value, comment } = req.body;

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        roomId,
        tenantId: req.user.id,
        status: 'CONFIRMED'
      }
    });

    if (!booking) {
      return res.status(403).json({ error: "Only users with a confirmed booking can leave a review." });
    }

    const overallRating = (cleanliness + accuracy + communication + location + value) / 5;
    const review = await prisma.review.create({
      data: {
        cleanliness, accuracy, communication, location, value,
        overallRating,
        comment,
        userId: req.user.id,
        roomId
      }
    });
    res.json({ success: true, review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// Room Recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const targetRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!targetRoom) return res.status(404).json({ error: 'Room not found' });

    const allRooms = await prisma.room.findMany({
      where: { id: { not: roomId } },
      include: { images: true, host: true }
    });

    const recommendations = allRooms
      .map(r => {
        const rating = 3.5 + (((r.id * 17) % 16) / 10);
        const reviews = 10 + ((r.id * 83) % 400);
        const distance = getDistance(targetRoom.lat, targetRoom.lng, r.lat, r.lng);
        const priceDiff = Math.abs(r.price - targetRoom.price);

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          price: r.price,
          location: r.location,
          lat: r.lat,
          lng: r.lng,
          image: r.images?.[0]?.url || null,
          rating: parseFloat(rating.toFixed(1)),
          reviews: reviews,
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

module.exports = router;
