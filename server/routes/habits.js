const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const Completion = require('../models/Completion');

// GET all habits (array)
router.get('/', async (req, res) => {
  const habits = await Habit.find({}).sort({ createdAt: 1 }).lean();
  res.json(habits);
});

// POST create habit
router.post('/', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.id || !payload.name) return res.status(400).json({ error: 'id and name required' });
  try {
    const h = await Habit.create(payload);
    // ensure a completion doc exists for this habit
    await Completion.updateOne({ habitId: payload.id }, { $setOnInsert: { dates: [] } }, { upsert: true });
    res.status(201).json(h);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one habit
router.get('/:id', async (req, res) => {
  const h = await Habit.findOne({ id: req.params.id }).lean();
  if (!h) return res.status(404).json({ error: 'Not found' });
  res.json(h);
});

// PUT update habit
router.put('/:id', async (req, res) => {
  const updated = req.body;
  try {
    const h = await Habit.findOneAndUpdate({ id: req.params.id }, updated, { new: true, runValidators: true });
    if (!h) return res.status(404).json({ error: 'Not found' });
    res.json(h);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
  try {
    await Habit.deleteOne({ id: req.params.id });
    await Completion.deleteOne({ habitId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT replace full habits array (used by setValue when frontend sets full array)
router.put('/', async (req, res) => {
  const newArray = req.body;
  if (!Array.isArray(newArray)) return res.status(400).json({ error: 'Expecting array' });
  try {
    // Strategy: upsert provided habits, remove habits not present
    const incomingIds = newArray.map(h => h.id);
    // Upsert each
    for (const h of newArray) {
      await Habit.updateOne({ id: h.id }, { $set: h }, { upsert: true });
      await Completion.updateOne({ habitId: h.id }, { $setOnInsert: { dates: [] } }, { upsert: true });
    }
    // Delete habits that are no longer present
    await Habit.deleteMany({ id: { $nin: incomingIds } });
    await Completion.deleteMany({ habitId: { $nin: incomingIds } });
    const habits = await Habit.find({}).lean();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle completion for date for a habit { date: 'YYYY-MM-DD' }
router.post('/:id/toggle-completion', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  const habitId = req.params.id;
  try {
    const c = await Completion.findOne({ habitId });
    if (!c) {
      const created = await Completion.create({ habitId, dates: [date] });
      return res.json(created);
    }
    const exists = c.dates.includes(date);
    if (exists) {
      c.dates = c.dates.filter(d => d !== date);
    } else {
      c.dates.push(date);
    }
    await c.save();
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
