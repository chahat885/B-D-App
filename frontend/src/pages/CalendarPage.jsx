import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Trophy, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import CourtGrid from '../components/court-display/CourtGrid';

const CalendarPage = () => {
  console.log('MODE:', import.meta.env.MODE);

  // --- STATE VARIABLES ---
  const [selectedDate, setSelectedDate] = useState(new Date()); // currently selected date
  const [slots, setSlots] = useState([]); // all slots fetched from API
  const [loading, setLoading] = useState(false); // loading state for API
  const [showBookingModal, setShowBookingModal] = useState(false); // show/hide booking modal
  const [selectedSlot, setSelectedSlot] = useState(null); // slot selected for booking
  const [currentWeek, setCurrentWeek] = useState([]); // array of 7 dates representing current week

  // API base URL (changes depending on dev/production)
  const API_BASE = import.meta.env.MODE === 'development' 
    ? 'http://localhost:4000' 
    : ''; 

  // --- EFFECTS ---
  // Generate current week's dates when component mounts
  useEffect(() => {
    generateWeekDates();
  }, []);

  // Fetch slots whenever the week changes
  useEffect(() => {
    if (currentWeek.length > 0) {
      fetchSlots();
    }
  }, [currentWeek]);

  // --- FUNCTIONS ---

  // Generate 7 days starting from today
  const generateWeekDates = () => {
    const today = new Date();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      week.push(date);
    }
    setCurrentWeek(week);
  };

  // Fetch slots from backend API for the current week
  const fetchSlots = async () => {
    if (currentWeek.length === 0) return;
    setLoading(true);

    try {
      const from = currentWeek[0].toISOString();
      const to = new Date(currentWeek[6].getTime() + 24 * 60 * 60 * 1000).toISOString(); // include end of last day

      const response = await axios.get(`${API_BASE}/api/slots/list?from=${from}&to=${to}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSlots(response.data); // save fetched slots in state
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Returns CSS classes depending on slot status
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Returns icons depending on slot status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <Plus className="w-4 h-4" />;
      case 'partial': return <Users className="w-4 h-4" />;
      case 'full': return <Minus className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Handle click on a slot
  const handleSlotClick = (slot) => {
    if (slot.status === 'full') return; // full slots cannot be booked
    setSelectedSlot(slot);
    setShowBookingModal(true); // open booking modal
  };

  // Format time for display (e.g., 03:00 PM)
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Format date for display (e.g., Mon, Sep 24)
  const formatDate = useCallback((date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Check if a date is today
  const isToday = useCallback((date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  // Filter slots for currently selected date
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === selectedDate.toDateString();
    });
  }, [slots, selectedDate]);

  // --- JSX RENDER ---
  return (
    <div className="min-h-full bg-gradient-to-br from-[#f9fafb] via-[#eff6ff] to-[#e0e7ff] p-6 page-transition">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section with title, description, and trophy icon */}
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-6 pb-2">
            Court Booking Calendar
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed ">
            Select a date and time slot to book your badminton court. 
            <span className="text-orange-600 font-semibold"> Real-time availability</span> with instant booking confirmation.
          </p>
        </motion.div>

        {/* Week Navigation */}
        <motion.div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Date</h2>
              <p className="text-gray-600">Choose from the current week's available dates</p>
            </div>
            {/* Button to reset week to today */}
            <motion.button onClick={generateWeekDates} className="btn-secondary fast-hover px-6 py-3 rounded-xl shadow-md" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Calendar className="w-5 h-5 mr-2" />
              Reset to Today
            </motion.button>
          </div>

          {/* Render 7 days as buttons */}
          <div className="grid grid-cols-7 gap-3">
            {currentWeek.map((date, index) => (
              <motion.button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-4 rounded-xl border-2 fast-hover transition-all duration-300 ${
                  selectedDate.toDateString() === date.toDateString()
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                } ${isToday(date) ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${isToday(date) ? 'text-orange-600' : 'text-gray-800'}`}>
                    {date.getDate()}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Time Slots Section */}
        <motion.div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Slots for {formatDate(selectedDate)}</h2>
              <p className="text-gray-600">{filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''} available</p>
            </div>

            {/* Loading indicator while fetching slots */}
            {loading && (
              <div className="flex items-center space-x-3 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl">
                <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Loading...</span>
              </div>
            )}
          </div>

          {/* Conditional rendering for loading / no slots / slots list */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Available Slots</h3>
              <p className="text-gray-500">Please wait while we fetch the latest availability...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Slots Available</h3>
              <p className="text-gray-500">No court slots have been created for this date yet.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[70vh] scroll-container">
              {/* Render each slot */}
              {filteredSlots.map((slot, index) => (
                <motion.div key={slot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                  <CourtGrid slot={slot} onSlotClick={handleSlotClick} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedSlot && (
          <BookingModal
            slot={selectedSlot}
            onClose={() => {
              setShowBookingModal(false); // close modal
              setSelectedSlot(null); // reset selected slot
            }}
            onSuccess={() => {
              setShowBookingModal(false);
              setSelectedSlot(null);
              fetchSlots(); // refresh slots after successful booking
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
