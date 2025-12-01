const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // preserves frontend id (Date.now().toString())
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  color: { type: String, default: '' },
  icon: { type: String, default: '' },
  frequencyPerDay: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);
