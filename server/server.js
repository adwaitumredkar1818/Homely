require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'homely_secret_key_2026';

app.use(cors());
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

// --- PROFILE ROUTE ---

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        bookings: { include: { room: { include: { images: true } } } },
        messBookings: { include: { mess: { include: { images: true } } } },
        rooms: { include: { images: true } },
        messes: { include: { images: true, reviews: { include: { user: true } } } }
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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

// Base Route
app.get('/', (req, res) => {
  res.send('Homely API Server is running');
});

// Rooms Routes
app.get('/api/rooms', async (req, res) => {
  const { search, maxPrice, minRating, minReviews, amenities } = req.query;

  try {
    let dbRooms = await prisma.room.findMany({ 
        include: { images: true } 
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
              reviews: reviews
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
          nearbyMesses: true
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
        hostId: dbRoom.hostId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Book Room Route
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { roomId, price } = req.body;
  try {
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
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Create Room Route
app.post('/api/rooms', authenticateToken, async (req, res) => {
  const { title, description, price, location, amenities, messes, lat, lng } = req.body;
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
    
    await prisma.image.create({
      data: {
        url: '', // Empty URL triggers local fallback
        roomId: dbRoom.id
      }
    });

    res.json({ success: true, room: dbRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post new room' });
  }
});

// --- MESS ROUTES ---

// Get all messes with optional search
app.get('/api/messes', async (req, res) => {
  const { search, type } = req.query;
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

    const mappedMesses = messes.map(m => {
      const reviewCount = m.reviews.length;
      const rating = reviewCount > 0 
        ? m.reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviewCount
        : 4.0 + ((m.id * 13) % 11) / 10; // Mock fallback
      
      return {
        ...m,
        image: m.images?.[0]?.url || null,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount || (5 + (m.id * 7) % 50)
      };
    });

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
  const { name, description, price, location, type, lat, lng, image } = req.body;
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

    // Create shadow image placeholder for local fallback
    await prisma.messImage.create({
      data: { url: '', messId: mess.id }
    });

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
