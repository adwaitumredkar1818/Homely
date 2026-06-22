const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Get current user's vibe quiz details
router.get('/vibe', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        college: true,
        studyPreference: true,
        socialPreference: true,
        cleanlinessLevel: true,
        isSmoking: true,
        isVegetarian: true,
        bio: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vibe profile' });
  }
});

// Update/Save user's vibe quiz details
router.post('/vibe', authenticateToken, async (req, res) => {
  const { college, studyPreference, socialPreference, cleanlinessLevel, isSmoking, isVegetarian, bio } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        college,
        studyPreference,
        socialPreference,
        cleanlinessLevel: parseInt(cleanlinessLevel) || 3,
        isSmoking: !!isSmoking,
        isVegetarian: !!isVegetarian,
        bio
      }
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save vibe profile' });
  }
});

// Discover potential roommates and calculate compatibility
router.get('/discover', authenticateToken, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Fetch other tenants who have filled out some vibe information
    const others = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        role: 'TENANT'
      }
    });

    // Calculate compatibility score (50% to 100%)
    const discovered = others.map(other => {
      let matchPoints = 0;
      let totalChecks = 0;

      // 1. College matching
      if (currentUser.college && other.college) {
        totalChecks++;
        if (currentUser.college.toLowerCase().trim() === other.college.toLowerCase().trim()) {
          matchPoints += 1;
        }
      }

      // 2. Study Prefs
      if (currentUser.studyPreference && other.studyPreference) {
        totalChecks++;
        if (currentUser.studyPreference === other.studyPreference) {
          matchPoints += 1;
        }
      }

      // 3. Social Prefs
      if (currentUser.socialPreference && other.socialPreference) {
        totalChecks++;
        if (currentUser.socialPreference === other.socialPreference) {
          matchPoints += 1;
        }
      }

      // 4. Cleanliness Level (scale 1-5, absolute difference)
      totalChecks++;
      const cleanDiff = Math.abs((currentUser.cleanlinessLevel || 3) - (other.cleanlinessLevel || 3));
      matchPoints += (4 - cleanDiff) / 4; // Max difference is 4, 0 diff = 1pt, 4 diff = 0pt

      // 5. Smoking alignment (preference for non-smoking)
      totalChecks++;
      if (currentUser.isSmoking === other.isSmoking) {
        matchPoints += 1;
      }

      // 6. Vegetarian alignment
      totalChecks++;
      if (currentUser.isVegetarian === other.isVegetarian) {
        matchPoints += 1;
      }

      const ratio = totalChecks > 0 ? (matchPoints / totalChecks) : 0.5;
      const score = Math.round(50 + ratio * 50); // Scale from 50 to 100%

      return {
        id: other.id,
        name: other.name,
        email: other.email,
        isVerified: other.isVerified,
        college: other.college,
        studyPreference: other.studyPreference,
        socialPreference: other.socialPreference,
        cleanlinessLevel: other.cleanlinessLevel,
        isSmoking: other.isSmoking,
        isVegetarian: other.isVegetarian,
        bio: other.bio,
        compatibility: score
      };
    });

    // Sort by compatibility descending
    discovered.sort((a, b) => b.compatibility - a.compatibility);

    res.json(discovered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to discover roommates' });
  }
});

// Get roommate requests (sent and received)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const receivedRaw = await prisma.roommateRequest.findMany({
      where: { receiverId: req.user.id }
    });

    const sentRaw = await prisma.roommateRequest.findMany({
      where: { senderId: req.user.id }
    });

    // Map sender/receiver user details
    const received = await Promise.all(receivedRaw.map(async r => {
      const sender = await prisma.user.findUnique({
        where: { id: r.senderId },
        select: { id: true, name: true, email: true, isVerified: true, college: true, studyPreference: true, socialPreference: true, cleanlinessLevel: true, bio: true }
      });
      return { ...r, sender };
    }));

    const sent = await Promise.all(sentRaw.map(async r => {
      const receiver = await prisma.user.findUnique({
        where: { id: r.receiverId },
        select: { id: true, name: true, email: true, isVerified: true, college: true, studyPreference: true, socialPreference: true, cleanlinessLevel: true, bio: true }
      });
      return { ...r, receiver };
    }));

    res.json({ received, sent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roommate requests' });
  }
});

// Send roommate connection request
router.post('/request', authenticateToken, async (req, res) => {
  const { receiverId } = req.body;
  try {
    if (parseInt(receiverId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    const existing = await prisma.roommateRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: parseInt(receiverId) },
          { senderId: parseInt(receiverId), receiverId: req.user.id }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Connection request already exists' });
    }

    const newRequest = await prisma.roommateRequest.create({
      data: {
        senderId: req.user.id,
        receiverId: parseInt(receiverId),
        status: 'PENDING'
      }
    });

    // Create in-app notification
    const sender = await prisma.user.findUnique({ where: { id: req.user.id } });
    await prisma.notification.create({
      data: {
        userId: parseInt(receiverId),
        type: 'MESSAGE',
        title: 'New Roommate Request',
        message: `${sender.name} sent you a compatibility connection request.`,
        link: '/profile'
      }
    });

    res.json({ success: true, request: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Respond to roommate connection request
router.put('/request/:id', authenticateToken, async (req, res) => {
  const { status } = req.body; // ACCEPTED or DECLINED
  try {
    const request = await prisma.roommateRequest.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiverId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.roommateRequest.update({
      where: { id: request.id },
      data: { status }
    });

    const receiver = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Notify sender
    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: 'MESSAGE',
        title: `Roommate Request ${status === 'ACCEPTED' ? 'Accepted' : 'Declined'}`,
        message: `${receiver.name} has ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your connection request.`,
        link: '/profile'
      }
    });

    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

module.exports = router;
