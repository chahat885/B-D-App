import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus } from 'lucide-react';
import axios from 'axios';
import DateSelector from './slot-management/DateSelector';
import TimeSlotSelector from './slot-management/TimeSlotSelector.jsx';
import SlotCreator from './slot-management/SlotCreator';
import MessageDisplay from './slot-management/MessageDisplay';

const SlotManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingSlots, setExistingSlots] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fetch existing slots for the selected date
  const fetchExistingSlots = async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await axios.get(
        `${API_BASE}/api/slots?from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const existingTimes = response.data.map((slot) => {
        const slotTime = new Date(slot.startTime);
        return slotTime.toTimeString().slice(0, 5); // HH:MM
      });

      setExistingSlots(existingTimes);
    } catch (error) {
      console.error('Failed to fetch existing slots:', error);
      setExistingSlots([]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimes([]);
    fetchExistingSlots(date);
  };

  // prevent past slots
  const toggleTimeSlot = (time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (slotDate < now) {
      showMessage('error', 'You cannot create past slots');
      return;
    }

    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const createSlots = async () => {
    if (selectedTimes.length === 0) {
      showMessage('error', 'Please select at least one time slot');
      return;
    }

    setLoading(true);
    try {
      const startTimes = selectedTimes.map((time) => {
        const [hours, minutes] = time.split(':');
        const date = new Date(selectedDate);
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date.toISOString();
      });

      await axios.post(
        `${API_BASE}/api/slots`,
        { startTimes },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      showMessage('success', `Successfully created ${selectedTimes.length} slot(s)`);
      setSelectedTimes([]);
      fetchExistingSlots(selectedDate);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingSlots(selectedDate);
  }, []);

  return (
    <div className="space-y-6">
      <MessageDisplay message={message} />

      <div className="grid lg:grid-cols-2 gap-8">
        <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

        <TimeSlotSelector
          selectedTimes={selectedTimes}
          onTimeToggle={toggleTimeSlot}
          onClearAll={() => setSelectedTimes([])}
          existingSlots={existingSlots}
          selectedDate={selectedDate}
        />
      </div>

      <SlotCreator
        selectedTimes={selectedTimes}
        loading={loading}
        onCreateSlots={createSlots}
      />

      {/* Info Section */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">1. Select Date</h4>
            <p className="text-sm text-gray-600">Choose the date for which you want to create slots</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">2. Choose Times</h4>
            <p className="text-sm text-gray-600">Select specific time slots (45-minute intervals)</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">3. Create Slots</h4>
            <p className="text-sm text-gray-600">Generate slots with 6 sub-courts each</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SlotManagement;
