require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now to debug
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const University = require('../models/University');
const Lead = require('../models/Lead');

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    data: [
      {
        _id: '69162423193b92928b7978e0',
        name: 'Indian Institute of Technology Delhi',
        shortName: 'IIT Delhi',
        city: 'New Delhi',
        overview: 'IIT Delhi is one of the premier engineering institutions in India, known for its excellence in teaching and research.',
        courses: [
          {
            name: 'B.Tech Computer Science',
            duration: '4 years',
            feeRange: { min: 800000, max: 1000000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Artificial Intelligence',
            duration: '2 years',
            feeRange: { min: 400000, max: 500000, currency: 'INR' },
            intakeMonths: ['July']
          },
          {
            name: 'MBA',
            duration: '2 years',
            feeRange: { min: 1200000, max: 1500000, currency: 'INR' },
            intakeMonths: ['June']
          }
        ],
        placements: {
          avgPackage: '₹18 LPA',
          topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs'],
          placementRate: '95%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Research Labs', 'Cafeteria'],
        contact: {
          phone: '+91-11-2659-1999',
          email: 'info@iitd.ac.in'
        }
      },
      {
        _id: '69162423193b92928b7978e4',
        name: 'Lovely Professional University',
        shortName: 'LPU',
        city: 'Jalandhar,Punjab',
        overview: 'LPU is a constituent institute of Higher Education, offering quality education in engineering and technology.',
        courses: [
          {
            name: 'B.Tech Information Technology',
            duration: '4 years',
            feeRange: { min: 1400000, max: 1800000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'B.Tech Mechanical Engineering',
            duration: '4 years',
            feeRange: { min: 1500000, max: 1700000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Data Science',
            duration: '2 years',
            feeRange: { min: 600000, max: 800000, currency: 'INR' },
            intakeMonths: ['July', 'January']
          }
        ],
        placements: {
          avgPackage: '₹7.5 LPA',
          topRecruiters: ['Infosys', 'TCS', 'Wipro', 'Cognizant'],
          placementRate: '88%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Medical Facilities', 'Student Center'],
        contact: {
          phone: '+91-820-292-3000',
          email: 'admissions@manipal.edu'
        }
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    mongoConfigured: !!process.env.MONGO_URI,
    mongoPrefix: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'Not configured'
  });
});

app.get('/api/debug', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    let universityCount = 0;
    let sampleUniversity = null;
    
    if (dbState === 1) {
      universityCount = await University.countDocuments();
      sampleUniversity = await University.findOne().lean();
    }
    
    res.json({
      success: true,
      database: {
        state: stateNames[dbState] || 'unknown',
        stateCode: dbState,
        connected: dbState === 1
      },
      collections: {
        universityCount,
        sampleUniversity: sampleUniversity ? {
          id: sampleUniversity._id,
          name: sampleUniversity.name,
          shortName: sampleUniversity.shortName
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      database: {
        state: 'error',
        connected: false
      }
    });
  }
});

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
    
    // Complete fallback data with all details
    const fallbackData = [
      {
        _id: '69162423193b92928b7978e0',
        name: 'Indian Institute of Technology Delhi',
        shortName: 'IIT Delhi',
        city: 'New Delhi',
        overview: 'IIT Delhi is one of the premier engineering institutions in India, known for its excellence in teaching and research.',
        courses: [
          {
            name: 'B.Tech Computer Science',
            duration: '4 years',
            feeRange: { min: 800000, max: 1000000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Artificial Intelligence',
            duration: '2 years',
            feeRange: { min: 400000, max: 500000, currency: 'INR' },
            intakeMonths: ['July']
          },
          {
            name: 'MBA',
            duration: '2 years',
            feeRange: { min: 1200000, max: 1500000, currency: 'INR' },
            intakeMonths: ['June']
          }
        ],
        placements: {
          avgPackage: '₹18 LPA',
          topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs'],
          placementRate: '95%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Research Labs', 'Cafeteria'],
        contact: {
          phone: '+91-11-2659-1999',
          email: 'info@iitd.ac.in'
        }
      },
      {
        _id: '69162423193b92928b7978e4',
        name: 'Lovely Professional University',
        shortName: 'LPU',
        city: 'Jalandhar,Punjab',
        overview: 'LPU is a constituent institute of Higher Education, offering quality education in engineering and technology.',
        courses: [
          {
            name: 'B.Tech Information Technology',
            duration: '4 years',
            feeRange: { min: 1400000, max: 1800000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'B.Tech Mechanical Engineering',
            duration: '4 years',
            feeRange: { min: 1500000, max: 1700000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Data Science',
            duration: '2 years',
            feeRange: { min: 600000, max: 800000, currency: 'INR' },
            intakeMonths: ['July', 'January']
          }
        ],
        placements: {
          avgPackage: '₹7.5 LPA',
          topRecruiters: ['Infosys', 'TCS', 'Wipro', 'Cognizant'],
          placementRate: '88%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Medical Facilities', 'Student Center'],
        contact: {
          phone: '+91-820-292-3000',
          email: 'admissions@manipal.edu'
        }
      }
    ];
    
    try {
      // Try to connect to database and fetch data
      if (mongoose.connection.readyState !== 1) {
        console.log('Database not connected, using fallback data');
        return res.json({ 
          success: true, 
          data: fallbackData,
          source: 'fallback',
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: fallbackData.length,
            pages: 1
          }
        });
      }
      
      const query = search ? { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { shortName: { $regex: search, $options: 'i' } }
        ]
      } : {};
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Fetch ALL fields from the university, not just selected ones
      const unis = await University.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await University.countDocuments(query);
      
      console.log(`Found ${unis.length} universities from database, total: ${total}`);
      
      res.json({ 
        success: true, 
        data: unis.length > 0 ? unis : fallbackData,
        source: unis.length > 0 ? 'database' : 'fallback',
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: unis.length > 0 ? total : fallbackData.length,
          pages: unis.length > 0 ? Math.ceil(total / parseInt(limit)) : 1
        }
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return fallback data if database query fails
      res.json({ 
        success: true, 
        data: fallbackData,
        source: 'fallback',
        error: 'Database unavailable',
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackData.length,
          pages: 1
        }
      });
    }
  } catch (err) {
    console.error('Universities API Error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch universities',
      details: err.message
    });
  }
});

