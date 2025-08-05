import { useTimeTracker } from '../hooks/useTimeTracker';
import { getCurrentTime, getDayOfWeek, getDayName } from '../utils/timeUtils';

const DebugInfo = () => {
  const { settings, workSchedule, activeSession, isWorking, shouldBeWorking } = useTimeTracker();
  
  const currentDay = getDayOfWeek(new Date());
  const currentTime = getCurrentTime();
  
  const todaySchedule = workSchedule.filter(s => s.day_of_week === currentDay);
  
  const handleShowLocalStorage = () => {
    console.log('📦 LocalStorage Contents:');
    console.log('Settings:', localStorage.getItem('time-tracker-settings'));
    console.log('Schedule:', localStorage.getItem('time-tracker-schedule'));
    console.log('Sessions:', localStorage.getItem('time-tracker-sessions'));
  };
  
  const handleClearSessions = () => {
    localStorage.setItem('time-tracker-sessions', '[]');
    window.location.reload();
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg text-xs font-mono">
      <div className="mb-2 font-bold">🐛 DEBUG INFO</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-yellow-300 font-semibold">Time & Date:</div>
          <div>Current Time: {currentTime}</div>
          <div>Current Day: {currentDay} ({getDayName(currentDay)})</div>
          
          <div className="text-yellow-300 font-semibold mt-2">Settings:</div>
          <div>Has Settings: {settings ? '✅' : '❌'}</div>
          <div>Hourly Rate: {settings?.hourly_rate || 'N/A'}</div>
          
          <div className="text-yellow-300 font-semibold mt-2">Schedule:</div>
          <div>Total Schedule Items: {workSchedule?.length || 0}</div>
          <div>Today's Schedule: {todaySchedule?.length || 0}</div>
          {todaySchedule.map((s, i) => (
            <div key={i} className="text-xs">
              {s.start_time} - {s.end_time}
            </div>
          ))}
        </div>
        
        <div>
          <div className="text-yellow-300 font-semibold">Status:</div>
          <div>Is Working: {isWorking ? '✅' : '❌'}</div>
          <div>Should Be Working: {shouldBeWorking ? '✅' : '❌'}</div>
          <div>Has Active Session: {activeSession ? '✅' : '❌'}</div>
          
          {activeSession && (
            <>
              <div className="text-yellow-300 font-semibold mt-2">Active Session:</div>
              <div>Started: {activeSession.start_time}</div>
              <div>Date: {activeSession.date}</div>
              <div>Rate: €{activeSession.hourly_rate}/h</div>
            </>
          )}
          
          <div className="mt-2 space-x-2">
            <button 
              onClick={handleShowLocalStorage}
              className="bg-blue-600 px-2 py-1 rounded text-xs"
            >
              Show LocalStorage
            </button>
            <button 
              onClick={handleClearSessions}
              className="bg-red-600 px-2 py-1 rounded text-xs"
            >
              Clear Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo; 