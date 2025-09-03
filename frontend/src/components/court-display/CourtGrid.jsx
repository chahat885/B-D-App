import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';

const CourtGrid = ({ slot, onSlotClick }) => {
  // Format time with AM/PM for morning, 24-hour + PM for evening
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if (hours < 12) {
      return `${hours === 0 ? 12 : hours}:${minutes} AM`; // Morning
    } else {
      return `${hours}:${minutes} PM`; // Evening (24-hour + PM)
    }
  };

  // Morning / Evening helper, subtle styling
  const getPeriod = (dateString) => {
    const hours = new Date(dateString).getHours();
    return hours < 12 ? "Morning" : "Evening";
  };

  const getSubCourtStatus = (subCourtIndex, availability) => {
    if (!availability) return { status: 'unknown', color: 'bg-gray-100 border-gray-300 text-gray-700' };
    const subCourtData = availability.find(a => a.subCourtIndex === subCourtIndex);
    if (!subCourtData) return { status: 'unknown', color: 'bg-gray-100 border-gray-300 text-gray-700' };
    if (subCourtData.available === 0) return { status: 'full', color: 'bg-red-100 border-red-300 text-red-700' };
    else if (subCourtData.occupied > 0) return { status: 'partial', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' };
    else return { status: 'available', color: 'bg-green-100 border-green-300 text-green-700' };
  };

  const getGameModeInfo = (subCourtIndex, availability) => {
    if (!availability) return null;
    const subCourtData = availability.find(a => a.subCourtIndex === subCourtIndex);
    if (!subCourtData || subCourtData.bookings.length === 0) return null;
    const booking = subCourtData.bookings[0];
    return {
      mode: booking.gameMode,
      players: booking.playersCount,
      canJoin: booking.gameMode === 'singles' && booking.playersCount === 1
    };
  };

  const singlesCourts = [0, 1, 2];
  const doublesCourts = [3, 4, 5];

  return (
    <div
      className={`p-6 rounded-2xl border-2 stable-layout cursor-pointer transition-all duration-300 ${
        slot.status === 'full'
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75'
          : 'border-gray-200 hover:border-orange-300 hover:shadow-xl hover:scale-[1.02] bg-white/90 backdrop-blur-sm'
      }`}
      onClick={() => slot.status !== 'full' && onSlotClick(slot)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}{" "}
              <span className="text-sm text-orange-500 font-medium">
                ({getPeriod(slot.startTime)})
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              {slot.lockedGameMode
                ? `${slot.lockedGameMode.charAt(0).toUpperCase() + slot.lockedGameMode.slice(1)} Mode`
                : 'Mixed game modes available'}
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border shadow-sm ${
          slot.status === 'available' ? 'bg-green-100 text-green-800 border-green-200' :
          slot.status === 'partial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          'bg-red-100 text-red-800 border-red-200'
        }`}>
          <span className="capitalize">{slot.status}</span>
        </div>
      </div>

      {/* Court Layout */}
      <div className="grid grid-cols-2 gap-6 court-grid">
        {/* Singles Courts */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800">Singles Courts</h4>
            <span className="text-sm text-gray-500">(2 players)</span>
          </div>
          <div className="space-y-2">
            {singlesCourts.map((courtIndex) => {
              const status = getSubCourtStatus(courtIndex, slot.availability);
              const gameInfo = getGameModeInfo(courtIndex, slot.availability);
              
              return (
                <div
                  key={courtIndex}
                  className={`p-3 rounded-lg border-2 stable-layout ${status.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Court {courtIndex + 1}</span>
                    <div className="flex items-center space-x-1">
                      {gameInfo ? (
                        <>
                          <User className="w-4 h-4" />
                          <span className="text-xs">
                            {gameInfo.players}/2 {gameInfo.mode}
                            {gameInfo.canJoin && <span className="text-green-600 ml-1">(Join)</span>}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs">Check Availability</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doubles Courts */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800">Doubles Courts</h4>
            <span className="text-sm text-gray-500">(4 players)</span>
          </div>
          <div className="space-y-2">
            {doublesCourts.map((courtIndex) => {
              const status = getSubCourtStatus(courtIndex, slot.availability);
              const gameInfo = getGameModeInfo(courtIndex, slot.availability);
              
              return (
                <div
                  key={courtIndex}
                  className={`p-3 rounded-lg border-2 stable-layout ${status.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Court {courtIndex + 1}</span>
                    <div className="flex items-center space-x-1">
                      {gameInfo ? (
                        <>
                          <Users className="w-4 h-4" />
                          <span className="text-xs">
                            {gameInfo.players}/4 {gameInfo.mode}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs">Check Availability</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtGrid;
