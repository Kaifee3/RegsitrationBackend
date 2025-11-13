require('dotenv').config();
const mongoose = require('mongoose');
const University = require('./models/University');

const sampleUniversities = [
  {
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

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    await University.deleteMany({});
    console.log('Cleared existing universities');
    
    const inserted = await University.insertMany(sampleUniversities);
    console.log(`Inserted ${inserted.length} universities`);
    
    console.log('\nUniversity IDs (use these in your frontend):');
    inserted.forEach(uni => {
      console.log(`- ${uni.shortName}: ${uni._id}`);
    });
    
    mongoose.connection.close();
    console.log('\nSeeding completed!');
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
