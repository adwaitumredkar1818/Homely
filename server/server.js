require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

// --- DEPLOYMENT READINESS CHECK ---
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', `FATAL ERROR: Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// --- HELPERS ---
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'homely_secret_key_2026';

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));
app.use(express.json());

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ... existing socket.io code ...

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'TENANT'
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- MATCHMAKING ROUTES ---

app.get('/api/matchmaking/roommates', authenticateToken, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const others = await prisma.user.findMany({
      where: {
        id: { not: currentUser.id },
        role: 'TENANT'
      }
    });

    const matches = others.map(other => {
      let score = 0;
      
      // Study Preference Match
      if (currentUser.studyPreference === other.studyPreference && currentUser.studyPreference !== 'NEUTRAL') score += 30;
      else if (currentUser.studyPreference === 'NEUTRAL' || other.studyPreference === 'NEUTRAL') score += 15;

      // Cleanliness
      const cleanDiff = Math.abs((currentUser.cleanlinessLevel || 3) - (other.cleanlinessLevel || 3));
      score += (5 - cleanDiff) * 6;

      // Social Preference
      if (currentUser.socialPreference === other.socialPreference && currentUser.socialPreference !== 'NEUTRAL') score += 20;
      else if (currentUser.socialPreference === 'NEUTRAL' || other.socialPreference === 'NEUTRAL') score += 10;

      // Smoking
      if (currentUser.isSmoking === other.isSmoking) score += 10;
      
      // Vegetarian
      if (currentUser.isVegetarian === other.isVegetarian) score += 10;

      const insights = [];
      if (currentUser.studyPreference === other.studyPreference && currentUser.studyPreference !== 'NEUTRAL') 
        insights.push("Similar study rhythm");
      if (cleanDiff <= 1) 
        insights.push("Syncs on cleanliness");
      if (currentUser.socialPreference === other.socialPreference && currentUser.socialPreference !== 'NEUTRAL') 
        insights.push("Matching social vibe");
      if (currentUser.isVegetarian === other.isVegetarian) 
        insights.push(currentUser.isVegetarian ? "Both vegetarians" : "Shared dietary lifestyle");

      return {
        id: other.id,
        name: other.name,
        email: other.email,
        bio: other.bio || "Looking for a great roommate!",
        college: other.college || "Student",
        compatibility: Math.min(score, 100),
        insights,
        lifestyle: {
          study: other.studyPreference,
          cleanliness: other.cleanlinessLevel,
          social: other.socialPreference,
          smoking: other.isSmoking,
          veg: other.isVegetarian
        }
      };
    }).sort((a, b) => b.compatibility - a.compatibility);

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Matchmaking failed' });
  }
});

// --- PROFILE ROUTE ---

