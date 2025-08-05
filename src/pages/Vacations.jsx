import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit3, Trash2, Save, X, Plane, MapPin, Heart, Briefcase } from 'lucide-react';
import { 
  getVacations, 
  createVacation, 
  updateVacation, 
  deleteVacation, 
  getVacationStats 
} from '../db/operations';
import { formatDisplayDate, getCurrentDate } from '../utils/timeUtils';

const Vacations = () => {
  const [vacations, setVacations] = useState([]);
  const [stats, setStats] = useState({ totalDays: 0, totalPeriods: 0, byType: {}, vacations: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVacation, setEditingVacation] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [formData, setFormData] = useState({
    start_date: getCurrentDate(),
    end_date: getCurrentDate(),
    reason: '',
    type: 'vacation'
  });

  const vacationTypes = [
    { value: 'vacation', label: 'Vacaciones', icon: Plane, color: 'bg-blue-100 text-blue-800' },
    { value: 'sick', label: 'Baja médica', icon: Heart, color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Asunto personal', icon: MapPin, color: 'bg-purple-100 text-purple-800' },
    { value: 'training', label: 'Formación', icon: Briefcase, color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = () => {
    setLoading(true);
    const allVacations = getVacations();
    const yearStats = getVacationStats(selectedYear);
    
    setVacations(allVacations);
    setStats(yearStats);
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!formData.start_date || !formData.end_date) {
      alert('Por favor, completa las fechas');
      return;
    }

    if (formData.start_date > formData.end_date) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    if (editingVacation) {
      updateVacation(
        editingVacation.id,
        formData.start_date,
        formData.end_date,
        formData.reason.trim(),
        formData.type
      );
    } else {
      createVacation(
        formData.start_date,
        formData.end_date,
        formData.reason.trim(),
        formData.type
      );
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      start_date: getCurrentDate(),
      end_date: getCurrentDate(),
      reason: '',
      type: 'vacation'
    });
    setShowAddForm(false);
    setEditingVacation(null);
  };

  const handleEdit = (vacation) => {
    setFormData({
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      reason: vacation.reason,
      type: vacation.type
    });
    setEditingVacation(vacation);
    setShowAddForm(true);
  };

  const handleDelete = (vacationId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar estas vacaciones?')) {
      deleteVacation(vacationId);
      loadData();
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTypeInfo = (type) => {
    return vacationTypes.find(t => t.value === type) || vacationTypes[0];
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      years.push(year);
    }
    return years;
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Vacaciones</h1>
          <p className="text-gray-600 mt-1">
            Planifica y registra tus períodos de descanso
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {generateYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Vacación
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-100" />
            <div>
              <div className="text-2xl font-bold">{stats.totalDays}</div>
              <div className="text-blue-100 text-sm">Días totales</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <Plane className="h-8 w-8 text-green-100" />
            <div>
              <div className="text-2xl font-bold">{stats.byType.vacation || 0}</div>
              <div className="text-green-100 text-sm">Días vacaciones</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-purple-100" />
            <div>
              <div className="text-2xl font-bold">{stats.totalPeriods}</div>
              <div className="text-purple-100 text-sm">Períodos</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-amber-100" />
            <div>
              <div className="text-2xl font-bold">{stats.byType.sick || 0}</div>
              <div className="text-amber-100 text-sm">Días médicos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingVacation ? 'Editar Vacación' : 'Nueva Vacación'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {vacationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo/Descripción (opcional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              placeholder="Ej: Viaje a la playa, visita familiar, curso de formación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {formData.start_date && formData.end_date && formData.start_date <= formData.end_date && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Duración:</strong> {calculateDays(formData.start_date, formData.end_date)} día{calculateDays(formData.start_date, formData.end_date) > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingVacation ? 'Actualizar' : 'Guardar'}
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

      {/* Vacations List */}
      {stats.vacations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin vacaciones registradas</h3>
          <p className="text-gray-600">
            No hay vacaciones registradas para el año {selectedYear}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Vacaciones {selectedYear} ({stats.vacations.length} período{stats.vacations.length > 1 ? 's' : ''})
            </h3>
          </div>
          
          <div className="divide-y">
            {stats.vacations.map(vacation => {
              const typeInfo = getTypeInfo(vacation.type);
              const Icon = typeInfo.icon;
              const days = calculateDays(vacation.start_date, vacation.end_date);
              
              return (
                <div key={vacation.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{typeInfo.label}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
                            {days} día{days > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Desde:</strong> {formatDisplayDate(new Date(vacation.start_date + 'T00:00:00'))} 
                          <span className="mx-2">•</span>
                          <strong>Hasta:</strong> {formatDisplayDate(new Date(vacation.end_date + 'T00:00:00'))}
                        </div>
                        
                        {vacation.reason && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <strong>Motivo:</strong> {vacation.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(vacation)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar vacación"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(vacation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar vacación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      {Object.keys(stats.byType).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose por Tipo</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, days]) => {
              const typeInfo = getTypeInfo(type);
              const Icon = typeInfo.icon;
              
              return (
                <div key={type} className="text-center p-4 rounded-lg border">
                  <div className={`inline-flex p-3 rounded-lg ${typeInfo.color} mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{days}</div>
                  <div className="text-sm text-gray-600">{typeInfo.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vacations; 