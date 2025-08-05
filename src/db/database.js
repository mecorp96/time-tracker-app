// Simple localStorage-based database for the Time Money Tracker
// This replaces sql.js to avoid import/compatibility issues

let isInitialized = false;

export const initDatabase = async () => {
  if (!isInitialized) {
    // Initialize default data structure if not exists
    if (!localStorage.getItem('time-tracker-settings')) {
      localStorage.setItem('time-tracker-settings', JSON.stringify({}));
    }
    if (!localStorage.getItem('time-tracker-schedule')) {
      localStorage.setItem('time-tracker-schedule', JSON.stringify([]));
    }
    if (!localStorage.getItem('time-tracker-sessions')) {
      localStorage.setItem('time-tracker-sessions', JSON.stringify([]));
    }
    if (!localStorage.getItem('time-tracker-vacations')) {
      localStorage.setItem('time-tracker-vacations', JSON.stringify([]));
    }
    if (!localStorage.getItem('time-tracker-jobs')) {
      localStorage.setItem('time-tracker-jobs', JSON.stringify([]));
    }
    if (!localStorage.getItem('time-tracker-job-schedules')) {
      localStorage.setItem('time-tracker-job-schedules', JSON.stringify([]));
    }
    if (!localStorage.getItem('time-tracker-paused-jobs')) {
      localStorage.setItem('time-tracker-paused-jobs', JSON.stringify([]));
    }
    isInitialized = true;
  }
  return true;
};

export const saveDatabase = () => {
  // No-op for compatibility, data is saved immediately to localStorage
};

export const getDatabase = () => {
  return {
    // Mock database interface for compatibility
    prepare: (query) => ({
      getAsObject: () => ({}),
      step: () => false,
      bind: () => {},
      free: () => {}
    }),
    run: () => {},
    exec: () => [[]]
  };
};

export const resetDatabase = () => {
  localStorage.removeItem('time-tracker-settings');
  localStorage.removeItem('time-tracker-schedule');
  localStorage.removeItem('time-tracker-sessions');
  isInitialized = false;
}; 