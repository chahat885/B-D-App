import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, Clock, CheckCircle, User } from 'lucide-react';
import axios from 'axios';

const BookingModal = ({ slot, onClose, onSuccess }) => {
  const [selectedGameMode, setSelectedGameMode] = useState('');
  const [selectedSubCourt, setSelectedSubCourt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const API_BASE = import.meta.env.MODE === 'development' 
  ? 'http://localhost:4000' 
  : ''; // production

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Automatically check availability when modal opens
  useEffect(() => {
    console.log('BookingModal opened for slot:', slot);
    console.log('Current token:', localStorage.getItem('token'));
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      console.log('Checking availability for slot:', slot.id);
      const response = await axios.get(`${API_BASE}/api/bookings/check-availability/${slot.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Availability response:', response.data);
      setAvailability(response.data);
      showMessage('success', 'Availability checked successfully!');
    } catch (error) {
      console.error('Availability check error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedGameMode || selectedSubCourt === null) {
      showMessage('error', 'Please select game mode and sub-court');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting booking with:', {
        slotId: slot.id,
        subCourtIndex: selectedSubCourt,
        gameMode: selectedGameMode,
        token: localStorage.getItem('token') ? 'Present' : 'Missing'
      });

      const response = await axios.post(`${API_BASE}/api/bookings`, {
        slotId: slot.id,
        subCourtIndex: selectedSubCourt,
        gameMode: selectedGameMode
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Booking response:', response.data);
      showMessage('success', 'Booking successful!');
      setTimeout(() => onSuccess(), 2000);
    } catch (error) {
      console.error('Booking error:', error);
      showMessage('error', error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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

  const isSubCourtSelectable = (subCourtIndex) => {
    if (!selectedGameMode) return false;
    
    if (!availability) return true; // Allow selection if availability not checked yet
    
    const subCourtData = availability.availability.find(a => a.subCourtIndex === subCourtIndex);
    if (!subCourtData) return true; // Allow selection if no data
    
    if (selectedGameMode === 'singles') {
      return subCourtData.canBookSingles;
    } else if (selectedGameMode === 'doubles') {
      return subCourtData.canBookDoubles;
    }
    
    return false;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Book Court</h2>
                <p className="text-sm text-gray-600">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg fast-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
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

            {/* Availability Status */}
            {checkingAvailability && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Checking availability...</span>
                </div>
              </div>
            )}

            {/* Sub-court Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Select Court</h3>
              
              {/* Singles Courts */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Singles Courts (2 players each)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {slot.subCourts.filter(sc => sc.courtType === 'singles').map((subCourt, index) => {
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

              {/* Doubles Courts */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Doubles Courts (4 players each)</h4>
                <div className="grid grid-cols-3 gap-3">
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

            {/* Availability Info */}
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

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary stable-button"
            >
              Cancel
            </button>
            <button
              onClick={handleBooking}
              disabled={!selectedGameMode || selectedSubCourt === null || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed stable-button"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;