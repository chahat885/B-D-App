import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, User, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE = import.meta.env.MODE === 'development' 
  ? 'http://localhost:4000' 
  : ''; // production

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      showMessage('error', 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/bookings/cancel`, {
        bookingId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      showMessage('success', 'Booking cancelled successfully');
      fetchMyBookings(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showMessage('error', error.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGameModeIcon = (gameMode) => {
    return gameMode === 'singles' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  const getGameModeColor = (gameMode) => {
    return gameMode === 'singles' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const isUpcoming = (endTime) => {
    return new Date(endTime) > new Date();
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f9fafb] via-[#eff6ff] to-[#e0e7ff] p-6 page-transition">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600 text-lg">
            View and manage your badminton court bookings
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <motion.div
            className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Bookings List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bookings Yet</h3>
              <p className="text-gray-500">You haven't made any court bookings yet.</p>
              <p className="text-gray-500">Go to the calendar to book your first slot!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Your Bookings ({bookings.length})
              </h2>
              
              {bookings.map((booking) => (
                  <motion.div
                    key={booking._id}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      booking.slot && booking.slot.endTime && isUpcoming(booking.slot.endTime)
                        ? 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          {getGameModeIcon(booking.gameMode)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {booking.slot?.startTime ? formatDate(booking.slot.startTime) : 'No Date'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{booking.slot?.startTime && booking.slot?.endTime ? `${formatTime(booking.slot.startTime)} - ${formatTime(booking.slot.endTime)}` : 'No Time'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>Court {typeof booking.subCourtIndex === 'number' ? booking.subCourtIndex + 1 : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className="flex items-center space-x-4">
                      {/* Game Mode Badge */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getGameModeColor(booking.gameMode)}`}>
                        {getGameModeIcon(booking.gameMode)}
                        <span className="ml-1 capitalize">{booking.gameMode}</span>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        booking.slot && booking.slot.endTime && isUpcoming(booking.slot.endTime)
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {booking.slot && booking.slot.endTime && isUpcoming(booking.slot.endTime) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>Upcoming</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Completed</span>
                          </>
                        )}
                      </div>

                      {/* Cancel Button */}
                      {booking.slot && booking.slot.endTime && isUpcoming(booking.slot.endTime) && (
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Cancel Booking"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Players:</span>
                          <span className="ml-2 text-gray-600">{typeof booking.playersCount === 'number' ? booking.playersCount : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Court Type:</span>
                          <span className="ml-2 text-gray-600 capitalize">{booking.gameMode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Booked On:</span>
                          <span className="ml-2 text-gray-600">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {bookings.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center w-full max-w-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {bookings.filter(b => b.slot && b.slot.endTime && isUpcoming(b.slot.endTime)).length}
              </h3>
              <p className="text-gray-600">Upcoming Bookings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
