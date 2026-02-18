import express from 'express';
import OpenAI from 'openai';
import hospitalModel from '../models/hospitalModel.js';
import doctorModel from '../models/doctorModel.js';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.openaiapikey,
});

/**
 * POST /api/hospital/enrich
 * Uses OpenAI to generate a brief description of a hospital/health facility in Nepal.
 * Body: { name, province?, district?, address?, hospital_type? }
 */
router.post('/enrich', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.openaiapikey;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Add OPENAI_API_KEY or openaiapikey to .env',
      });
    }

    const { name, province, district, address, hospital_type } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Hospital name is required',
      });
    }

    const location = [province, district, address].filter(Boolean).join(', ');
    const prompt = `Write a brief 2-3 sentence description of "${name}"${location ? ` in ${location}, Nepal` : ' in Nepal'}. ${hospital_type ? `It is a ${hospital_type}.` : ''} Include typical services or general info about such health facilities in Nepal. Be concise and factual.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    const aiDescription = completion.choices?.[0]?.message?.content?.trim() || '';

    res.json({
      success: true,
      aiDescription,
    });
  } catch (err) {
    console.error('Hospital enrich error:', err);
    const message = err.message || 'Failed to generate description';
    const status = err.status === 401 ? 401 : 500;
    res.status(status).json({
      success: false,
      message,
      aiDescription: null,
    });
  }
});

/**
 * GET /api/hospital/:id
 * Get single hospital by ID with doctors available at that hospital
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hospital = await hospitalModel.findById(id).lean();
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    // Get doctors who work at this hospital
    const doctors = await doctorModel
      .find({ hospitals: id, available: true })
      .select(['-password', '-email'])
      .populate('hospitals', 'name type')
      .lean();

    res.json({
      success: true,
      hospital,
      doctors,
    });
  } catch (err) {
    console.error('Get hospital error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch hospital',
    });
  }
});

export default router;
