import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Slot from '../models/Slot.js';
import { auth } from '../middleware/auth.js';
import { checkSlotExists } from '../services/slotCleanupService.js';

const router = express.Router();

// Admin: create slots for a given start time list
router.post(
  '/',
  auth('admin'),
  [body('startTimes').isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { startTimes } = req.body;
    const validStartTimes = [];
    const duplicateTimes = [];

    // Check for duplicates
    for (const startTime of startTimes) {
      const exists = await checkSlotExists(startTime);
      if (exists) {
        duplicateTimes.push(new Date(startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
      } else {
        validStartTimes.push(startTime);
      }
    }

    if (validStartTimes.length === 0) {
      return res.status(400).json({ 
        error: 'All selected time slots already exist',
        duplicates: duplicateTimes
      });
    }

    try {
      const docs = validStartTimes.map((start) => Slot.createWithDefaults(start));
      const created = await Slot.insertMany(docs, { ordered: false });
      
      return res.status(201).json({ 
        count: created.length,
        created: validStartTimes.length,
        duplicates: duplicateTimes.length > 0 ? duplicateTimes : undefined
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create slots' });
    }
  }
);

// Fetch slots in a date range using a cursor for efficiency
router.get(
  '/list',
  [query('from').isISO8601(), query('to').isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { from, to } = req.query;
    const cursor = await Slot.find({ startTime: { $gte: new Date(from), $lt: new Date(to) } })
      .sort({ startTime: 1 })
      .cursor();

    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    for await (const slot of cursor) {
      const status = await slot.getStatus();
              const payload = {
          id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          lockedGameMode: slot.lockedGameMode,
          status: status,
          subCourts: slot.subCourts.map((s) => ({ 
            index: s.index, 
            capacity: s.capacity, 
            courtType: s.courtType,
            occupied: 0 
          })),
        };
      if (!first) res.write(',');
      res.write(JSON.stringify(payload));
      first = false;
    }
    res.write(']');
    res.end();
  }
);

export default router;


