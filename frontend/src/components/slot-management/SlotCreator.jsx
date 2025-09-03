import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const SlotCreator = ({ selectedTimes, loading, onCreateSlots }) => {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Slots</h3>
        
        {selectedTimes.length > 0 && (
          <div className="mb-4 p-4 bg-primary-50 rounded-lg">
            <h4 className="font-medium text-primary-800 mb-2">Selected Slots:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTimes.map((time) => (
                <span
                  key={time}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        )}

        <motion.button
          onClick={onCreateSlots}
          disabled={loading || selectedTimes.length === 0}
          className="btn-primary inline-flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>
            {loading ? 'Creating...' : `Create ${selectedTimes.length} Slot${selectedTimes.length !== 1 ? 's' : ''}`}
          </span>
        </motion.button>

        <p className="text-sm text-gray-500 mt-4">
          Slots will be created with 6 sub-courts each, ready for student bookings
        </p>
      </div>
    </motion.div>
  );
};

export default SlotCreator;
