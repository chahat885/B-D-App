import mongoose from 'mongoose';

// 3 Singles courts (2 players each) + 3 Doubles courts (4 players each) = 6 courts per slot
const SINGLES_COURTS = 3;
const DOUBLES_COURTS = 3;
const TOTAL_COURTS = SINGLES_COURTS + DOUBLES_COURTS;
const SLOT_DURATION_MINUTES = 45;

const SlotSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    // Track capacity and occupancy by sub-court
    subCourts: [
      {
        index: { type: Number, required: true },
        capacity: { type: Number, required: true, default: 2 }, // Will be set based on court type
        courtType: { type: String, enum: ['singles', 'doubles'], required: true },
      },
    ],
  },
  { timestamps: true }
);

SlotSchema.statics.createWithDefaults = function createWithDefaults(startTime) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
  
  const subCourts = [];
  
  // Create 3 Singles courts (capacity: 2 players each)
  for (let i = 0; i < SINGLES_COURTS; i++) {
    subCourts.push({
      index: i,
      capacity: 2,
      courtType: 'singles'
    });
  }
  
  // Create 3 Doubles courts (capacity: 4 players each)
  for (let i = 0; i < DOUBLES_COURTS; i++) {
    subCourts.push({
      index: i + SINGLES_COURTS,
      capacity: 4,
      courtType: 'doubles'
    });
  }
  
  return { startTime: start, endTime: end, subCourts };
};

SlotSchema.methods.getStatus = async function getStatus() {
  // Get total players from bookings
  const Booking = mongoose.model('Booking');
  const activeBookings = await Booking.find({ 
    slot: this._id, 
    cancelledAt: null 
  });
  
  if (activeBookings.length === 0) return 'available';
  
  // Check court occupancy
  const courtOccupancy = {};
  activeBookings.forEach(booking => {
    if (!courtOccupancy[booking.subCourtIndex]) {
      courtOccupancy[booking.subCourtIndex] = 0;
    }
    courtOccupancy[booking.subCourtIndex] += booking.playersCount;
  });
  
  // Check if any court has space
  for (let i = 0; i < this.subCourts.length; i++) {
    const subCourt = this.subCourts[i];
    const occupied = courtOccupancy[i] || 0;
    if (occupied < subCourt.capacity) {
      return 'partial'; // At least one court has space
    }
  }
  
  return 'full'; // All courts are full
};

export default mongoose.model('Slot', SlotSchema);


