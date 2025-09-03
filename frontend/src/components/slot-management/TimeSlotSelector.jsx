import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const TimeSlotSelector = ({ selectedTimes, onTimeToggle, onClearAll, existingSlots }) => {
  // Morning slots (from 5:00 AM, 45-minute intervals)
  const morningSlots = ['05:00', '05:45', '06:30', '07:15'];

  // Evening slots (from 4:15 PM, 45-minute intervals)
  const eveningSlots = ['16:15', '17:00', '17:45', '18:30', '19:15'];

  const isTimeSlotSelected = (time) => selectedTimes.includes(time);
  const isTimeSlotAlreadyExists = (time) => existingSlots.includes(time);

  // Reusable slot renderer
  const renderSlots = (slots, section) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{section} Slots</h3>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((time) => {
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
              <span className="block text-xs text-gray-500">
                {section}
              </span>
              {alreadyExists && (
                <span className="block text-xs text-red-400">Exists</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

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

      {/* Morning Section */}
      {renderSlots(morningSlots, 'Morning')}

      {/* Evening Section */}
      {renderSlots(eveningSlots, 'Evening')}

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
