import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const SlotCreator = ({ selectedTimes, loading, onCreateSlots }) => {
  return (
    <motion.div
      className="text-center flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Slots</h3>
        
        {selectedTimes.length > 0 && (
          <motion.div
            className="mb-6 p-4 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-medium text-gray-700 mb-3 text-lg">Selected Slots:</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {selectedTimes.map((time) => (
                <motion.span
                  key={time}
                  className="px-4 py-2 text-sm font-semibold rounded-full text-white
                             bg-gradient-to-r from-teal-400 to-emerald-500 shadow-md"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  {time}
                </motion.span>
              ))}
            </div>
          </motion.div>
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
