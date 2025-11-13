const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  name: String,
  duration: String,
  feeRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' }
  },
  intakeMonths: [String]
});

const UniSchema = new Schema({
  name: String,
  shortName: String,
  city: String,
  overview: String,
  courses: [CourseSchema],
  placements: {
    avgPackage: String,
    topRecruiters: [String],
    placementRate: String
  },
  facilities: [String],
  contact: {
    phone: String,
    email: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('University', UniSchema);
