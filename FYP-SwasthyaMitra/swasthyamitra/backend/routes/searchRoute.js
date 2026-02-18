import express from 'express';
import doctorModel from '../models/doctorModel.js';
import hospitalModel from '../models/hospitalModel.js';

const router = express.Router();

/**
 * Search doctors and hospitals from database only
 * GET /api/search?q=...
 * Returns: doctors and hospitals matching the query
 */
router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const qTrim = String(q).trim();

    console.log('Search query received:', qTrim);

    if (!qTrim) {
      return res.json({
        success: true,
        doctors: [],
        hospitals: [],
      });
    }

    const doctors = [];
    const hospitals = [];

    // Search doctors in database (name, speciality, address)
    try {
      const term = qTrim.replace(/\s+/g, ' ').trim();
      // Create regex that matches anywhere in the string (case-insensitive)
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const doctorResults = await doctorModel
        .find({
          $or: [
            { name: { $regex: regex } },
            { speciality: { $regex: regex } },
            { 'address.line1': { $regex: regex } },
            { 'address.line2': { $regex: regex } },
          ],
        })
        .select(['-password', '-email'])
        .populate('hospitals', 'name type address phone email image')
        .limit(10)
        .lean();

      for (const d of doctorResults || []) {
        doctors.push({
          _id: d._id.toString(),
          name: d.name || '',
          speciality: d.speciality || '',
          image: d.image || '',
          fees: d.fees,
          address: d.address || {},
          available: !!d.available,
          degree: d.degree,
          experience: d.experience,
          hospitals: d.hospitals || [],
        });
      }
      console.log(`Found ${doctors.length} doctors for query: ${qTrim}`);
    } catch (dbErr) {
      console.error('Doctor search error:', dbErr);
    }

    // Search hospitals in database (name, type, address)
    try {
      const term = qTrim.replace(/\s+/g, ' ').trim();
      // Create regex that matches anywhere in the string (case-insensitive)
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const hospitalResults = await hospitalModel
        .find({
          $or: [
            { name: { $regex: regex } },
            { type: { $regex: regex } },
            { 'address.line1': { $regex: regex } },
            { 'address.line2': { $regex: regex } },
            { description: { $regex: regex } },
          ],
          isActive: true,
        })
        .limit(10)
        .lean();

      for (const h of hospitalResults || []) {
        hospitals.push({
          _id: h._id.toString(),
          name: h.name || '',
          type: h.type || '',
          image: h.image || '',
          address: h.address || {},
          phone: h.phone || '',
          email: h.email || '',
          description: h.description || '',
          isActive: h.isActive,
        });
      }
      console.log(`Found ${hospitals.length} hospitals for query: ${qTrim}`);
    } catch (dbErr) {
      console.error('Hospital search error:', dbErr);
    }

    console.log(`Returning ${doctors.length} doctors and ${hospitals.length} hospitals`);
    res.json({
      success: true,
      doctors,
      hospitals,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Search failed',
      doctors: [],
      hospitals: [],
    });
  }
});

// Test endpoint to check if search route is working
router.get('/test', async (req, res) => {
  try {
    const doctorCount = await doctorModel.countDocuments();
    const hospitalCount = await hospitalModel.countDocuments();
    
    res.json({
      success: true,
      message: 'Search route is working',
      doctorCount,
      hospitalCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
