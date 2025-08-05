import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Edit3, AlertCircle, CheckCircle, Clock, Plane, Briefcase, Square, Timer } from 'lucide-react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { formatDisplayTime, formatHours, calculateHours, getCurrentTime, getCurrentDate, formatCurrency } from '../utils/timeUtils';
import { getWorkSessions, getVacationForDate, getCurrentScheduledJobs, getActiveJobs, createJobSession } from '../db/operations';

const Home = () => {
  const navigate = useNavigate();
  const {
    settings,
    workSchedule,
    activeJobs: hookActiveJobs,
    scheduledJobs: hookScheduledJobs,
    jobConflicts: hookJobConflicts,
    activeSession,
    activeSessions,
    jobEarnings,
    todayEarnings,
    isWorking,
    shouldBeWorking,
    currentTime,
    startWork,
    endWork,
    startJobWork: hookStartJobWork,
    endJobWork: hookEndJobWork,
    endAllWork: hookEndAllWork,
    pauseAutoStart,
    resumeAutoStart,
    startWorkFromSchedule,
    getTodaysWorkStartTime,
    formatEarnings,
    hasSchedule,
    hasJobs,
    hasJobConflicts,
    hasActiveSessions,
    activeSessionsCount,
    refreshData
  } = useTimeTracker();





  const directStartJob = (jobId) => {
    console.log('🚀 directStartJob called with jobId:', jobId);
    const result = hookStartJobWork(jobId, null, false); // Explicitly pass false for isAutoStarted
    console.log('🚀 Direct start result:', result);
    return result;
  };

  const startJobFromSchedule = (jobId) => {
    console.log('⏰ startJobFromSchedule called for:', jobId);
    // Get current scheduled jobs to find the start time
    const currentScheduledJobs = getCurrentScheduledJobs();
    const scheduledJob = currentScheduledJobs.find(({ job }) => job.id === jobId);
    
    if (scheduledJob) {
      console.log('⏰ Starting from scheduled time:', scheduledJob.schedule.start_time);
      hookStartJobWork(jobId, scheduledJob.schedule.start_time, false); // Start from scheduled time but not auto-started
    } else {
      console.log('⏰ No schedule found, starting from current time');
      // Fallback: start from current time if no schedule found
      directStartJob(jobId);
    }
  };

  const getJobScheduleForNow = (jobId) => {
    const currentScheduledJobs = getCurrentScheduledJobs();
    return currentScheduledJobs.find(({ job }) => job.id === jobId);
  };

  const cancelAutoStart = (jobId) => {
    console.log('🚫 cancelAutoStart called with jobId:', jobId);
    
    // Find the active session for this job
    const jobSession = activeSessions.find(s => s.job_id === jobId);
    if (jobSession) {
      console.log('🚫 Found active session to cancel:', jobSession);
      // Stop the auto-started session
      hookEndJobWork(jobId);
    }
    
    // Pause auto-start for this job to prevent it from restarting
    pauseAutoStart(jobId);
    
    // Refresh data to update UI
    refreshData();
  };



  // Show jobs requirement if no jobs are configured
  if (!hasJobs) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Configuración Requerida
        </h2>
        <p className="text-gray-600 mb-6">
          Necesitas configurar trabajos con sus tarifas y horarios antes de comenzar.
        </p>
        <div className="space-y-3">
          <a
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Configurar Trabajos
          </a>
        </div>
      </div>
    );
  }

  const currentSessionHours = activeSession 
    ? calculateHours(activeSession.start_time, currentTime)
    : 0;

  const currentSessionEarnings = activeSession
    ? currentSessionHours * activeSession.hourly_rate
    : 0;

  return (
    <div className="space-y-6">
      {/* Today's Earnings */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Ganancias de Hoy</h2>
        <div className="text-3xl font-bold mb-2">
          {formatEarnings(todayEarnings)}
        </div>
        {hasActiveSessions && (
          <div className="text-blue-100 text-sm space-y-1">
            <div>Sesiones activas: {activeSessionsCount}</div>
            {activeSessions.map((session, index) => {
              const sessionHours = calculateHours(session.start_time, currentTime);
              const sessionEarnings = sessionHours * session.hourly_rate;
              return (
                <div key={session.id || index} className="text-xs">
                  {session.job_name || 'Trabajo Principal'}: {formatEarnings(sessionEarnings)} 
                  ({formatHours(sessionHours)})
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GESTIÓN DE TRABAJOS - MAIN FOCUS */}
      {hasJobs && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestión de Trabajos
                {hasActiveSessions && (
                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {activeSessionsCount} activos
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {hasActiveSessions && (
                  <button
                    onClick={hookEndAllWork}
                    className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Parar Todos
                  </button>
                )}
                <button
                  onClick={() => navigate('/jobs')}
                  className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Gestionar
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {Object.values(jobEarnings).map((job) => {
              const jobConfig = hookActiveJobs.find(j => j.id === job.jobId);
              return (
                <div key={job.jobId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{backgroundColor: jobConfig?.color || '#6B7280'}}
                      ></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{job.jobName}</h4>
                        <p className="text-sm text-gray-500">
                          €{jobConfig?.hourly_rate || 0}/hora
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatEarnings(job.totalEarnings)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {job.completedSessions} sesiones
                      </p>
                    </div>
                  </div>

                  {/* Job Status and Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${job.activeSession ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-600">
                        {job.activeSession ? (
                          <>
                            Trabajando desde {job.activeSession.start_time}
                            <span className="ml-2 text-xs text-green-600">
                              ({formatHours(calculateHours(job.activeSession.start_time, currentTime))})
                            </span>
                          </>
                        ) : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {job.activeSession ? (
                        <button
                          onClick={() => {
                            console.log('🔴 Stop button clicked for job:', job.jobId);
                            hookEndJobWork(job.jobId);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <Square className="h-3 w-3" />
                          <span>Parar</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => directStartJob(job.jobId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                          >
                            <Play className="h-3 w-3" />
                            <span>Ahora</span>
                          </button>
                          {(() => {
                            const scheduleInfo = getJobScheduleForNow(job.jobId);
                            return scheduleInfo ? (
                              <button
                                onClick={() => startJobFromSchedule(job.jobId)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                              >
                                <Timer className="h-3 w-3" />
                                <span>Desde {scheduleInfo.schedule.start_time}</span>
                              </button>
                            ) : null;
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add quick start for jobs not currently earning */}
            {hookActiveJobs.filter(job => !jobEarnings[job.id]).map((job) => (
              <div key={job.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{backgroundColor: job.color || '#6B7280'}}
                    ></div>
                    <div>
                      <h4 className="font-semibold text-gray-700">{job.name}</h4>
                      <p className="text-sm text-gray-500">€{job.hourly_rate}/hora • Sin actividad hoy</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => directStartJob(job.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Play className="h-3 w-3" />
                      <span>Ahora</span>
                    </button>
                    {(() => {
                      const scheduleInfo = getJobScheduleForNow(job.id);
                      return scheduleInfo ? (
                        <button
                          onClick={() => startJobFromSchedule(job.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <Timer className="h-3 w-3" />
                          <span>Desde {scheduleInfo.schedule.start_time}</span>
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Jobs Info */}
      {hookScheduledJobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Trabajos Programados para Ahora
          </h3>
          <div className="space-y-3">
            {hookScheduledJobs.map((scheduledJob, index) => {
              const isActive = activeSessions.some(s => s.job_id === scheduledJob.job.id);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: scheduledJob.job.color }}
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {scheduledJob.job.name}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono">
                          {scheduledJob.schedule.start_time} - {scheduledJob.schedule.end_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-green-600">
                        €{scheduledJob.job.hourly_rate}/h
                      </div>
                    </div>
                    {isActive ? (
                      <div className="flex space-x-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Activo
                        </span>
                        <button
                          onClick={() => {
                            console.log('🔴 Cancel button clicked for job:', scheduledJob.job.id);
                            cancelAutoStart(scheduledJob.job.id);
                          }}
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                          title="Cancelar auto-inicio"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => directStartJob(scheduledJob.job.id)}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            💡 Los trabajos se inician automáticamente según su horario. Puedes iniciarlos manualmente en cualquier momento.
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center">
        <a
          href="/sessions"
          className="flex items-center justify-center px-6 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Sesiones
        </a>
      </div>

    </div>
  );
};

export default Home; 