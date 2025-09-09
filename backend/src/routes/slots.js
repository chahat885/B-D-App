import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Slot from '../models/Slot.js';
import { auth } from '../middleware/auth.js';
import { checkSlotExists } from '../services/slotCleanupService.js';

const router = express.Router();

// Booking rules – not needed here but can be used if extended later
// const GAME_MODE_PLAYERS = { singles: 2, doubles: 4 };

// Admin endpoint: create slots by providing a list of start times
router.post(
  '/',
  auth('admin'), // Only admin can access this route
  [body('startTimes').isArray({ min: 1 })], // Validate input: it must be an array with at least one time
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { startTimes } = req.body;
    const validStartTimes = []; // Store new slots to be created
    const duplicateTimes = [];  // Store times that already exist

    // Check each start time if the slot already exists
    for (const startTime of startTimes) {
      const exists = await checkSlotExists(startTime); // Check if slot exists
      if (exists) {
        // If exists, format and store it as duplicate
        duplicateTimes.push(new Date(startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
      } else {
        validStartTimes.push(startTime); // Otherwise, mark it for creation
      }
    }

    // If all slots are duplicates, return an error response
    if (validStartTimes.length === 0) {
      return res.status(400).json({ 
        error: 'All selected time slots already exist',
        duplicates: duplicateTimes
      });
    }

    try {
      // Prepare slot documents for insertion using default settings
      const docs = validStartTimes.map((start) => Slot.createWithDefaults(start));

      // Insert all valid slots at once
      const created = await Slot.insertMany(docs, { ordered: false });

      // Send response with counts and duplicates info
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

// Public endpoint: fetch slots between two dates
router.get(
  '/list',
  [query('from').isISO8601(), query('to').isISO8601()], // Validate date format
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { from, to } = req.query;

    // Use a cursor to efficiently fetch slots within the date range
    const cursor = await Slot.find({ startTime: { $gte: new Date(from), $lt: new Date(to) } })
      .sort({ startTime: 1 })
      .cursor();

    res.setHeader('Content-Type', 'application/json');
    res.write('['); // Start of JSON array

    let first = true;
    // Iterate through each slot from the cursor
    for await (const slot of cursor) {
      const status = await slot.getStatus(); // Calculate the slot’s current status

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
          occupied: 0 // Placeholder, real occupancy can be fetched if needed
        })),
      };

      if (!first) res.write(','); // Add comma between objects
      res.write(JSON.stringify(payload)); // Write slot data as JSON
      first = false;
    }

    res.write(']'); // End of JSON array
    res.end(); // Finish response
  }
);

export default router;
