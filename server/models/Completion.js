const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  habitId: { type: String, required: true, index: true, unique: true },
  dates: { type: [String], default: [] } // array of 'YYYY-MM-DD' strings
}, { timestamps: true });

module.exports = mongoose.model('Completion', completionSchema);