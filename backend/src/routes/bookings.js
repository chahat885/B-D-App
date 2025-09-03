import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Booking rules
// Singles -> 2 players per sub-court; Doubles -> 4 players per sub-court
const GAME_MODE_PLAYERS = { singles: 2, doubles: 4 };

// Check availability endpoint
router.get('/check-availability/:slotId', auth(), async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const now = new Date();
    if (slot.endTime <= now) return res.status(400).json({ error: 'Cannot book past slots' });

    // Get all active bookings for this slot
    const activeBookings = await Booking.find({ 
      slot: slotId, 
      cancelledAt: null 
    });

    // Calculate availability for each subcourt
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

router.post(
  '/',
  auth(),
  [body('slotId').isMongoId(), body('subCourtIndex').isInt({ min: 0 }), body('gameMode').isIn(['singles', 'doubles'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { slotId, subCourtIndex, gameMode } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const slot = await Slot.findById(slotId).session(session);
      if (!slot) throw new Error('Slot not found');

      const subCourt = slot.subCourts.find((s) => s.index === subCourtIndex);
      if (!subCourt) throw new Error('Invalid sub-court');

      const now = new Date();
      if (slot.endTime <= now) throw new Error('Cannot book past slots');

      // Check if game mode matches court type
      if (subCourt.courtType !== gameMode) {
        throw new Error(`This court is for ${subCourt.courtType} games only`);
      }

      // Check if subcourt has enough space for 1 more player
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

      // Prevent duplicate booking by same user on same subcourt
      const existing = await Booking.findOne({ 
        user: userId, 
        slot: slot._id, 
        subCourtIndex: subCourtIndex,
        cancelledAt: null 
      }).session(session);
      if (existing) throw new Error('Already booked this court');

      // Create the booking for 1 player (individual booking)
      const booking = await Booking.create([
        { user: userId, slot: slot._id, subCourtIndex, gameMode, playersCount: 1 },
      ], { session });

      await session.commitTransaction();
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
      await session.abortTransaction();
      return res.status(400).json({ error: e.message });
    } finally {
      session.endSession();
    }
  }
);

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

      // No need to modify slot since we're using Booking model for player tracking

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

// Get all bookings (admin only)
router.get('/all', auth(), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const bookings = await Booking.find({ cancelledAt: null })
      .populate('user', 'name email')
      .populate('slot', 'startTime endTime')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get user's own bookings
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

// Admin cancel booking
router.post('/admin-cancel', auth(), [body('bookingId').isMongoId()], async (req, res) => {
  try {
    // Check if user is admin
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


