require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const habitsRouter = require('./routes/habits');
const completionsRouter = require('./routes/completions');
const importExportRouter = require('./routes/importExport');

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use('/api/habits', habitsRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/data', importExportRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();