app.get('/api/universities/:id', async (req, res) => {
  try {
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid university ID' });
    }
    
    // Fallback data for individual universities
    const fallbackUniversities = {
      '69162423193b92928b7978e0': {
        _id: '69162423193b92928b7978e0',
        name: 'Indian Institute of Technology Delhi',
        shortName: 'IIT Delhi',
        city: 'New Delhi',
        overview: 'IIT Delhi is one of the premier engineering institutions in India, known for its excellence in teaching and research.',
        courses: [
          {
            name: 'B.Tech Computer Science',
            duration: '4 years',
            feeRange: { min: 800000, max: 1000000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Artificial Intelligence',
            duration: '2 years',
            feeRange: { min: 400000, max: 500000, currency: 'INR' },
            intakeMonths: ['July']
          },
          {
            name: 'MBA',
            duration: '2 years',
            feeRange: { min: 1200000, max: 1500000, currency: 'INR' },
            intakeMonths: ['June']
          }
        ],
        placements: {
          avgPackage: '₹18 LPA',
          topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs'],
          placementRate: '95%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Research Labs', 'Cafeteria'],
        contact: {
          phone: '+91-11-2659-1999',
          email: 'info@iitd.ac.in'
        }
      },
      '69162423193b92928b7978e4': {
        _id: '69162423193b92928b7978e4',
        name: 'Lovely Professional University',
        shortName: 'LPU',
        city: 'Jalandhar,Punjab',
        overview: 'LPU is a constituent institute of Higher Education, offering quality education in engineering and technology.',
        courses: [
          {
            name: 'B.Tech Information Technology',
            duration: '4 years',
            feeRange: { min: 1400000, max: 1800000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'B.Tech Mechanical Engineering',
            duration: '4 years',
            feeRange: { min: 1500000, max: 1700000, currency: 'INR' },
            intakeMonths: ['August']
          },
          {
            name: 'M.Tech Data Science',
            duration: '2 years',
            feeRange: { min: 600000, max: 800000, currency: 'INR' },
            intakeMonths: ['July', 'January']
          }
        ],
        placements: {
          avgPackage: '₹7.5 LPA',
          topRecruiters: ['Infosys', 'TCS', 'Wipro', 'Cognizant'],
          placementRate: '88%'
        },
        facilities: ['Library', 'Hostel', 'Sports Complex', 'Medical Facilities', 'Student Center'],
        contact: {
          phone: '+91-820-292-3000',
          email: 'admissions@manipal.edu'
        }
      }
    };

    try {
      // Try database first
      if (mongoose.connection.readyState === 1) {
        const uni = await University.findById(req.params.id).lean();
        if (uni) {
          return res.json({ success: true, data: uni, source: 'database' });
        }
      }
      
      // Use fallback data if database fails or university not found in DB
      const fallbackUni = fallbackUniversities[req.params.id];
      if (fallbackUni) {
        return res.json({ success: true, data: fallbackUni, source: 'fallback' });
      }
      
      // If ID not found in fallback either
      return res.status(404).json({ 
        success: false, 
        error: 'University not found',
        availableIds: Object.keys(fallbackUniversities)
      });
      
    } catch (err) {
      console.error('University details error:', err);
      
      // Try fallback even if database query fails
      const fallbackUni = fallbackUniversities[req.params.id];
      if (fallbackUni) {
        return res.json({ success: true, data: fallbackUni, source: 'fallback' });
      }
      
      res.status(500).json({ success: false, error: 'Failed to fetch university details' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch university details' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { fullName, email, phone, state, courseInterested, intakeYear, consent, pipedreamUrl } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !courseInterested || !intakeYear) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: fullName, email, phone, courseInterested, intakeYear' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits' });
    }

    // Prepare lead data
    const leadData = { 
      fullName: fullName.trim(), 
      email: email.toLowerCase().trim(), 
      phone, 
      state: state?.trim() || '', 
      courseInterested: courseInterested.trim(), 
      intakeYear, 
      consent: !!consent,
      createdAt: new Date()
    };

    let savedLead = null;
    let leadSource = 'fallback';
    let connectionStatus = 'not_attempted';

    // Attempt to connect to database
    console.log('Attempting to connect to database for lead submission...');
    const dbConnected = await connectToDatabase();
    
    if (dbConnected) {
      connectionStatus = 'connected';
      try {
        console.log('Database connected, saving lead...');
        
        // Check for existing lead
        const existingLead = await Lead.findOne({ 
          $or: [{ email: leadData.email }, { phone: leadData.phone }] 
        });
        
        if (existingLead) {
          return res.status(409).json({ 
            success: false, 
            error: 'Lead with this email or phone already exists' 
          });
        }

        const lead = new Lead(leadData);
        savedLead = await lead.save();
        leadSource = 'database';
        
        console.log('Lead successfully saved to database:', savedLead._id);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        connectionStatus = 'save_failed';
        // If database save fails, create mock saved lead
        savedLead = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...leadData
        };
        leadSource = 'fallback_db_error';
      }
    } else {
      console.log('Database connection failed, using fallback storage');
      connectionStatus = 'connection_failed';
      // Database not connected, simulate save
      savedLead = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...leadData
      };
      leadSource = 'fallback_no_connection';
    }

    // Send to Pipedream webhook if provided
    if (pipedreamUrl) {
      try {
        const axios = require('axios');
        await axios.post(pipedreamUrl, {
          ...leadData,
          id: savedLead._id,
          source: leadSource,
          connectionStatus: connectionStatus
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Lead sent to Pipedream successfully');
      } catch (webhookError) {
        console.error('Pipedream webhook failed:', webhookError.message);
        // Don't fail the request if webhook fails
      }
    }

    // Return success response
    res.status(201).json({ 
      success: true, 
      data: { 
        id: savedLead._id,
        fullName: savedLead.fullName,
        email: savedLead.email,
        phone: savedLead.phone,
        state: savedLead.state,
        courseInterested: savedLead.courseInterested,
        intakeYear: savedLead.intakeYear,
        consent: savedLead.consent,
        createdAt: savedLead.createdAt
      },
      source: leadSource,
      connectionStatus: connectionStatus,
      message: leadSource === 'database' ? 'Lead saved to database successfully' : 'Lead submitted (database unavailable, using fallback)'
    });

  } catch (err) {
    console.error('Lead submission error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit lead',
      details: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}` 
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URI;

console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI_EXISTS: !!process.env.MONGO_URI,
  MONGO_URI_PREFIX: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'NOT SET'
});

if (!MONGO) {
  console.error('MONGO_URI environment variable is not set!');
  if (process.env.NODE_ENV === 'production') {
    console.error('Please add MONGO_URI to your Vercel environment variables');
  }
}

// Database connection for serverless
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (!MONGO) {
    console.error('Cannot connect: MONGO_URI not provided');
    return false;
  }

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.error('Max connection attempts reached');
    return false;
  }

  try {
    connectionAttempts++;
    console.log(`Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000, // Increased timeout
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        family: 4 // Use IPv4, skip trying IPv6
      });
    }
    
    isConnected = true;
    connectionAttempts = 0; // Reset on successful connection
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error(`Database connection error (attempt ${connectionAttempts}):`, error.message);
    isConnected = false;
    return false;
  }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  // Skip database connection for routes that don't need it or handle it manually
  if (req.path === '/api/health' || 
      req.path === '/api/test' || 
      req.path === '/' || 
      req.path === '/api/debug' ||
      req.path === '/api/leads') {
    return next();
  }
  
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
