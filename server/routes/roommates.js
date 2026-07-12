const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Get all active roommate listings with optional filtering
router.get('/', async (req, res) => {
  const { location, maxBudget, isVegetarian, isSmoking, studyPreference, socialPreference } = req.query;
  
  try {
    const whereClause = { isActive: true };

    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (maxBudget) {
      whereClause.budget = {
        lte: parseFloat(maxBudget)
      };
    }

    if (isVegetarian !== undefined && isVegetarian !== '') {
      whereClause.isVegetarian = isVegetarian === 'true';
    }

    if (isSmoking !== undefined && isSmoking !== '') {
      whereClause.isSmoking = isSmoking === 'true';
    }

    if (studyPreference) {
      whereClause.studyPreference = studyPreference;
    }

    if (socialPreference) {
      whereClause.socialPreference = socialPreference;
    }

    const listings = await prisma.roommateListing.findMany({
      where: whereClause,
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            college: true,
            cleanlinessLevel: true,
            studyPreference: true,
            socialPreference: true,
            isSmoking: true,
            isVegetarian: true,
            isVerified: true
          }
        },
        room: {
          include: {
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(listings);
  } catch (error) {
    console.error('Error fetching roommate listings:', error);
    res.status(500).json({ error: 'Failed to fetch roommate listings' });
  }
});

// Get a single listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.roommateListing.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            college: true,
            cleanlinessLevel: true,
            studyPreference: true,
            socialPreference: true,
            isSmoking: true,
            isVegetarian: true,
            isVerified: true
          }
        },
        room: {
          include: {
            images: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Error fetching roommate listing details:', error);
    res.status(500).json({ error: 'Failed to fetch roommate listing details' });
  }
});

// Create new roommate listing (requires confirmed booking)
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, budget, moveInDate, studyPreference, socialPreference, cleanlinessLevel, isSmoking, isVegetarian } = req.body;

  try {
    if (req.user.role !== 'TENANT') {
      return res.status(403).json({ error: 'Only tenants can post roommate listings' });
    }

    // Find active room booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        tenantId: req.user.id,
        status: 'CONFIRMED'
      },
      include: {
        room: true
      }
    });

    if (!activeBooking) {
      return res.status(400).json({ error: 'You must have an active confirmed room booking to post a roommate listing' });
    }

    // Check for existing active listing
    const existingListing = await prisma.roommateListing.findFirst({
      where: {
        posterId: req.user.id,
        isActive: true
      }
    });

    if (existingListing) {
      return res.status(400).json({ error: 'You already have an active roommate listing' });
    }

    const listing = await prisma.roommateListing.create({
      data: {
        title,
        description,
        budget: parseFloat(budget),
        location: activeBooking.room.location,
        moveInDate: new Date(moveInDate),
        studyPreference: studyPreference || null,
        socialPreference: socialPreference || null,
        cleanlinessLevel: cleanlinessLevel !== undefined ? parseInt(cleanlinessLevel) : 3,
        isSmoking: isSmoking === true,
        isVegetarian: isVegetarian === true,
        posterId: req.user.id,
        bookingId: activeBooking.id,
        roomId: activeBooking.roomId
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating roommate listing:', error);
    res.status(500).json({ error: 'Failed to create roommate listing' });
  }
});

// Edit listing
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, description, budget, moveInDate, studyPreference, socialPreference, cleanlinessLevel, isSmoking, isVegetarian, isActive } = req.body;

  try {
    const listingId = parseInt(req.params.id);
    const listing = await prisma.roommateListing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.posterId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this listing' });
    }

    const updated = await prisma.roommateListing.update({
      where: { id: listingId },
      data: {
        title,
        description,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        studyPreference,
        socialPreference,
        cleanlinessLevel: cleanlinessLevel !== undefined ? parseInt(cleanlinessLevel) : undefined,
        isSmoking: isSmoking !== undefined ? isSmoking === true : undefined,
        isVegetarian: isVegetarian !== undefined ? isVegetarian === true : undefined,
        isActive: isActive !== undefined ? isActive === true : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating roommate listing:', error);
    res.status(500).json({ error: 'Failed to update roommate listing' });
  }
});

// Delete listing
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const listing = await prisma.roommateListing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.posterId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await prisma.roommateListing.delete({
      where: { id: listingId }
    });

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting roommate listing:', error);
    res.status(500).json({ error: 'Failed to delete roommate listing' });
  }
});

module.exports = router;
