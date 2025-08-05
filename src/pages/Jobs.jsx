import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit3, Trash2, Save, X, Clock, Euro, Palette, Eye, EyeOff, Calendar } from 'lucide-react';
import { 
  getJobs, 
  createJob, 
  updateJob, 
  deleteJob,
  getJobSchedule,
  saveJobSchedule,
  getJobStats,
  getSessionsByJob
} from '../db/operations';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    hourly_rate: '',
    color: '#3B82F6',
    is_active: true
  });

  // Schedule state
  const [jobSchedule, setJobSchedule] = useState({
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: []  // Saturday
  });

  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allJobs = getJobs();
    
    // Get stats for each job
    const jobsWithStats = await Promise.all(
      allJobs.map(async (job) => {
        const stats = getJobStats(job.id);
        const recentSessions = getSessionsByJob(job.id).slice(0, 3);
        return {
          ...job,
          stats,
          recentSessions
        };
      })
    );
    
    setJobs(jobsWithStats);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      hourly_rate: '',
      color: '#3B82F6',
      is_active: true
    });
    setShowAddForm(false);
    setEditingJob(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Por favor, ingresa el nombre del trabajo');
      return;
    }

    if (!formData.hourly_rate || formData.hourly_rate <= 0) {
      alert('Por favor, ingresa una tarifa válida');
      return;
    }

    try {
      if (editingJob) {
        updateJob(
          editingJob.id,
          formData.name,
          parseFloat(formData.hourly_rate),
          formData.color,
          formData.is_active
        );
      } else {
        createJob(
          formData.name,
          parseFloat(formData.hourly_rate),
          formData.color,
          formData.is_active
        );
      }

      resetForm();
      loadData();
      alert(editingJob ? 'Trabajo actualizado' : 'Trabajo creado correctamente');
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error al guardar el trabajo');
    }
  };

  const handleEdit = (job) => {
    setFormData({
      name: job.name,
      hourly_rate: job.hourly_rate.toString(),
      color: job.color,
      is_active: job.is_active
    });
    setEditingJob(job);
    setShowAddForm(true);
  };

  const handleDelete = (job) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${job.name}"? Esto también eliminará todas sus sesiones asociadas.`)) {
      deleteJob(job.id);
      loadData();
    }
  };

  const toggleJobStatus = (job) => {
    updateJob(job.id, job.name, job.hourly_rate, job.color, !job.is_active);
    loadData();
  };

  const openScheduleModal = (job) => {
    setShowScheduleModal(job);
    // Load existing schedule
    const schedule = getJobSchedule(job.id);
    const scheduleByDay = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    schedule.forEach(s => {
      if (!scheduleByDay[s.day_of_week]) {
        scheduleByDay[s.day_of_week] = [];
      }
      scheduleByDay[s.day_of_week].push({
        startTime: s.start_time,
        endTime: s.end_time
      });
    });
    
    setJobSchedule(scheduleByDay);
  };

  const addTimeSlot = (dayOfWeek) => {
    setJobSchedule(prev => ({
      ...prev,
      [dayOfWeek]: [...prev[dayOfWeek], { startTime: '09:00', endTime: '17:00' }]
    }));
  };

  const removeTimeSlot = (dayOfWeek, index) => {
    setJobSchedule(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (dayOfWeek, index, field, value) => {
    setJobSchedule(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const saveSchedule = () => {
    if (!showScheduleModal) return;

    const scheduleData = [];
    Object.entries(jobSchedule).forEach(([dayOfWeek, slots]) => {
      slots.forEach(slot => {
        if (slot.startTime && slot.endTime) {
          scheduleData.push({
            dayOfWeek: parseInt(dayOfWeek),
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      });
    });

    saveJobSchedule(showScheduleModal.id, scheduleData);
    setShowScheduleModal(null);
    loadData();
    alert('Horario guardado correctamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Trabajos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona múltiples trabajos con horarios y tarifas independientes
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Trabajo
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingJob ? 'Editar Trabajo' : 'Nuevo Trabajo'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Trabajo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Trabajo Principal, Freelance, Proyecto X"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa por Hora (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                placeholder="25.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Identificativo
            </label>
            <div className="flex items-center space-x-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Trabajo activo</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingJob ? 'Actualizar' : 'Crear Trabajo'}
            </button>
            
            <button
              onClick={resetForm}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin trabajos registrados</h3>
          <p className="text-gray-600">
            Crea tu primer trabajo para comenzar a hacer seguimiento de múltiples proyectos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border">
              {/* Job Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full mt-1"
                      style={{ backgroundColor: job.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{job.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Euro className="h-3 w-3 mr-1" />
                          {job.hourly_rate}/hora
                        </span>
                        <span className="flex items-center">
                          {job.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1 text-green-600" />
                              Activo
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1 text-gray-400" />
                              Inactivo
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openScheduleModal(job)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Configurar horario"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleJobStatus(job)}
                      className={`p-2 rounded-lg transition-colors ${
                        job.is_active 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={job.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {job.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(job)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar trabajo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(job)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar trabajo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Stats */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      €{job.stats.totalEarnings.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Ganancias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {job.stats.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500">Horas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {job.stats.totalSessions}
                    </div>
                    <div className="text-xs text-gray-500">Sesiones</div>
                  </div>
                </div>

                {job.recentSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sesiones Recientes</h4>
                    <div className="space-y-1">
                      {job.recentSessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{session.date}</span>
                          <span>{session.start_time} - {session.end_time || 'En curso'}</span>
                          <span className="font-medium">€{(session.earnings || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Horario de {showScheduleModal.name}
                </h3>
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {dayNames.map((dayName, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{dayName}</h4>
                      <button
                        onClick={() => addTimeSlot(dayIndex)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Agregar horario
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {jobSchedule[dayIndex].map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-3">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {jobSchedule[dayIndex].length === 0 && (
                        <div className="text-sm text-gray-500 italic">Sin horario configurado</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={saveSchedule}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Horario
                </button>
                
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs; 