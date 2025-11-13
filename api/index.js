require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS configuration for production
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const University = require('../models/University');
const Lead = require('../models/Lead');

// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'University Registration API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      universities: '/api/universities',
      leads: '/api/leads'
    }
  });
});

app.get('/api/universities', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = search ? { 
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const unis = await University.find(query, 'name shortName city')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await University.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: unis,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching universities:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch universities' });
  }
});

app.get('/api/universities/:id', async (req, res) => {
  try {
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid university ID' });
    }
    
    const uni = await University.findById(req.params.id).lean();
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found' });
    }
    res.json({ success: true, data: uni });
  } catch (err) {
    console.error('Error fetching university:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch university details' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { fullName, email, phone, state, courseInterested, intakeYear, consent, pipedreamUrl } = req.body;

    // Enhanced validation
    if (!fullName || !email || !phone || !courseInterested || !intakeYear) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: fullName, email, phone, courseInterested, intakeYear' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits' });
    }

    // Check for duplicate lead
    const existingLead = await Lead.findOne({ email, phone });
    if (existingLead) {
      return res.status(409).json({ 
        success: false, 
        error: 'Lead with this email or phone already exists' 
      });
    }

    const lead = new Lead({ 
      fullName: fullName.trim(), 
      email: email.toLowerCase().trim(), 
      phone, 
      state: state?.trim(), 
      courseInterested: courseInterested.trim(), 
      intakeYear, 
      consent: !!consent 
    });
    
    await lead.save();

    // Forward to Pipedream webhook if provided
    if (pipedreamUrl) {
      const axios = require('axios');
      try {
        await axios.post(pipedreamUrl, {
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          state: lead.state,
          courseInterested: lead.courseInterested,
          intakeYear: lead.intakeYear,
          consent: lead.consent,
          createdAt: lead.createdAt
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.warn('Pipedream forward failed:', err.message);
        // Don't fail the request if webhook fails
      }
    }

    res.status(201).json({ 
      success: true, 
      data: { 
        id: lead._id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        state: lead.state,
        courseInterested: lead.courseInterested,
        intakeYear: lead.intakeYear,
        consent: lead.consent,
        createdAt: lead.createdAt
      },
      message: 'Lead submitted successfully' 
    });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ success: false, error: 'Failed to submit lead' });
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const MONGO = process.env.MONGO_URI;

if (!MONGO) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

// MongoDB connection with better error handling
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(MONGO, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    return connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

// Vercel serverless function export
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    app(req, res);
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
    });
  }
};