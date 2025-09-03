import { useState } from 'react';
import { motion } from 'framer-motion';
import SlotManagement from '../components/SlotManagement';
import BookingsManagement from '../components/BookingsManagement';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' or 'bookings'

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f9fafb] via-[#eff6ff] to-[#e0e7ff] p-6 page-transition">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage badminton court slots and bookings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex-1 py-2 px-4 rounded-md font-medium fast-hover ${
              activeTab === 'slots'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Manage Slots
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 px-4 rounded-md font-medium fast-hover ${
              activeTab === 'bookings'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            View Bookings
          </button>
        </div>

        {/* Main Content */}
        <div>
          {activeTab === 'slots' ? (
            <SlotManagement />
          ) : (
            <BookingsManagement />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;