import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const TimeSlotSelector = ({ selectedTimes, onTimeToggle, onClearAll, existingSlots }) => {
  // Predefined time slots (45-minute intervals)
  const timeSlots = [
     '16:15', '17:00', '17:45',
    '18:30', '19:15', '20:00', '20:45'
  ];

  const isTimeSlotSelected = (time) => selectedTimes.includes(time);
  const isTimeSlotAlreadyExists = (time) => existingSlots.includes(time);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Select Time Slots</h2>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {timeSlots.map((time) => {
          const isSelected = isTimeSlotSelected(time);
          const alreadyExists = isTimeSlotAlreadyExists(time);
          
          return (
            <motion.button
              key={time}
              onClick={() => !alreadyExists && onTimeToggle(time)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                alreadyExists
                  ? 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
              whileHover={!alreadyExists ? { scale: 1.05 } : {}}
              whileTap={!alreadyExists ? { scale: 0.95 } : {}}
              disabled={alreadyExists}
              title={alreadyExists ? 'Slot already exists' : ''}
            >
              {time}
              {alreadyExists && <span className="block text-xs text-red-400">Exists</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedTimes.length} slot(s) selected
        </div>
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Clear All
        </button>
      </div>
    </motion.div>
  );
};

export default TimeSlotSelector;
