import { motion } from 'framer-motion';
import { Calendar, Trash2, Users } from 'lucide-react';

const BookingsTable = ({ bookings, loading, onCancelBooking }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-96 scroll-container">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Date & Time</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Sub-court</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Game Mode</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Players</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Booked At</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <motion.tr
              key={booking._id}
              className="border-b border-gray-100 hover:bg-gray-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-800">{booking.user.name}</div>
                  <div className="text-sm text-gray-500">{booking.user.email}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-800">
                    {new Date(booking.slot.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.slot.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(booking.slot.endTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Court {booking.subCourtIndex + 1}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  booking.gameMode === 'singles' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {booking.gameMode.charAt(0).toUpperCase() + booking.gameMode.slice(1)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{booking.playersCount}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {new Date(booking.createdAt).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => onCancelBooking(booking._id)}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingsTable;
