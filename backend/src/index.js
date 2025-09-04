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

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Middleware
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  // Safe catch-all route for React
  app.get('/*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Fallback route for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Start server
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
