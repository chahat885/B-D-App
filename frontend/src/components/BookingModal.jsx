// This component displays a modal for booking a court slot.
import { useState, useEffect } from 'react'; // React hooks for state and side effects.
import { motion, AnimatePresence } from 'framer-motion'; // Animation library for fluid UI transitions.
import { X, Users, Trophy, Clock, CheckCircle, User } from 'lucide-react'; // Icon library for visual elements.
import axios from 'axios'; // HTTP client for making API requests.

// Define the BookingModal component, accepting slot data, and functions to close and handle success.
const BookingModal = ({ slot, onClose, onSuccess }) => {
  // State variables to manage the modal's internal state.
  const [selectedGameMode, setSelectedGameMode] = useState(''); // Tracks the user's selected game mode ('singles' or 'doubles').
  const [selectedSubCourt, setSelectedSubCourt] = useState(null); // Tracks the index of the selected sub-court.
  const [loading, setLoading] = useState(false); // Manages the loading state during a booking attempt.
  const [message, setMessage] = useState({ type: '', text: '' }); // Stores and displays user feedback messages (success/error).
  const [availability, setAvailability] = useState(null); // Holds the real-time availability data fetched from the API.
  const [checkingAvailability, setCheckingAvailability] = useState(false); // Manages the loading state while checking availability.

  // Determine the API base URL based on the environment (development or production).
  const API_BASE = import.meta.env.MODE === 'development'
    ? 'http://localhost:4000'
    : ''; // production

  // A helper function to show a temporary message to the user.
  const showMessage = (type, text) => {
    setMessage({ type, text }); // Set the message state.
    setTimeout(() => setMessage({ type: '', text: '' }), 5000); // Clear the message after 5 seconds.
  };

  // useEffect hook to automatically check court availability when the modal opens.
  useEffect(() => {
    console.log('BookingModal opened for slot:', slot);
    console.log('Current token:', localStorage.getItem('token'));
    checkAvailability(); // Call the async function to fetch availability data.
  }, []); // The empty dependency array ensures this effect runs only once when the component mounts.

  // Async function to fetch real-time court availability from the server.
  const checkAvailability = async () => {
    setCheckingAvailability(true); // Set loading state to true.
    try {
      console.log('Checking availability for slot:', slot.id);
      // Make a GET request to the check-availability endpoint, including the user's token for authorization.
      const response = await axios.get(`${API_BASE}/api/bookings/check-availability/${slot.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Availability response:', response.data);
      setAvailability(response.data); // Update the availability state with the fetched data.
      showMessage('success', 'Availability checked successfully!'); // Show a success message.
    } catch (error) {
      console.error('Availability check error:', error);
      // Show an error message if the request fails, using the server's error message or a default one.
      showMessage('error', error.response?.data?.error || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false); // Always set loading state to false after the request.
    }
  };

  // Async function to handle the booking process.
  const handleBooking = async () => {
    // Basic validation to ensure a game mode and sub-court are selected.
    if (!selectedGameMode || selectedSubCourt === null) {
      showMessage('error', 'Please select game mode and sub-court');
      return;
    }

    setLoading(true); // Set loading state for the booking button.
    try {
      console.log('Attempting booking with:', {
        slotId: slot.id,
        subCourtIndex: selectedSubCourt,
        gameMode: selectedGameMode,
        token: localStorage.getItem('token') ? 'Present' : 'Missing'
      });

      // Make a POST request to create a new booking.
      const response = await axios.post(`${API_BASE}/api/bookings`, {
        slotId: slot.id,
        subCourtIndex: selectedSubCourt,
        gameMode: selectedGameMode
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Include the authorization token.
        }
      });

      console.log('Booking response:', response.data);
      showMessage('success', 'Booking successful!'); // Show a success message.
      setTimeout(() => onSuccess(), 2000); // Call the onSuccess callback after 2 seconds to close the modal.
    } catch (error) {
      console.error('Booking error:', error);
      // Show an error message based on the server's response.
      showMessage('error', error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false); // Always set loading state to false.
    }
  };

  // Helper function to format a date string into a readable time format.
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to determine the status and color of a sub-court button based on availability.
  const getSubCourtStatus = (subCourtIndex) => {
    if (!availability) {
      return { status: 'unknown', color: 'bg-gray-100 border-gray-300 text-gray-700' };
    }

    const subCourtData = availability.availability.find(a => a.subCourtIndex === subCourtIndex);
    if (!subCourtData) {
      return { status: 'unknown', color: 'bg-gray-100 border-gray-300 text-gray-700' };
    }

    if (subCourtData.available === 0) {
      return { status: 'full', color: 'bg-red-100 border-red-300 text-red-700' };
    } else if (subCourtData.occupied > 0) {
      return { status: 'partial', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' };
    } else {
      return { status: 'available', color: 'bg-green-100 border-green-300 text-green-700' };
    }
  };

  // Helper function to determine if a sub-court is selectable based on the chosen game mode.
  const isSubCourtSelectable = (subCourtIndex) => {
    if (!selectedGameMode) return false; // Cannot select a court without a game mode.

    if (!availability) return true; // If availability hasn't loaded, assume it's selectable to avoid a blank UI.

    const subCourtData = availability.availability.find(a => a.subCourtIndex === subCourtIndex);
    if (!subCourtData) return true; // If no data, assume selectable.

    // Check if the court can accommodate the selected game mode (singles or doubles).
    if (selectedGameMode === 'singles') {
      return subCourtData.canBookSingles;
    } else if (selectedGameMode === 'doubles') {
      return subCourtData.canBookDoubles;
    }

    return false;
  };

  // The JSX for the modal UI.
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} // Closes the modal when clicking the backdrop.
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()} // Prevents the backdrop click from firing when clicking the modal itself.
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-600" /> {/* Icon */}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Book Court</h2>
                <p className="text-sm text-gray-600">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)} {/* Display the time slot. */}
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg fast-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-scroll">
            {/* Message Display */}
            <AnimatePresence>
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
                  <CheckCircle className="w-5 h-5" />
                  <span>{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Mode Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Select Game Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Singles button */}
                <button
                  onClick={() => setSelectedGameMode('singles')}
                  className={`p-4 rounded-lg border-2 stable-button ${
                    selectedGameMode === 'singles'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="text-center">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Singles</div>
                    <div className="text-sm text-gray-600">2 players</div>
                  </div>
                </button>

                {/* Doubles button */}
                <button
                  onClick={() => setSelectedGameMode('doubles')}
                  className={`p-4 rounded-lg border-2 stable-button ${
                    selectedGameMode === 'doubles'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Doubles</div>
                    <div className="text-sm text-gray-600">4 players</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Availability Status Indicator */}
            {checkingAvailability && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> {/* Spinner */}
                  <span className="text-sm">Checking availability...</span>
                </div>
              </div>
            )}

            {/* Sub-court Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Select Court</h3>

              {/* Singles Courts Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Singles Courts (2 players each)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Map through and render singles courts */}
                  {slot.subCourts.filter(sc => sc.courtType === 'singles').map((subCourt, index) => {
                    const courtIndex = subCourt.index;
                    const status = getSubCourtStatus(courtIndex); // Get status (full, partial, available).
                    const isSelectable = isSubCourtSelectable(courtIndex); // Check if the court can be selected.

                    return (
                      <button
                        key={courtIndex}
                        onClick={() => isSelectable && setSelectedSubCourt(courtIndex)}
                        className={`h-16 rounded-lg border-2 stable-button flex flex-col items-center justify-center ${
                          selectedSubCourt === courtIndex
                            ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-300'
                            : isSelectable
                            ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isSelectable} // Disable the button if it's not selectable.
                      >
                        <div className="text-xs font-medium">Court {courtIndex + 1}</div>
                        {/* Display the number of players currently on the court out of max capacity */}
                        <div className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {availability ?
                            `${availability.availability.find(a => a.subCourtIndex === courtIndex)?.occupied || 0}/2` :
                            '0/2'
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doubles Courts Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Doubles Courts (4 players each)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Map through and render doubles courts */}
                  {slot.subCourts.filter(sc => sc.courtType === 'doubles').map((subCourt, index) => {
                    const courtIndex = subCourt.index;
                    const status = getSubCourtStatus(courtIndex);
                    const isSelectable = isSubCourtSelectable(courtIndex);

                    return (
                      <button
                        key={courtIndex}
                        onClick={() => isSelectable && setSelectedSubCourt(courtIndex)}
                        className={`h-16 rounded-lg border-2 stable-button flex flex-col items-center justify-center ${
                          selectedSubCourt === courtIndex
                            ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-300'
                            : isSelectable
                            ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isSelectable}
                      >
                        <div className="text-xs font-medium">Court {courtIndex + 1}</div>
                        {/* Display the number of players currently on the court out of max capacity */}
                        <div className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {availability ?
                            `${availability.availability.find(a => a.subCourtIndex === courtIndex)?.occupied || 0}/4` :
                            '0/4'
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Availability Information Box */}
            {availability ? (
              <motion.div
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-2 text-blue-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Real-time availability checked. Select a court that can accommodate your game mode.
                  </span>
                </div>
              </motion.div>
            ) : !checkingAvailability && (
              <motion.div
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-2 text-yellow-800">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Checking availability... Please wait or try refreshing.
                  </span>
                </div>
              </motion.div>
            )}

            {/* Booking Summary */}
            {selectedGameMode && selectedSubCourt !== null && (
              <motion.div
                className="p-4 bg-primary-50 border border-primary-200 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h4 className="font-medium text-primary-800 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm text-primary-700">
                  <div>• Time: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}</div>
                  <div>• Game Mode: {selectedGameMode.charAt(0).toUpperCase() + selectedGameMode.slice(1)}</div>
                  <div>• Court: {selectedSubCourt + 1} ({selectedGameMode === 'singles' ? 'Singles' : 'Doubles'} Court)</div>
                  <div>• Players: {selectedGameMode === 'singles' ? '2' : '4'}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
            {/* Cancel button */}
            <button
              onClick={onClose}
              className="btn-secondary stable-button"
            >
              Cancel
            </button>
            {/* Confirm Booking button */}
            <button
              onClick={handleBooking}
              disabled={!selectedGameMode || selectedSubCourt === null || loading} // Button is disabled until a game mode and court are selected, or if a booking is in progress.
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed stable-button"
            >
              {loading ? 'Booking...' : 'Confirm Booking'} {/* Change button text based on loading state. */}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal; // Export the component for use in other parts of the application.