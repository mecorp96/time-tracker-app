import { useState, useEffect } from 'react';
import { Calendar, Clock, Euro, Edit3, Trash2, Plus, Save, X } from 'lucide-react';
import { 
  getWorkSessions, 
  deleteWorkSession, 
  updateWorkSession,
  createWorkSession,
  getUserSettings 
} from '../db/operations';
import { 
  formatDisplayDate, 
  formatCurrency, 
  formatHours, 
  calculateHours,
  getCurrentDate 
} from '../utils/timeUtils';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [settings, setSettings] = useState(null);

  // New session form
  const [newSession, setNewSession] = useState({
    date: getCurrentDate(),
    start_time: '09:00',
    end_time: '17:00'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    const allSessions = getWorkSessions();
    const userSettings = getUserSettings();
    setSessions(allSessions);
    setSettings(userSettings);
    setLoading(false);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sesión?')) {
      deleteWorkSession(sessionId);
      loadData();
    }
  };

  const handleEditSession = (session) => {
    setEditingSession({
      ...session,
      original_start_time: session.start_time,
      original_end_time: session.end_time
    });
  };

  const handleSaveEdit = () => {
    if (!editingSession.start_time || !editingSession.end_time) {
      alert('Por favor, completa todos los campos');
      return;
    }

    if (editingSession.start_time >= editingSession.end_time) {
      alert('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    updateWorkSession(
      editingSession.id,
      editingSession.start_time,
      editingSession.end_time,
      true // Mark as manually edited
    );

    setEditingSession(null);
    loadData();
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
  };

  const handleAddSession = () => {
    if (!newSession.date || !newSession.start_time || !newSession.end_time) {
      alert('Por favor, completa todos los campos');
      return;
    }

    if (newSession.start_time >= newSession.end_time) {
      alert('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    if (!settings) {
      alert('No hay configuración de tarifa. Ve a Configuración primero.');
      return;
    }

    // Create session and immediately end it
    const sessionId = createWorkSession(newSession.date, newSession.start_time, settings.hourly_rate);
    updateWorkSession(sessionId, newSession.start_time, newSession.end_time, true);

    setShowAddForm(false);
    setNewSession({
      date: getCurrentDate(),
      start_time: '09:00',
      end_time: '17:00'
    });
    loadData();
  };

  const groupSessionsByDate = (sessions) => {
    const grouped = {};
    sessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    return grouped;
  };

  const calculateDayTotal = (daySessions) => {
    return daySessions.reduce((total, session) => {
      return total + (session.earnings || 0);
    }, 0);
  };

  const calculateDayHours = (daySessions) => {
    return daySessions.reduce((total, session) => {
      if (session.end_time) {
        return total + calculateHours(session.start_time, session.end_time);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate(sessions);
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Sesiones</h1>
          <p className="text-gray-600 mt-1">
            Edita, elimina o agrega sesiones de trabajo manualmente
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Sesión
        </button>
      </div>

      {/* Add Session Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Sesión Manual</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora Inicio</label>
              <input
                type="time"
                value={newSession.start_time}
                onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora Fin</label>
              <input
                type="time"
                value={newSession.end_time}
                onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={handleAddSession}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Sesión
            </button>
            
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin sesiones registradas</h3>
          <p className="text-gray-600">
            No hay sesiones de trabajo registradas aún.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const daySessions = groupedSessions[date];
            const dayTotal = calculateDayTotal(daySessions);
            const dayHours = calculateDayHours(daySessions);
            
            return (
              <div key={date} className="bg-white rounded-xl shadow-sm border">
                {/* Day Header */}
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {formatDisplayDate(new Date(date + 'T00:00:00'))}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatHours(dayHours)}</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(dayTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sessions */}
                <div className="divide-y">
                  {daySessions.map(session => (
                    <div key={session.id} className="p-4">
                      {editingSession && editingSession.id === session.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora Inicio</label>
                              <input
                                type="time"
                                value={editingSession.start_time}
                                onChange={(e) => setEditingSession(prev => ({ 
                                  ...prev, 
                                  start_time: e.target.value 
                                }))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora Fin</label>
                              <input
                                type="time"
                                value={editingSession.end_time || ''}
                                onChange={(e) => setEditingSession(prev => ({ 
                                  ...prev, 
                                  end_time: e.target.value 
                                }))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="font-mono text-sm">
                                {session.start_time} - {session.end_time || 'En curso'}
                              </span>
                            </div>
                            
                            {session.end_time && (
                              <span className="text-sm text-gray-600">
                                ({formatHours(calculateHours(session.start_time, session.end_time))})
                              </span>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              {session.is_manual === 1 && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                  Manual
                                </span>
                              )}
                              
                              {!session.end_time && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Activa
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(session.earnings || 0)}
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditSession(session)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar sesión"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar sesión"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {sessions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Resumen Total</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sessions.length}
              </div>
              <div className="text-blue-100 text-sm">Sesiones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatHours(sessions.reduce((total, session) => {
                  if (session.end_time) {
                    return total + calculateHours(session.start_time, session.end_time);
                  }
                  return total;
                }, 0))}
              </div>
              <div className="text-blue-100 text-sm">Horas Totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(sessions.reduce((total, session) => total + (session.earnings || 0), 0))}
              </div>
              <div className="text-blue-100 text-sm">Ganancias Totales</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions; 