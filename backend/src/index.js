// src/index.js

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase } from './lib/db.js';
import authRoutes from './routes/auth.js';
import slotRoutes from './routes/slots.js';
import bookingRoutes from './routes/bookings.js';
import './services/slotCleanupService.js';

// -----------------------
// Safe dotenv config
// -----------------------
dotenv.config({ override: false, debug: false });

// -----------------------
// App init
// -----------------------
const app = express();
const __dirname = path.resolve();

// -----------------------
// Middleware
// -----------------------
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());
app.use(morgan('dev'));

// -----------------------
// API Routes
// -----------------------
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// -----------------------
// Serve React frontend in production
// -----------------------
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');

  // Serve static files
  app.use(express.static(frontendPath));

  // Catch-all for React routes (safe)
  app.get('/*', (req, res) => {
    try {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } catch (err) {
      console.error('React catch-all failed', err);
      res.status(500).send('Server Error');
    }
  });
}

// -----------------------
// 404 for unknown API routes
// -----------------------
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectToDatabase();
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Server failed to start', err);
    process.exit(1);
  }
}

start();
