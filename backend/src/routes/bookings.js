import express from 'express';
import { body, validationResult } from 'express-validator'; // For input validation
import mongoose from 'mongoose'; // For database operations and transactions
import { auth } from '../middleware/auth.js'; // Authentication middleware
import Slot from '../models/Slot.js'; // Slot model
import Booking from '../models/Booking.js'; // Booking model

const router = express.Router();

// Define the number of players allowed in each game mode
const GAME_MODE_PLAYERS = { singles: 2, doubles: 4 };

// ==============================
// Check availability endpoint
// ==============================
router.get('/check-availability/:slotId', auth(), async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await Slot.findById(slotId); // Find the slot by ID
    if (!slot) return res.status(404).json({ error: 'Slot not found' }); // If slot doesn't exist

    const now = new Date();
    if (slot.endTime <= now) return res.status(400).json({ error: 'Cannot book past slots' }); // Cannot book expired slots

    // Fetch all active bookings (not cancelled) for the slot
    const activeBookings = await Booking.find({ 
      slot: slotId, 
      cancelledAt: null 
    });

    // Calculate availability for each sub-court in the slot
    const availability = slot.subCourts.map(subCourt => {
      const bookingsForSubCourt = activeBookings.filter(
        booking => booking.subCourtIndex === subCourt.index
      );
      
      const totalPlayersBooked = bookingsForSubCourt.reduce(
        (sum, booking) => sum + booking.playersCount, 0
      );
      
      const availableSpaces = subCourt.capacity - totalPlayersBooked;
      
      return {
        subCourtIndex: subCourt.index,
        capacity: subCourt.capacity,
        courtType: subCourt.courtType,
        occupied: totalPlayersBooked,
        available: availableSpaces,
        canBookSingles: subCourt.courtType === 'singles' && availableSpaces >= 1,
        canBookDoubles: subCourt.courtType === 'doubles' && availableSpaces >= 1,
        bookings: bookingsForSubCourt.map(booking => ({
          gameMode: booking.gameMode,
          playersCount: booking.playersCount
        }))
      };
    });

    // Return slot and availability information
    return res.json({
      slotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      lockedGameMode: slot.lockedGameMode,
      availability
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({ error: 'Failed to check availability' });
  }
});

// ==============================
// Create a new booking endpoint
// ==============================
router.post(
  '/',
  auth(),
  [
    body('slotId').isMongoId(),
    body('subCourtIndex').isInt({ min: 0 }),
    body('gameMode').isIn(['singles', 'doubles'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); // Validate input

    const { slotId, subCourtIndex, gameMode } = req.body;
    const userId = req.user.id;

    // Start a MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Fetch the slot and sub-court
      const slot = await Slot.findById(slotId).session(session);
      if (!slot) throw new Error('Slot not found');

      const subCourt = slot.subCourts.find((s) => s.index === subCourtIndex);
      if (!subCourt) throw new Error('Invalid sub-court');

      const now = new Date();
      if (slot.endTime <= now) throw new Error('Cannot book past slots');

      // Ensure the game mode matches the court type
      if (subCourt.courtType !== gameMode) {
        throw new Error(`This court is for ${subCourt.courtType} games only`);
      }
      
      // Check if user already has a booking for this time slot on *any* sub-court
      const existing = await Booking.findOne({ 
        user: userId, 
        slot: slot._id,
        cancelledAt: null 
      }).session(session);
      if (existing) {
        throw new Error(`You already have a booking for this time slot on ${gameMode} court ${existing.subCourtIndex+1}.`);
      }

      // Check how many players are already booked
      const activeBookings = await Booking.find({ 
        slot: slotId, 
        subCourtIndex: subCourtIndex,
        cancelledAt: null 
      }).session(session);
      
      const totalPlayersBooked = activeBookings.reduce(
        (sum, booking) => sum + booking.playersCount, 0
      );
      
      if (totalPlayersBooked >= subCourt.capacity) {
        throw new Error(`Court is full. ${totalPlayersBooked}/${subCourt.capacity} players already booked`);
      }
<<<<<<< HEAD
      
      // Create the booking for 1 player (individual booking)
=======

      // Prevent user from booking the same court again
      const existing = await Booking.findOne({ 
        user: userId, 
        slot: slot._id, 
        subCourtIndex: subCourtIndex,
        cancelledAt: null 
      }).session(session);
      if (existing) throw new Error('Already booked this court');

      // Create the booking for 1 player
>>>>>>> 71d340dabd54d4e68882d293e64877fdb0d264a4
      const booking = await Booking.create([
        { user: userId, slot: slot._id, subCourtIndex, gameMode, playersCount: 1 },
      ], { session });

      await session.commitTransaction(); // Commit the transaction
      return res.status(201).json({ 
        id: booking[0]._id,
        message: 'Booking confirmed successfully!',
        booking: {
          gameMode,
          playersCount: 1,
          subCourtIndex,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      });
    } catch (e) {
      await session.abortTransaction(); // Rollback on error
      return res.status(400).json({ error: e.message });
    } finally {
      session.endSession(); // End the session
    }
  }
);

// ==============================
// Cancel booking endpoint
// ==============================
router.post(
  '/cancel',
  auth(),
  [body('bookingId').isMongoId()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { bookingId } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking || String(booking.user) !== String(userId)) throw new Error('Booking not found');
      if (booking.cancelledAt) throw new Error('Already cancelled');

      const slot = await Slot.findById(booking.slot).session(session);
      if (!slot) throw new Error('Slot not found');

      // Mark booking as cancelled
      booking.cancelledAt = new Date();
      await booking.save({ session });

      await session.commitTransaction();
      return res.json({ ok: true });
    } catch (e) {
      await session.abortTransaction();
      return res.status(400).json({ error: e.message });
    } finally {
      session.endSession();
    }
  }
);

// ==============================
// Get all bookings (admin only)
// ==============================
router.get('/all', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const bookings = await Booking.find({ cancelledAt: null })
      .populate('user', 'name email') // Add user details
      .populate('slot', 'startTime endTime') // Add slot details
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==============================
// Get user's own bookings
// ==============================
router.get('/my-bookings', auth(), async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user.id, 
      cancelledAt: null 
    })
      .populate('slot', 'startTime endTime')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==============================
// Admin cancel booking
// ==============================
router.post('/admin-cancel', auth(), [body('bookingId').isMongoId()], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.cancelledAt) return res.status(400).json({ error: 'Already cancelled' });

    booking.cancelledAt = new Date();
    await booking.save();

    return res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Admin cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
