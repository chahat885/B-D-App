import { motion } from 'framer-motion';

const BookingStats = ({ bookingStats }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{bookingStats.total}</div>
          <div className="text-sm text-blue-600">Total Bookings</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{bookingStats.singles}</div>
          <div className="text-sm text-green-600">Singles Games</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{bookingStats.doubles}</div>
          <div className="text-sm text-purple-600">Doubles Games</div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingStats;
