// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./db'); // see server/db.js below
const habitsRouter = require('./routes/habits');
const completionsRouter = require('./routes/completions');
const importExportRouter = require('./routes/importExport');

const app = express();

// Middlewares
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

// Routes
app.use('/api/habits', habitsRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/data', importExportRouter);

// Health route
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Export app for tests / serverless adapters
module.exports = app;

// Only start the server if this file is the entrypoint
if (require.main === module) {
  const PORT = process.env.PORT || 4000;

  (async () => {
    try {
      if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set in environment');
        process.exit(1);
      }
      await connectDB();
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}