app.get('/api/user/profile', authenticateToken, async (req, res) => {
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
        // A room is "booked" if it has any confirmed booking (simplified for this app)
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, college: user.college, studyPreference: user.studyPreference, cleanlinessLevel: user.cleanlinessLevel, socialPreference: user.socialPreference, isSmoking: user.isSmoking, isVegetarian: user.isVegetarian },
      myBookings: [
        ...user.bookings.map(b => ({ ...b, type: 'ROOM' })),
        ...user.messBookings.map(s => ({ ...s, type: 'MESS', room: s.mess, roomId: s.messId })) 
      ],
      myListings: roomsWithReviews,
      myMesses: messesWithReviews,
      monthlyStats,
      inboundBookings,
      inboundSubscriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Base Route
app.get('/', (req, res) => {
  res.send('Homely API Server is running');
});

// Rooms Routes
app.get('/api/rooms', async (req, res) => {
  const { search, maxPrice, minRating, minReviews, amenities, collegeLat, collegeLng, maxDistance } = req.query;

  try {
    let dbRooms = await prisma.room.findMany({ 
        include: { images: true, host: true } 
    });

    // 1. Initial Mapping and Deterministic Randomization
    let mappedRooms = dbRooms.map((r, index) => {
        try {
            const rating = 3.5 + (((r.id * 17) % 16) / 10); // Deterministic 3.5 to 5.0
            const reviews = 10 + ((r.id * 83) % 400); // Deterministic 10 to 410
            
            let parsedAmenities = [];
            try {
              parsedAmenities = typeof r.amenities === 'string' ? JSON.parse(r.amenities) : r.amenities;
            } catch (e) {
              console.error(`Failed to parse amenities for room ${r.id}:`, r.amenities);
              parsedAmenities = [];
            }

            let parsedMesses = [];
            try {
              parsedMesses = typeof r.messes === 'string' ? JSON.parse(r.messes || '[]') : (r.messes || []);
            } catch (e) {
              console.error(`Failed to parse messes for room ${r.id}:`, r.messes);
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
            console.error(`Critical error processing room at index ${index}:`, err);
            throw err;
        }
    });

    // 2. Extrapolated Filtering Layers
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

    res.json(mappedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const dbRoom = await prisma.room.findUnique({ 
        where: { id: parseInt(req.params.id) }, 
        include: { 
          images: true,
          reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
          nearbyMesses: true,
          host: true
        } 
    });
    if (!dbRoom) return res.status(404).json({ error: 'Room not found' });
    
    // Calculate aggregate ratings
    const reviewCount = dbRoom.reviews.length;
    let stats = {
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      value: 0
    };

    if (reviewCount > 0) {
      dbRoom.reviews.forEach(rv => {
        stats.cleanliness += rv.cleanliness;
        stats.accuracy += rv.accuracy;
        stats.communication += rv.communication;
        stats.location += rv.location;
        stats.value += rv.value;
      });
      Object.keys(stats).forEach(key => stats[key] = parseFloat((stats[key] / reviewCount).toFixed(1)));
    }

    const avgRating = reviewCount > 0 
      ? parseFloat((dbRoom.reviews.reduce((acc, rv) => acc + rv.overallRating, 0) / reviewCount).toFixed(1))
      : 3.5 + (((dbRoom.id * 17) % 16) / 10); // Mock fallback

    res.json({
        id: dbRoom.id,
        title: dbRoom.title,
        description: dbRoom.description,
        price: dbRoom.price,
        location: dbRoom.location,
        lat: dbRoom.lat,
        lng: dbRoom.lng,
        amenities: JSON.parse(dbRoom.amenities),
        messes: dbRoom.nearbyMesses.length > 0 ? dbRoom.nearbyMesses : JSON.parse(dbRoom.messes || '[]'),
        image: dbRoom.images?.[0]?.url || null, // null triggers local assets fallback
        rating: avgRating,
        reviewCount: reviewCount || (10 + ((dbRoom.id * 83) % 400)), // Real or Mock
        reviews: dbRoom.reviews,
        stats: reviewCount > 0 ? stats : null,
        hostId: dbRoom.hostId,
        host: dbRoom.host,
        isVerified: dbRoom.isVerified
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Book Room Route
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { roomId, price } = req.body;
  try {
    // Enforce one active booking at a time per tenant
    const existing = await prisma.booking.findFirst({
      where: {
        tenantId: req.user.id,
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active booking. Cancel it before booking a new one.' });
    }

    const booking = await prisma.booking.create({
      data: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        totalPrice: (price * 3) + 800,
        status: "CONFIRMED",
        roomId: parseInt(roomId),
        tenantId: req.user.id
      }
    });
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Create Room Route
app.post('/api/rooms', authenticateToken, async (req, res) => {
  const { title, description, price, location, amenities, messes, images, lat, lng } = req.body;
  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can create rooms' });

    const roomLat = lat ? parseFloat(lat) : 18.5204 + (Math.random() * 0.1);
    const roomLng = lng ? parseFloat(lng) : 73.8567 + (Math.random() * 0.1);

    // Transform messes from string list to object list with local random coords
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
    
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await prisma.image.create({
          data: {
            url: img.url,
            isPanorama: !!img.isPanorama,
            roomId: dbRoom.id
          }
        });
      }
    } else {
      await prisma.image.create({
        data: {
          url: '', // Empty URL triggers local fallback
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

// --- MESS ROUTES ---

// Get all messes with optional search
app.get('/api/messes', async (req, res) => {
  const { search, type, collegeLat, collegeLng, maxDistance, maxPrice, minRating, minReviews } = req.query;
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

    res.json(mappedMesses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messes' });
  }
});

// Get single mess detail
app.get('/api/messes/:id', async (req, res) => {
  try {
    const mess = await prisma.mess.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        host: true,
        images: true,
        rooms: true,
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        subscriptions: { where: { tenantId: req.user?.id || -1 } }
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
app.post('/api/messes', authenticateToken, async (req, res) => {
  const { name, description, price, location, type, lat, lng, images } = req.body;
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

    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await prisma.messImage.create({
          data: {
            url: img.url,
            isPanorama: !!img.isPanorama,
            messId: mess.id
          }
        });
      }
    } else {
      await prisma.messImage.create({
        data: { url: '', messId: mess.id }
      });
    }

    res.json({ success: true, mess });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mess listing' });
  }
});

// Mess Subscription Route
app.post('/api/messes/:id/subscribe', authenticateToken, async (req, res) => {
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
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subscribe to mess' });
  }
});

// Mess Review Route
app.post('/api/messes/:id/reviews', authenticateToken, async (req, res) => {
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

// Post Review Route
app.post('/api/rooms/:id/reviews', authenticateToken, async (req, res) => {
  const roomId = parseInt(req.params.id);
  const { cleanliness, accuracy, communication, location, value, comment } = req.body;

  try {
    // 1. Verify user has a confirmed booking for this room
    const booking = await prisma.booking.findFirst({
      where: {
        roomId,
        tenantId: req.user.id,
        status: "CONFIRMED"
      }
    });

    if (!booking) {
      return res.status(403).json({ error: "Only users with a confirmed booking can leave a review." });
    }

    // 2. Check if user already reviewed this room
    const existingReview = await prisma.review.findFirst({
      where: { roomId, userId: req.user.id }
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this property." });
    }

    // 3. Create the review
    const overallRating = (cleanliness + accuracy + communication + location + value) / 5;
    
    const review = await prisma.review.create({
      data: {
        cleanliness,
        accuracy,
        communication,
        location,
        value,
        overallRating,
        comment,
        imageUrl: req.body.imageUrl || null,
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

// --- RESERVATION MANAGEMENT ---

app.patch('/api/host/reservations/:type/:id/status', authenticateToken, async (req, res) => {
  const { type, id } = req.params; // type: ROOM or MESS
  const { status } = req.body; // CONFIRMED, CANCELLED

  try {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Only hosts can manage reservations' });

    let updated;
    if (type === 'ROOM') {
      updated = await prisma.booking.update({
        where: { id: parseInt(id) },
        data: { status }
      });
    } else {
      updated = await prisma.messSubscription.update({
        where: { id: parseInt(id) },
        data: { status }
      });
    }

    res.json({ success: true, reservation: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// --- MESSAGING SYSTEM ---

// Get all conversations for current user
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    // Find all users who have sent or received messages with current user
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
      const otherUser = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, name: true, email: true, role: true } });
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

// Get messages for a specific conversation
app.get('/api/messages/:otherUserId', authenticateToken, async (req, res) => {
  const otherUserId = parseInt(req.params.otherUserId);
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { receiverId, content } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId: parseInt(receiverId)
      }
    });

    // Emit via socket.io for real-time
    io.to(`user_${receiverId}`).emit('new_message', message);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- WISHLIST SYSTEM ---
app.get('/api/wishlist', authenticateToken, async (req, res) => {
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

app.post('/api/wishlist/toggle', authenticateToken, async (req, res) => {
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

// --- MAINTENANCE SYSTEM ---
app.post('/api/maintenance', authenticateToken, async (req, res) => {
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

app.get('/api/maintenance', authenticateToken, async (req, res) => {
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

app.put('/api/maintenance/:id', authenticateToken, async (req, res) => {
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
    res.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update maintenance ticket' });
  }
});

// --- FINANCIAL & RENT SPLITTING ---

// Create an expense and split it
app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { title, description, amount, category, splitWith } = req.body; // splitWith is an array of { userId, amount }
  try {
    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category,
        payerId: req.user.id,
        splits: {
          create: (splitWith || []).map(s => ({
            userId: s.userId,
            amount: parseFloat(s.amount),
            status: 'UNPAID'
          }))
        }
      },
      include: { splits: true }
    });
    res.json({ success: true, expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get user's financial dashboard
app.get('/api/financial-summary', authenticateToken, async (req, res) => {
  try {
    // 1. Money I owe
    const moneyIOwe = await prisma.expenseSplit.findMany({
      where: { userId: req.user.id, status: 'UNPAID' },
      include: { expense: { include: { payer: true } } }
    });

    // 2. Money owed to me
    const moneyOwedToMe = await prisma.expense.findMany({
      where: { payerId: req.user.id },
      include: { splits: { where: { status: 'UNPAID' }, include: { user: true } } }
    });

    // 3. Recent Payments
    const recentPayments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      moneyIOwe,
      moneyOwedToMe,
      recentPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// Settle a split
app.patch('/api/splits/:id/settle', authenticateToken, async (req, res) => {
  const { provider, reference } = req.body;
  try {
    const split = await prisma.expenseSplit.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { expense: true }
    });

    if (!split || split.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to settle this split' });
    }

    // Update split status
    await prisma.expenseSplit.update({
      where: { id: split.id },
      data: { status: 'PAID' }
    });

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        amount: split.amount,
        status: 'COMPLETED',
        type: 'UTILITY',
        provider,
        reference,
        userId: req.user.id
      }
    });

    res.json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to settle split' });
  }
});

// --- USER INFO ---
app.get('/api/user/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, role: true, email: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
