const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const Completion = require('../models/Completion');

/**
 * GET /api/data/export -> { habits: [...], completions: {...} }
 * POST /api/data/import -> body: { habits: [...], completions: {...} }  (replaces data)
 */

router.get('/export', async (req, res) => {
  const habits = await Habit.find({}).lean();
  const completionsDocs = await Completion.find({}).lean();
  const completions = {};
  completionsDocs.forEach(d => completions[d.habitId] = d.dates || []);
  res.json({ habits, completions, exportDate: new Date().toISOString(), version: '1.0' });
});

router.post('/import', async (req, res) => {
  const { habits, completions } = req.body || {};
  if (!Array.isArray(habits) || typeof completions !== 'object') {
    return res.status(400).json({ error: 'invalid format' });
  }
  try {
    // Replace habits
    await Habit.deleteMany({});
    if (habits.length) await Habit.insertMany(habits);

    // Replace completions
    await Completion.deleteMany({});
    const docs = Object.entries(completions || {}).map(([habitId, dates]) => ({ habitId, dates: Array.isArray(dates) ? dates : [] }));
    if (docs.length) await Completion.insertMany(docs);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
