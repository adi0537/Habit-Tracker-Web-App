const express = require('express');
const router = express.Router();
const Completion = require('../models/Completion');

/**
 * completions resource:
 * GET /api/completions -> returns mapping { [habitId]: [dates...] }
 * PUT /api/completions -> replace full mapping (body must be object)
 * GET /api/completions/:habitId -> single
 * PUT /api/completions/:habitId -> replace dates array for habit
 */

router.get('/', async (req, res) => {
  const docs = await Completion.find({}).lean();
  const map = {};
  docs.forEach(d => { map[d.habitId] = d.dates || []; });
  res.json(map);
});

router.put('/', async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ error: 'Expecting object mapping' });
  }

  try {
    const incomingIds = Object.keys(payload);
    // Upsert each
    for (const id of incomingIds) {
      const dates = Array.isArray(payload[id]) ? payload[id] : [];
      await Completion.updateOne({ habitId: id }, { $set: { dates } }, { upsert: true });
    }
    // Delete completions for removed habits
    await Completion.deleteMany({ habitId: { $nin: incomingIds } });
    const docs = await Completion.find({}).lean();
    const map = {};
    docs.forEach(d => { map[d.habitId] = d.dates || []; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:habitId', async (req, res) => {
  const doc = await Completion.findOne({ habitId: req.params.habitId }).lean();
  if (!doc) return res.json([]);
  res.json(doc.dates || []);
});

router.put('/:habitId', async (req, res) => {
  const dates = Array.isArray(req.body) ? req.body : req.body.dates;
  if (!Array.isArray(dates)) return res.status(400).json({ error: 'Expecting dates array' });
  try {
    const updated = await Completion.findOneAndUpdate({ habitId: req.params.habitId }, { $set: { dates } }, { upsert: true, new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
