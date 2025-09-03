dotenv.config();

const app = express();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/db.js';
import authRoutes from './routes/auth.js';
import slotRoutes from './routes/slots.js';
import bookingRoutes from './routes/bookings.js';
import './services/slotCleanupService.js'; // Import cleanup service



app.use(cors({
  origin: '*', // frontend ka port
  methods: ['GET','POST','PUT','DELETE'],
//  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});


