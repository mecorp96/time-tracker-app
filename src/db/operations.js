import { saveDatabase } from './database.js';

// Simple localStorage operations for the Time Money Tracker

// User Settings
export const getUserSettings = () => {
  const settings = localStorage.getItem('time-tracker-settings');
  const parsed = settings ? JSON.parse(settings) : {};
  return Object.keys(parsed).length > 0 ? parsed : null;
};

export const saveUserSettings = (hourlyRate, currency = 'EUR') => {
  const settings = {
    id: 1,
    hourly_rate: hourlyRate,
    currency: currency,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem('time-tracker-settings', JSON.stringify(settings));
  saveDatabase();
};

// Work Schedule
export const getWorkSchedule = () => {
  const schedule = localStorage.getItem('time-tracker-schedule');
  return schedule ? JSON.parse(schedule) : [];
};

export const saveWorkSchedule = (schedule) => {
  const scheduleData = schedule.map((item, index) => ({
    id: index + 1,
    day_of_week: item.dayOfWeek,
    start_time: item.startTime,
    end_time: item.endTime,
    is_active: 1,
    created_at: new Date().toISOString()
  }));
  localStorage.setItem('time-tracker-schedule', JSON.stringify(scheduleData));
  saveDatabase();
};

// Work Sessions
export const getWorkSessions = (date = null) => {
  const sessions = localStorage.getItem('time-tracker-sessions');
  let allSessions = sessions ? JSON.parse(sessions) : [];
  
  if (date) {
    allSessions = allSessions.filter(session => session.date === date);
  }
  
  return allSessions.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.start_time.localeCompare(a.start_time);
  });
};

export const createWorkSession = (date, startTime, hourlyRate, isAutoStarted = false) => {
  const sessions = getWorkSessions();
  const newSession = {
    id: Date.now(),
    date: date,
    start_time: startTime,
    end_time: null,
    hourly_rate: hourlyRate,
    earnings: 0,
    is_manual: 0,
    is_auto_started: isAutoStarted ? 1 : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  sessions.push(newSession);
  localStorage.setItem('time-tracker-sessions', JSON.stringify(sessions));
  saveDatabase();
  
  return newSession.id;
};

export const endWorkSession = (sessionId, endTime) => {
  const sessions = getWorkSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    const earnings = calculateEarnings(session.start_time, endTime, session.hourly_rate);
    
    sessions[sessionIndex] = {
      ...session,
      end_time: endTime,
      earnings: earnings,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('time-tracker-sessions', JSON.stringify(sessions));
    saveDatabase();
  }
};

export const updateWorkSession = (sessionId, startTime, endTime, isManual = true) => {
  const sessions = getWorkSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    const earnings = calculateEarnings(startTime, endTime, session.hourly_rate);
    
    sessions[sessionIndex] = {
      ...session,
      start_time: startTime,
      end_time: endTime,
      earnings: earnings,
      is_manual: isManual ? 1 : 0,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('time-tracker-sessions', JSON.stringify(sessions));
    saveDatabase();
  }
};

export const deleteWorkSession = (sessionId) => {
  const sessions = getWorkSessions();
  const filteredSessions = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem('time-tracker-sessions', JSON.stringify(filteredSessions));
  saveDatabase();
};

export const getCurrentActiveSession = () => {
  const sessions = getWorkSessions();
  const activeSession = sessions.find(s => s.end_time === null);
  return activeSession || null;
};

// NEW: Multiple active sessions support
export const getAllActiveSessions = () => {
  const sessions = getWorkSessions();
  return sessions.filter(s => s.end_time === null);
};

export const getActiveSessionsByJob = (jobId) => {
  const sessions = getWorkSessions();
  return sessions.filter(s => s.end_time === null && s.job_id === jobId);
};

export const hasActiveSessionForJob = (jobId) => {
  const activeSessions = getAllActiveSessions();
  return activeSessions.some(s => s.job_id === jobId);
};

export const endAllActiveSessions = (endTime) => {
  const sessions = getWorkSessions();
  let updated = false;
  
  const updatedSessions = sessions.map(session => {
    if (session.end_time === null) {
      const earnings = calculateEarnings(session.start_time, endTime, session.hourly_rate);
      updated = true;
      return {
        ...session,
        end_time: endTime,
        earnings: earnings,
        updated_at: new Date().toISOString()
      };
    }
    return session;
  });
  
  if (updated) {
    localStorage.setItem('time-tracker-sessions', JSON.stringify(updatedSessions));
    saveDatabase();
  }
  
  return updated;
};

// Statistics
export const getWeeklyStats = (startDate, endDate) => {
  const sessions = getWorkSessions().filter(session => 
    session.date >= startDate && session.date <= endDate && session.end_time !== null
  );
  
  const totalEarnings = sessions.reduce((sum, session) => sum + (session.earnings || 0), 0);
  const totalHours = sessions.reduce((sum, session) => {
    if (session.end_time) {
      return sum + calculateHours(session.start_time, session.end_time);
    }
    return sum;
  }, 0);
  
  return {
    totalEarnings,
    totalHours,
    totalSessions: sessions.length
  };
};

export const getMonthlyStats = (year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  return getWeeklyStats(startDate, endDate);
};

// Utility functions
const calculateEarnings = (startTime, endTime, hourlyRate) => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(0, hours * hourlyRate);
};

