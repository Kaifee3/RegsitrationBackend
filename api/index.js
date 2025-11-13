require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import models with absolute paths
const University = require(path.join(__dirname, '../models/University'));
const Lead = require(path.join(__dirname, '../models/Lead'));

const MONGO = process.env.MONGO_URI;

if (!MONGO) {
  console.error('MONGO_URI environment variable is required');
}

// MongoDB connection with caching
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
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

// Handler functions
function handleRoot(req, res) {
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
}

function handleHealth(req, res) {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
}

async function handleGetUniversities(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = url.searchParams.get('page') || 1;
    const limit = url.searchParams.get('limit') || 10;
    const search = url.searchParams.get('search');
    
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
}

async function handleGetUniversity(req, res, id) {
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid university ID' });
    }
    
    const uni = await University.findById(id).lean();
    if (!uni) {
      return res.status(404).json({ success: false, error: 'University not found' });
    }
    res.json({ success: true, data: uni });
  } catch (err) {
    console.error('Error fetching university:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch university details' });
  }
}

async function handleCreateLead(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { fullName, email, phone, state, courseInterested, intakeYear, consent, pipedreamUrl } = JSON.parse(body);

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
          const https = require('https');
          const postData = JSON.stringify({
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            state: lead.state,
            courseInterested: lead.courseInterested,
            intakeYear: lead.intakeYear,
            consent: lead.consent,
            createdAt: lead.createdAt
          });

          try {
            // Simple webhook call without axios dependency
            const url = new URL(pipedreamUrl);
            const options = {
              hostname: url.hostname,
              port: url.port || (url.protocol === 'https:' ? 443 : 80),
              path: url.pathname + url.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              },
              timeout: 5000
            };

            const reqWebhook = https.request(options);
            reqWebhook.write(postData);
            reqWebhook.end();
          } catch (err) {
            console.warn('Pipedream forward failed:', err.message);
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
      } catch (parseErr) {
        console.error('Error parsing request body:', parseErr);
        res.status(400).json({ success: false, error: 'Invalid JSON in request body' });
      }
    });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ success: false, error: 'Failed to submit lead' });
  }
}



// Vercel serverless function export
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Initialize database connection
    await connectToDatabase();
    
    // Handle routing based on URL
    const { url, method } = req;
    
    if (url === '/' && method === 'GET') {
      return handleRoot(req, res);
    }
    
    if (url === '/api/health' && method === 'GET') {
      return handleHealth(req, res);
    }
    
    if (url.startsWith('/api/universities') && method === 'GET') {
      if (url === '/api/universities' || url.startsWith('/api/universities?')) {
        return handleGetUniversities(req, res);
      } else {
        // Extract ID from /api/universities/:id
        const urlParts = url.split('/api/universities/');
        if (urlParts.length > 1) {
          const id = urlParts[1].split('?')[0]; // Remove query params from ID
          if (id && !id.includes('/')) {
            return handleGetUniversity(req, res, id);
          }
        }
      }
    }
    
    if (url === '/api/leads' && method === 'POST') {
      return handleCreateLead(req, res);
    }
    
    // 404 handler
    res.status(404).json({ 
      success: false, 
      error: 'Route not found',
      message: `Cannot ${method} ${url}` 
    });
    
  } catch (err) {
    console.error('Global error handler:', err);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
  }
};