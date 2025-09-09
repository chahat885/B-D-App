import mongoose from 'mongoose';

// Define Booking schema
const BookingSchema = new mongoose.Schema(
  {
    // Reference to the user who made the booking
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Reference to the slot that is being booked
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true, index: true }, 
    // Indexed for faster queries when fetching bookings for a particular slot

    // Index of the sub-court being booked within the slot
    subCourtIndex: { type: Number, required: true },

    // Type of game: singles (2 players) or doubles (4 players)
    gameMode: { type: String, enum: ['singles', 'doubles'], required: true },

    // Number of players for this booking
    playersCount: { type: Number, required: true },

    // If the booking is cancelled, store the cancellation time
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Export the Booking model
export default mongoose.model('Booking', BookingSchema);
