const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeadSchema = new Schema({
  fullName: String,
  email: String,
  phone: String,
  state: String,
  courseInterested: String,
  intakeYear: String,
  consent: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
