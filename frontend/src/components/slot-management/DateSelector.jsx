import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

// DateSelector component that lets users pick a date
const DateSelector = ({ selectedDate, onDateChange }) => {

  // Function to format the date into a readable string like "Monday, September 8, 2025"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      initial={{ opacity: 0, x: -20 }}   // Animation starts from left
      animate={{ opacity: 1, x: 0 }}     // Moves to normal position
      transition={{ delay: 0.2 }}        // Animation delay
    >
      {/* Header with calendar icon and title */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Select Date</h2>
      </div>

      {/* Date picker input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose Date
        </label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]} // Format date as "YYYY-MM-DD" for input value
          onChange={(e) => onDateChange(new Date(e.target.value))} // Update selected date on change
          min={new Date().toISOString().split('T')[0]} // Disable past dates by setting minimum selectable date to today
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {/* Display the formatted selected date below the input */}
        <p className="text-sm text-gray-500 mt-2">
          Selected: {formatDate(selectedDate)}
        </p>
      </div>
    </motion.div>
  );
};

export default DateSelector;
