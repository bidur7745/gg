import express from 'express';
import doctorModel from '../models/doctorModel.js';
import { searchWeb } from '../services/googleSearch.js';

const router = express.Router();

/**
 * Combined search: doctors from DB + web results from Google Custom Search.
 * GET /api/search?q=...
 * - Doctors: name, speciality, address (from your DB)
 * - Web: results from Google Custom Search API (shown in-app)
 */
router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const qTrim = String(q).trim();

    if (!qTrim) {
      return res.json({
        success: true,
        results: [],
        suggested: false,
      });
    }

    const results = [];

    // 1. Search doctors in your database (name, speciality, address)
    try {
      const term = qTrim.replace(/\s+/g, ' ').trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const doctors = await doctorModel
        .find({
          $or: [
            { name: regex },
            { speciality: regex },
            { 'address.line1': regex },
            { 'address.line2': regex },
          ],
        })
        .select(['-password', '-email'])
        .limit(10)
        .lean();

      for (const d of doctors || []) {
        results.push({
          type: 'doctor',
          id: d._id.toString(),
          _id: d._id.toString(),
          name: d.name || '',
          speciality: d.speciality || '',
          image: d.image || '',
          fees: d.fees,
          address: d.address || {},
          available: !!d.available,
          degree: d.degree,
          experience: d.experience,
        });
      }
    } catch (dbErr) {
      console.error('Doctor search error:', dbErr);
    }

    // 2. Web search from Google Custom Search API (results shown in-app)
    try {
      const gl = process.env.GOOGLE_GL || 'in';
      const hl = process.env.GOOGLE_HL || 'en';
      const { items: webItems } = await searchWeb(qTrim, { num: 10, gl, hl });
      for (const item of webItems || []) {
        results.push({
          type: 'web',
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink || '',
        });
      }
    } catch (webErr) {
      console.error('Web search error:', webErr);
    }

    res.json({
      success: true,
      results,
      suggested: false,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Search failed',
      results: [],
      suggested: false,
    });
  }
});

export default router;
