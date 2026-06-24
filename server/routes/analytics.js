const express = require('express');
const router = express.Router();
const { prisma } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// GET /api/host/forecast - Retrieve occupancy & dynamic pricing forecast
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HOST') {
      return res.status(403).json({ error: 'Access denied. Hosts only.' });
    }

    // Fetch host's properties to make recommendations relevant
    const rooms = await prisma.room.findMany({
      where: { hostId: req.user.id }
    });

    const averageBasePrice = rooms.length > 0
      ? rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length
      : 5000;

    // Simulate 6 months of historical & future forecasting data
    // College season peaks: July (admissions begin), August (reopening), September (settled), October (stable)
    // November/December (exams - slight dips)
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const baseOccupancy = [85, 95, 98, 90, 80, 75];
    const demandMultiplier = [1.15, 1.25, 1.10, 1.0, 0.95, 0.90];

    const forecast = months.map((month, idx) => {
      const predictedOccupancy = baseOccupancy[idx];
      const actualOccupancy = idx < 2 ? predictedOccupancy - Math.floor(Math.random() * 5) : null;
      
      const recommendedPrice = Math.round(averageBasePrice * demandMultiplier[idx]);
      const potentialRevenue = Math.round((rooms.length * recommendedPrice) * (predictedOccupancy / 100));

      return {
        month,
        predictedOccupancy,
        actualOccupancy,
        recommendedPrice,
        potentialRevenue,
        demandLevel: demandMultiplier[idx] > 1.1 ? 'HIGH' : demandMultiplier[idx] < 0.95 ? 'LOW' : 'NORMAL'
      };
    });

    res.json({
      averageCurrentPrice: Math.round(averageBasePrice),
      totalProperties: rooms.length,
      forecast
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate occupancy forecast' });
  }
});

module.exports = router;