const calculateHours = (startTime, endTime) => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return Math.max(0, (end - start) / (1000 * 60 * 60));
};

export const getTodayEarnings = () => {
  const today = new Date().toISOString().split('T')[0];
  const sessions = getWorkSessions(today);
  
  let totalEarnings = 0;
  let activeSession = null; // Keep for backwards compatibility
  let activeSessions = [];
  
  sessions.forEach(session => {
    if (session.end_time) {
      totalEarnings += session.earnings;
    } else {
      // Multiple active sessions support
      activeSessions.push(session);
      if (!activeSession) {
        activeSession = session; // First active session for backwards compatibility
      }
    }
  });
  
  // Calculate current earnings for all active sessions
  if (activeSessions.length > 0) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    activeSessions.forEach(session => {
      const currentEarnings = calculateEarnings(session.start_time, currentTime, session.hourly_rate);
      totalEarnings += currentEarnings;
    });
  }
  
  return { 
    totalEarnings, 
    activeSession, // Backwards compatibility
    activeSessions, // NEW: All active sessions
    activeSessionsCount: activeSessions.length
  };
};

// NEW: Get today's earnings by job
export const getTodayEarningsByJob = () => {
  const today = new Date().toISOString().split('T')[0];
  const sessions = getWorkSessions(today);
  const jobEarnings = {};
  
  sessions.forEach(session => {
    const jobId = session.job_id || 'default';
    const jobName = session.job_name || 'Trabajo Principal';
    
    if (!jobEarnings[jobId]) {
      jobEarnings[jobId] = {
        jobId,
        jobName,
        totalEarnings: 0,
        activeSession: null,
        completedSessions: 0
      };
    }
    
    if (session.end_time) {
      jobEarnings[jobId].totalEarnings += session.earnings;
      jobEarnings[jobId].completedSessions++;
    } else {
      jobEarnings[jobId].activeSession = session;
      // Calculate current earnings
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentEarnings = calculateEarnings(session.start_time, currentTime, session.hourly_rate);
      jobEarnings[jobId].totalEarnings += currentEarnings;
    }
  });
  
  return jobEarnings;
};

// VACATION MANAGEMENT
// ====================

// Get all vacation periods
export const getVacations = () => {
  const vacations = localStorage.getItem('time-tracker-vacations');
  return vacations ? JSON.parse(vacations) : [];
};

