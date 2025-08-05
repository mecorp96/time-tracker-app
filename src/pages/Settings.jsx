import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Clock, Euro } from 'lucide-react';
import { getUserSettings, saveUserSettings, getWorkSchedule, saveWorkSchedule } from '../db/operations';
import { getDayName, formatTime } from '../utils/timeUtils';
import { useTimeTracker } from '../hooks/useTimeTracker';

const Settings = () => {
  const { refreshData } = useTimeTracker();
  
  const [settings, setSettings] = useState({
    hourlyRate: '',
    currency: 'EUR'
  });
  
  const [schedule, setSchedule] = useState({
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: []  // Saturday
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    
    // Load user settings
    const userSettings = getUserSettings();
    if (userSettings) {
      setSettings({
        hourlyRate: userSettings.hourly_rate.toString(),
        currency: userSettings.currency
      });
    }

    // Load work schedule
    const workSchedule = getWorkSchedule();
    const scheduleByDay = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    workSchedule.forEach(item => {
      scheduleByDay[item.day_of_week].push({
        id: item.id,
        startTime: item.start_time,
        endTime: item.end_time
      });
    });

    setSchedule(scheduleByDay);
    setLoading(false);
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTimeSlot = (dayOfWeek) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: [
        ...prev[dayOfWeek],
        {
          id: Date.now(),
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    }));
  };

  const removeTimeSlot = (dayOfWeek, index) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (dayOfWeek, index, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = async () => {
    if (!settings.hourlyRate || parseFloat(settings.hourlyRate) <= 0) {
      alert('Por favor, introduce una tarifa por hora válida');
      return;
    }

    setSaving(true);

    try {
      // Save user settings
      saveUserSettings(parseFloat(settings.hourlyRate), settings.currency);

      // Save work schedule
      const scheduleData = [];
      Object.entries(schedule).forEach(([dayOfWeek, slots]) => {
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

      saveWorkSchedule(scheduleData);
      
      // Refresh data in the time tracker
      refreshData();
      
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Configura tu tarifa por hora y horario de trabajo semanal
        </p>
      </div>

      {/* User Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Euro className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tarifa por Hora</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarifa por Hora
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={settings.hourlyRate}
              onChange={(e) => handleSettingsChange('hourlyRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="25.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingsChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Horario Semanal</h2>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 0].map(dayOfWeek => ( // Monday to Sunday
            <div key={dayOfWeek} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  {getDayName(dayOfWeek)}
                </h3>
                <button
                  onClick={() => addTimeSlot(dayOfWeek)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir tramo
                </button>
              </div>

              {schedule[dayOfWeek].length === 0 ? (
                <p className="text-sm text-gray-500 italic">Sin horario definido</p>
              ) : (
                <div className="space-y-2">
                  {schedule[dayOfWeek].map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(dayOfWeek, index, 'startTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(dayOfWeek, index, 'endTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeTimeSlot(dayOfWeek, index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-24 bg-white p-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings; 