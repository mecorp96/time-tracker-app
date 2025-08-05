import { useState, useEffect, useCallback } from 'react';
import {
  getUserSettings,
  getWorkSchedule,
  getCurrentActiveSession,
  getAllActiveSessions,
  getActiveSessionsByJob,
  hasActiveSessionForJob,
  endAllActiveSessions,
  createWorkSession,
  endWorkSession,
  getTodayEarnings,
  getTodayEarningsByJob,
  isVacationDay,
  getVacationForDate,
  getActiveJobs,
  getAllJobSchedules,
  getCurrentScheduledJobs,
  createJobSession
} from '../db/operations.js';
import {
  getCurrentTime,
  getCurrentDate,
  isCurrentlyWorking,
  formatCurrency,
  getDayOfWeek,
  timeToMinutes
} from '../utils/timeUtils.js';

export const useTimeTracker = () => {
  const [settings, setSettings] = useState(null);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobSchedules, setJobSchedules] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // Backwards compatibility
  const [activeSessions, setActiveSessions] = useState([]); // Multiple sessions
  const [jobEarnings, setJobEarnings] = useState({}); // Earnings by job
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [jobConflicts, setJobConflicts] = useState([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [shouldBeWorking, setShouldBeWorking] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [pausedAutoStartJobs, setPausedAutoStartJobs] = useState(() => {
    // Load paused jobs from localStorage
    const saved = localStorage.getItem('time-tracker-paused-jobs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }); // Jobs with paused auto-start

  // NO CONFLICT DETECTION - User has total freedom
  const detectJobConflicts = useCallback((scheduledJobs) => {
    return []; // No conflicts, no restrictions, total freedom
  }, []);

  // Load initial data
  const loadData = useCallback(() => {
    console.log('🔄 Loading data from localStorage...');
    
    const userSettings = getUserSettings();
    const schedule = getWorkSchedule(); // Legacy schedule
    const jobs = getActiveJobs();
    const allJobSchedules = getAllJobSchedules();
    
    // NEW: Multiple sessions support
    const activeSession = getCurrentActiveSession(); // Backwards compatibility
    const allActiveSessions = getAllActiveSessions();
    const { totalEarnings, activeSessions, activeSessionsCount } = getTodayEarnings();
    const earningsByJob = getTodayEarningsByJob();
    
    const currentScheduledJobs = getCurrentScheduledJobs();

    console.log('📊 Loaded data:', {
      userSettings,
      legacyScheduleCount: schedule.length,
      activeJobsCount: jobs.length,
      jobSchedulesCount: allJobSchedules.length,
      hasActiveSession: !!activeSession,
      activeSessionsCount,
      totalEarnings,
      scheduledJobsNow: currentScheduledJobs.length,
      jobsWithEarnings: Object.keys(earningsByJob).length
    });

    setSettings(userSettings);
    setWorkSchedule(schedule); // Keep for legacy compatibility
    setActiveJobs(jobs);
    setJobSchedules(allJobSchedules);
    setActiveSession(activeSession); // Backwards compatibility
    setActiveSessions(allActiveSessions);
    setJobEarnings(earningsByJob);
    setTodayEarnings(totalEarnings);
    setIsWorking(allActiveSessions.length > 0); // Working if ANY session is active
    setScheduledJobs(currentScheduledJobs);
    
    // NO CONFLICTS - User has total freedom
    setJobConflicts([]); // No conflicts, no restrictions
    
    // LIBERTAD TOTAL - No restrictions, no conflicts, no schedule checks
    console.log('🎯 LIBERTAD TOTAL - Usuario puede trabajar cuando quiera');
    setShouldBeWorking(true); // Always allow work
  }, [detectJobConflicts]);

  // Start work session (Legacy - for backwards compatibility)
  const startWork = useCallback(async (customStartTime = null, isAutoStarted = false) => {
    // If there are active jobs, redirect to job-specific start
    if (activeJobs.length > 0) {
      console.log('⚠️ Please use startJobWork() for job-specific sessions. Active jobs:', activeJobs.length);
      return;
    }

    if (!settings) return;

    try {
      const currentDate = getCurrentDate();
      const startTime = customStartTime || getCurrentTime();
      
      console.log('🚀 Starting legacy work session:', { startTime, currentDate, rate: settings.hourly_rate, isAutoStarted });
      
      const sessionId = createWorkSession(currentDate, startTime, settings.hourly_rate, isAutoStarted);
      
      // Refresh data instead of setting individual states
      loadData();
    } catch (error) {
      console.error('Error starting work session:', error);
    }
  }, [settings, activeJobs, loadData]);

  // NEW: Start work session for specific job
  const startJobWork = useCallback(async (jobId, customStartTime = null, isAutoStarted = false) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) {
      console.error('❌ Job not found:', jobId);
      return;
    }

    // Check if this job already has an active session
    if (hasActiveSessionForJob(jobId)) {
      console.log('⚠️ Job already has an active session:', job.name);
      return;
    }
    
    // ALWAYS allow starting work - no schedule restrictions
    console.log('✅ MANUAL START ALLOWED - No schedule restrictions');
    
    try {
      const currentDate = getCurrentDate();
      const startTime = customStartTime || getCurrentTime().slice(0, 5); // Ensure HH:MM format
      
      console.log('🚀 Starting job work session:', { 
        jobName: job.name, 
        startTime, 
        currentDate, 
        rate: job.hourly_rate,
        isAutoStarted
      });
      
      const sessionId = createJobSession(jobId, currentDate, startTime, isAutoStarted);
      
      // Refresh data
      loadData();
      return sessionId;
    } catch (error) {
      console.error('Error starting job work session:', error);
    }
  }, [activeJobs, loadData]);

  // End work session (Legacy - for backwards compatibility)
  const endWork = useCallback(async () => {
    if (!activeSession) return;

    try {
      const currentTime = getCurrentTime();
      endWorkSession(activeSession.id, currentTime);
      
      console.log('⏹️ Ended legacy work session:', activeSession.id);
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error ending work session:', error);
    }
  }, [activeSession, loadData]);

  // NEW: Stop work session for specific job
  const endJobWork = useCallback(async (jobId) => {
    const activeSessions = getActiveSessionsByJob(jobId);
    if (activeSessions.length === 0) {
      console.log('⚠️ No active session for job:', jobId);
      return;
    }

    try {
      const currentTime = getCurrentTime();
      
      activeSessions.forEach(session => {
        endWorkSession(session.id, currentTime);
        console.log('⏹️ Ended job work session:', session.id);
      });
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error ending job work sessions:', error);
    }
  }, [loadData]);

  // NEW: Stop all active sessions
  const endAllWork = useCallback(async () => {
    try {
      const currentTime = getCurrentTime();
      const ended = endAllActiveSessions(currentTime);
      
      if (ended) {
        console.log('⏹️ Ended all active work sessions');
        loadData();
      } else {
        console.log('ℹ️ No active sessions to end');
      }
    } catch (error) {
      console.error('Error ending all work sessions:', error);
    }
  }, [loadData]);

  // Pause auto-start for a specific job
  const pauseAutoStart = useCallback((jobId) => {
    console.log('⏸️ Pausing auto-start for job:', jobId);
    setPausedAutoStartJobs(prev => {
      const newSet = new Set([...prev, jobId]);
      // Save to localStorage
      localStorage.setItem('time-tracker-paused-jobs', JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  // Resume auto-start for a specific job
  const resumeAutoStart = useCallback((jobId) => {
    console.log('▶️ Resuming auto-start for job:', jobId);
    setPausedAutoStartJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      // Save to localStorage
      localStorage.setItem('time-tracker-paused-jobs', JSON.stringify([...newSet]));
      return newSet;
    });
      }, []);

  // Clean up paused jobs that no longer exist
  const cleanupPausedJobs = useCallback(() => {
    const activeJobIds = activeJobs.map(job => job.id);
    const currentPausedJobs = [...pausedAutoStartJobs];
    const validPausedJobs = currentPausedJobs.filter(jobId => activeJobIds.includes(jobId));
    
    if (validPausedJobs.length !== currentPausedJobs.length) {
      console.log('🧹 Cleaning up paused jobs for deleted jobs');
      const newSet = new Set(validPausedJobs);
      localStorage.setItem('time-tracker-paused-jobs', JSON.stringify([...newSet]));
      setPausedAutoStartJobs(newSet);
    }
  }, [activeJobs, pausedAutoStartJobs]);

  // AUTO-START/STOP with manual override capability
  const checkAutoStartStop = useCallback(() => {
    const today = getCurrentDate();
    const isOnVacation = isVacationDay(today);
    const vacationInfo = getVacationForDate(today);
    
    // Don't work if on vacation
    if (isOnVacation) {
      console.log('🏖️ On vacation today:', vacationInfo?.reason || 'No reason specified');
      setShouldBeWorking(false);
      
      // Auto-stop if currently working but on vacation
      if (activeSessions.length > 0) {
        console.log('⏹️ Auto-stopping all work sessions - on vacation');
        endAllWork();
      }
      return;
    }

    // Auto-start/stop jobs based on their individual schedules
    if (activeJobs.length > 0 && jobSchedules.length > 0) {
      const currentScheduledJobs = getCurrentScheduledJobs();
      
      console.log('🕐 Job-based time check:', {
        currentTime: getCurrentTime(),
        currentDay: new Date().getDay(),
        scheduledJobsCount: currentScheduledJobs.length,
        activeJobsCount: activeJobs.length,
        activeSessionsCount: activeSessions.length
      });
      
      // Auto-start jobs that should be working (but don't have active sessions and are not paused)
      currentScheduledJobs.forEach(({ job, schedule }) => {
        if (!hasActiveSessionForJob(job.id) && !pausedAutoStartJobs.has(job.id)) {
          console.log(`⏰ AUTO-STARTING JOB: ${job.name} (scheduled: ${schedule.start_time}-${schedule.end_time})`);
          // Start from the scheduled start time, not current time
          startJobWork(job.id, schedule.start_time, true); // Pass scheduled start time and true for isAutoStarted
        } else if (pausedAutoStartJobs.has(job.id)) {
          console.log(`⏸️ SKIPPING AUTO-START: ${job.name} (paused by user)`);
        }
      });
      
      // Auto-stop jobs that are no longer scheduled (only auto-started sessions)
      const allActiveSessionsData = getAllActiveSessions();
      allActiveSessionsData.forEach(session => {
        if (session.job_id) {
          const isStillScheduled = currentScheduledJobs.some(
            ({ job }) => job.id === session.job_id
          );
          
          // Only auto-stop if it was an auto-started session AND it's no longer scheduled
          if (session.is_auto_started && !isStillScheduled) {
            console.log(`⏰ AUTO-STOPPING JOB: ${session.job_name} (no longer scheduled)`);
            endJobWork(session.job_id);
          }
        }
      });
      
      setShouldBeWorking(currentScheduledJobs.length > 0);
    }
    // Legacy auto-start/stop for non-job sessions
    else if (settings && workSchedule.length > 0) {
      const shouldWork = isCurrentlyWorking(workSchedule);
      
      console.log('🕐 Legacy time check:', {
        currentTime: getCurrentTime(),
        currentDay: getDayOfWeek(new Date()),
        shouldWork,
        isWorking,
        hasActiveSession: !!activeSession
      });
      
      setShouldBeWorking(shouldWork);

      // Auto-start legacy work
      if (shouldWork && !isWorking && !activeSession) {
        console.log('⏰ AUTO-STARTING LEGACY WORK');
        const scheduledStartTime = getTodaysWorkStartTime();
        startWork(scheduledStartTime, true); // Pass scheduled start time and true for isAutoStarted
      }
      
      // Auto-stop legacy work
      if (!shouldWork && isWorking && activeSession && !activeSession.job_id && activeSession.is_auto_started) {
        console.log('⏰ AUTO-STOPPING LEGACY WORK');
        endWork();
      }
    }
  }, [settings, workSchedule, activeJobs, jobSchedules, activeSessions, activeSession, isWorking, startJobWork, endJobWork, startWork, endWork, endAllWork]);

  // Update current time and earnings every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getCurrentTime();
      setCurrentTime(newTime);

      // Update today's earnings if actively working (multiple sessions support)
      if (isWorking && activeSessions.length > 0) {
        const { totalEarnings } = getTodayEarnings();
        const earningsByJob = getTodayEarningsByJob();
        setTodayEarnings(totalEarnings);
        setJobEarnings(earningsByJob);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, activeSessions]);

  // Check auto start/stop every minute
  useEffect(() => {
    const interval = setInterval(checkAutoStartStop, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkAutoStartStop]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check schedule on data change (but not on initial load)
  useEffect(() => {
    if (settings && workSchedule.length) {
      // Delay the auto-start check to avoid starting immediately on page load
      const timer = setTimeout(() => {
        checkAutoStartStop();
      }, 2000); // Wait 2 seconds after data loads
      
      return () => clearTimeout(timer);
    }
  }, [settings, workSchedule, checkAutoStartStop]);

  // Clean up paused jobs when active jobs change
  useEffect(() => {
    if (activeJobs.length > 0) {
      cleanupPausedJobs();
    }
  }, [activeJobs, cleanupPausedJobs]);

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data manually...');
    loadData();
  }, [loadData]);

  const formatEarnings = useCallback((amount) => {
    if (!settings) return '€0.00';
    return formatCurrency(amount, settings.currency);
  }, [settings]);

  // Get today's work start time from schedule
  const getTodaysWorkStartTime = useCallback(() => {
    if (!workSchedule.length) return null;
    
    const currentDay = getDayOfWeek(new Date());
    const todaySchedule = workSchedule.filter(s => s.day_of_week === currentDay);
    
    if (todaySchedule.length === 0) return null;
    
    // Return the earliest start time for today
    return todaySchedule.reduce((earliest, schedule) => {
      const currentStart = timeToMinutes(schedule.start_time);
      const earliestStart = timeToMinutes(earliest);
      return currentStart < earliestStart ? schedule.start_time : earliest;
    }, todaySchedule[0].start_time);
  }, [workSchedule]);

  // Start work from scheduled time (retroactive)
  const startWorkFromSchedule = useCallback(() => {
    const scheduledStartTime = getTodaysWorkStartTime();
    if (scheduledStartTime) {
      console.log('📅 Starting work from scheduled time:', scheduledStartTime);
      startWork(scheduledStartTime);
    } else {
      startWork();
    }
  }, [getTodaysWorkStartTime, startWork]);

  return {
    // State
    settings,
    workSchedule,
    activeJobs,
    jobSchedules,
    scheduledJobs,
    jobConflicts,
    activeSession, // Backwards compatibility
    activeSessions, // NEW: Multiple active sessions
    jobEarnings, // NEW: Earnings by job
    todayEarnings,
    isWorking,
    shouldBeWorking,
    currentTime,
    
    // Actions
    startWork, // Legacy
    endWork, // Legacy
    startJobWork, // NEW: Start specific job
    endJobWork, // NEW: End specific job
    endAllWork, // NEW: End all active sessions
    pauseAutoStart, // NEW: Pause auto-start for job
    resumeAutoStart, // NEW: Resume auto-start for job
    startWorkFromSchedule,
    refreshData,
    
    // Helpers
    formatEarnings,
    getTodaysWorkStartTime,
    hasSettings: !!settings,
    hasSchedule: workSchedule.length > 0 || activeJobs.length > 0,
    hasJobs: activeJobs.length > 0,
    hasJobConflicts: jobConflicts.length > 0,
    hasActiveSessions: activeSessions.length > 0,
    activeSessionsCount: activeSessions.length
  };
}; 