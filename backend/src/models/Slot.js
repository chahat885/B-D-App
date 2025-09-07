import mongoose from 'mongoose';

// Constants for courts and slot duration
const SINGLES_COURTS = 3;          // Number of singles courts (2 players each)
const DOUBLES_COURTS = 3;          // Number of doubles courts (4 players each)
const TOTAL_COURTS = SINGLES_COURTS + DOUBLES_COURTS; // Total sub-courts per slot
const SLOT_DURATION_MINUTES = 45;   // Duration of each slot in minutes

// Define Slot schema
const SlotSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true, index: true }, // Slot start time (indexed for faster queries)
    endTime: { type: Date, required: true },                // Slot end time
    // Array of sub-courts for this slot
    subCourts: [
      {
        index: { type: Number, required: true },           // Unique index for each sub-court
        capacity: { type: Number, required: true, default: 2 }, // Max players in this sub-court
        courtType: { type: String, enum: ['singles', 'doubles'], required: true }, // Type of court
      },
    ],
  },
  { timestamps: true } // Automatically add createdAt and updatedAt
);

// Static method to create a slot with default sub-courts
SlotSchema.statics.createWithDefaults = function createWithDefaults(startTime) {
  const start = new Date(startTime); // Convert input to Date object
  const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000); // End time = start + 45 mins
  
  const subCourts = [];

  // Initialize singles courts (2 players each)
  for (let i = 0; i < SINGLES_COURTS; i++) {
    subCourts.push({
      index: i,
      capacity: 2,
      courtType: 'singles'
    });
  }

  // Initialize doubles courts (4 players each)
  for (let i = 0; i < DOUBLES_COURTS; i++) {
    subCourts.push({
      index: i + SINGLES_COURTS,
      capacity: 4,
      courtType: 'doubles'
    });
  }

  // Return a slot object ready to save in DB
  return { startTime: start, endTime: end, subCourts };
};

// Instance method to check current status of the slot
SlotSchema.methods.getStatus = async function getStatus() {
  const Booking = mongoose.model('Booking'); // Get Booking model
  // Fetch all active bookings for this slot (not cancelled)
  const activeBookings = await Booking.find({ 
    slot: this._id, 
    cancelledAt: null 
  });

  // If no bookings, slot is fully available
  if (activeBookings.length === 0) return 'available';

  // Track occupancy per sub-court
  const courtOccupancy = {};
  activeBookings.forEach(booking => {
    if (!courtOccupancy[booking.subCourtIndex]) courtOccupancy[booking.subCourtIndex] = 0;
    courtOccupancy[booking.subCourtIndex] += booking.playersCount;
  });

  // Check if any sub-court still has space
  for (let i = 0; i < this.subCourts.length; i++) {
    const subCourt = this.subCourts[i];
    const occupied = courtOccupancy[i] || 0;
    if (occupied < subCourt.capacity) return 'partial'; // At least one sub-court has space
  }

  // If all sub-courts are full
  return 'full';
};

export default mongoose.model('Slot', SlotSchema);