// Add a new vacation period
export const createVacation = (startDate, endDate, reason = '', type = 'vacation') => {
  const vacations = getVacations();
  const newVacation = {
    id: Date.now(),
    start_date: startDate,
    end_date: endDate,
    reason: reason,
    type: type, // vacation, sick, personal, etc.
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  vacations.push(newVacation);
  localStorage.setItem('time-tracker-vacations', JSON.stringify(vacations));
  saveDatabase();
  
  return newVacation.id;
};

// Update vacation period
export const updateVacation = (vacationId, startDate, endDate, reason = '', type = 'vacation') => {
  const vacations = getVacations();
  const vacationIndex = vacations.findIndex(v => v.id === vacationId);
  
  if (vacationIndex !== -1) {
    vacations[vacationIndex] = {
      ...vacations[vacationIndex],
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      type: type,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('time-tracker-vacations', JSON.stringify(vacations));
    saveDatabase();
  }
};

// Delete vacation period
export const deleteVacation = (vacationId) => {
  const vacations = getVacations();
  const filteredVacations = vacations.filter(v => v.id !== vacationId);
  localStorage.setItem('time-tracker-vacations', JSON.stringify(filteredVacations));
  saveDatabase();
};

// Check if a specific date is a vacation day
export const isVacationDay = (date) => {
  const vacations = getVacations();
  return vacations.some(vacation => {
    return date >= vacation.start_date && date <= vacation.end_date;
  });
};

// Get vacation info for a specific date
export const getVacationForDate = (date) => {
  const vacations = getVacations();
  return vacations.find(vacation => {
    return date >= vacation.start_date && date <= vacation.end_date;
  }) || null;
};

// Get vacation statistics
export const getVacationStats = (year = null) => {
  const vacations = getVacations();
  let filteredVacations = vacations;
  
  if (year) {
    filteredVacations = vacations.filter(vacation => {
      return vacation.start_date.startsWith(year.toString());
    });
  }
  
  const totalDays = filteredVacations.reduce((total, vacation) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return total + diffDays;
  }, 0);
  
  const byType = filteredVacations.reduce((acc, vacation) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (!acc[vacation.type]) {
      acc[vacation.type] = 0;
    }
    acc[vacation.type] += diffDays;
    return acc;
  }, {});
  
  return {
    totalDays,
    totalPeriods: filteredVacations.length,
    byType,
    vacations: filteredVacations.sort((a, b) => b.start_date.localeCompare(a.start_date))
  };
};

// Get vacations for a specific month
export const getVacationsForMonth = (year, month) => {
  const vacations = getVacations();
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  
  return vacations.filter(vacation => {
    return vacation.start_date.startsWith(monthStr) || 
           vacation.end_date.startsWith(monthStr) ||
           (vacation.start_date < monthStr && vacation.end_date > monthStr);
  });
};

// MULTIPLE JOBS/PROJECTS MANAGEMENT
// =================================

// Get all jobs/projects
export const getJobs = () => {
  const jobs = localStorage.getItem('time-tracker-jobs');
  return jobs ? JSON.parse(jobs) : [];
};

