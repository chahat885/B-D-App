import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';

// Clean up past slots automatically
export const cleanupPastSlots = async () => {
  try {
    const now = new Date();
    // Find all slots that have ended
    const pastSlots = await Slot.find({
      endTime: { $lt: now }
    });

    if (pastSlots.length === 0) {
      console.log('No past slots to clean up');
      return;
    }

    const slotIds = pastSlots.map(slot => slot._id);

    // Delete associated bookings first
    await Booking.deleteMany({
      slot: { $in: slotIds }
    });

    // Delete the past slots
    const deletedSlots = await Slot.deleteMany({
      _id: { $in: slotIds }
    });

    console.log(`Cleaned up ${deletedSlots.deletedCount} past slots and their bookings`);
  } catch (error) {
    console.error('Error cleaning up past slots:', error);
  }
};

// Check if slot already exists for a given time
export const checkSlotExists = async (startTime) => {
  try {
    const existingSlot = await Slot.findOne({
      startTime: new Date(startTime)
    });
    
    return !!existingSlot;
  } catch (error) {
    console.error('Error checking slot existence:', error);
    return false;
  }
};

// Run cleanup every hour
setInterval(cleanupPastSlots, 60 * 60 * 1000); // 1 hour

// Run cleanup on startup
cleanupPastSlots();