// Create a new job/project
export const createJob = (name, hourlyRate, color = '#3B82F6', isActive = true) => {
  const jobs = getJobs();
  const newJob = {
    id: Date.now(),
    name: name.trim(),
    hourly_rate: hourlyRate,
    color: color,
    is_active: isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  jobs.push(newJob);
  localStorage.setItem('time-tracker-jobs', JSON.stringify(jobs));
  saveDatabase();
  
  return newJob.id;
};

// Update job/project
export const updateJob = (jobId, name, hourlyRate, color = '#3B82F6', isActive = true) => {
  const jobs = getJobs();
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex !== -1) {
    jobs[jobIndex] = {
      ...jobs[jobIndex],
      name: name.trim(),
      hourly_rate: hourlyRate,
      color: color,
      is_active: isActive,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('time-tracker-jobs', JSON.stringify(jobs));
    saveDatabase();
  }
};

// Delete job/project
export const deleteJob = (jobId) => {
  const jobs = getJobs();
  const filteredJobs = jobs.filter(j => j.id !== jobId);
  localStorage.setItem('time-tracker-jobs', JSON.stringify(filteredJobs));
  saveDatabase();
};

// Get active jobs
export const getActiveJobs = () => {
  const jobs = getJobs();
  return jobs.filter(job => job.is_active);
};

// Get job by ID
export const getJobById = (jobId) => {
  const jobs = getJobs();
  return jobs.find(job => job.id === jobId) || null;
};

// Job Schedule Management
export const getJobSchedule = (jobId) => {
  const schedules = localStorage.getItem('time-tracker-job-schedules');
  const allSchedules = schedules ? JSON.parse(schedules) : [];
  return allSchedules.filter(schedule => schedule.job_id === jobId);
};

export const saveJobSchedule = (jobId, schedule) => {
  const allSchedules = localStorage.getItem('time-tracker-job-schedules');
  let schedules = allSchedules ? JSON.parse(allSchedules) : [];
  
  // Remove existing schedules for this job
  schedules = schedules.filter(s => s.job_id !== jobId);
  
  // Add new schedules
  const newSchedules = schedule.map((item, index) => ({
    id: Date.now() + index,
    job_id: jobId,
    day_of_week: item.dayOfWeek,
    start_time: item.startTime,
    end_time: item.endTime,
    is_active: 1,
    created_at: new Date().toISOString()
  }));
  
  schedules.push(...newSchedules);
  localStorage.setItem('time-tracker-job-schedules', JSON.stringify(schedules));
  saveDatabase();
};

// Get all job schedules
export const getAllJobSchedules = () => {
  const schedules = localStorage.getItem('time-tracker-job-schedules');
  return schedules ? JSON.parse(schedules) : [];
};

// Job Sessions Management
export const createJobSession = (jobId, date, startTime, isAutoStarted = false) => {
  const job = getJobById(jobId);
  if (!job) return null;
  
  const sessions = getWorkSessions();
  const newSession = {
    id: Date.now(),
    job_id: jobId,
    job_name: job.name,
    job_color: job.color,
    date: date,
    start_time: startTime,
    end_time: null,
    hourly_rate: job.hourly_rate,
    earnings: 0,
    is_manual: 0,
    is_auto_started: isAutoStarted ? 1 : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  sessions.push(newSession);
  localStorage.setItem('time-tracker-sessions', JSON.stringify(sessions));
  saveDatabase();
  
  return newSession.id;
};

// Get sessions by job
export const getSessionsByJob = (jobId, dateRange = null) => {
  const allSessions = getWorkSessions();
  let jobSessions = allSessions.filter(session => session.job_id === jobId);
  
  if (dateRange) {
    jobSessions = jobSessions.filter(session => 
      session.date >= dateRange.start && session.date <= dateRange.end
    );
  }
  
  return jobSessions;
};

// Get job statistics
export const getJobStats = (jobId, dateRange = null) => {
  const sessions = getSessionsByJob(jobId, dateRange);
  const completedSessions = sessions.filter(s => s.end_time !== null);
  
  const totalEarnings = completedSessions.reduce((sum, session) => sum + (session.earnings || 0), 0);
  const totalHours = completedSessions.reduce((sum, session) => {
    if (session.end_time) {
      return sum + calculateHours(session.start_time, session.end_time);
    }
    return sum;
  }, 0);
  
  return {
    totalEarnings,
    totalHours,
    totalSessions: completedSessions.length,
    averageHourlyRate: totalHours > 0 ? totalEarnings / totalHours : 0
  };
};

// Get current active job (if any session is running)
export const getCurrentActiveJob = () => {
  const activeSession = getCurrentActiveSession();
  if (activeSession && activeSession.job_id) {
    return getJobById(activeSession.job_id);
  }
  return null;
};

// Check if should be working on any job
export const getCurrentScheduledJobs = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const allSchedules = getAllJobSchedules();
  const activeJobs = getActiveJobs();
  
  const scheduledJobs = [];
  
  activeJobs.forEach(job => {
    const jobSchedules = allSchedules.filter(s => s.job_id === job.id && s.day_of_week === currentDay);
    
    jobSchedules.forEach(schedule => {
      if (currentTime >= schedule.start_time && currentTime <= schedule.end_time) {
        scheduledJobs.push({
          job: job,
          schedule: schedule
        });
      }
    });
  });
  return scheduledJobs;
}; 