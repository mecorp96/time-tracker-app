import { useState, useEffect } from 'react';
import { CalendarDays, TrendingUp, Clock, Euro, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeeklyStats, getMonthlyStats, getWorkSessions } from '../db/operations';
import { 
  getWeekRange, 
  getMonthRange, 
  formatCurrency, 
  formatHours, 
  formatDisplayDate,
  calculateHours 
} from '../utils/timeUtils';

const Stats = () => {
  const [activeTab, setActiveTab] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStats, setWeekStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [currentDate, activeTab]);

  const loadStats = () => {
    setLoading(true);

    if (activeTab === 'week') {
      const weekRange = getWeekRange(currentDate);
      const stats = getWeeklyStats(weekRange.start, weekRange.end);
      const weekSessions = getWorkSessions().filter(session => 
        session.date >= weekRange.start && session.date <= weekRange.end
      );
      
      setWeekStats({
        ...stats,
        range: weekRange
      });
      setSessions(weekSessions);
    } else {
      const monthRange = getMonthRange(currentDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const stats = getMonthlyStats(year, month);
      const monthSessions = getWorkSessions().filter(session => 
        session.date >= monthRange.start && session.date <= monthRange.end
      );
      
      setMonthStats({
        ...stats,
        range: monthRange
      });
      setSessions(monthSessions);
    }

    setLoading(false);
  };

  const navigateTime = (direction) => {
    const newDate = new Date(currentDate);
    
    if (activeTab === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getDisplayRange = () => {
    if (activeTab === 'week') {
      return weekStats ? 
        `${formatDisplayDate(weekStats.range.startDate)} - ${formatDisplayDate(weekStats.range.endDate)}` :
        '';
    } else {
      return currentDate.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const getCurrentStats = () => {
    return activeTab === 'week' ? weekStats : monthStats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getCurrentStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-600 mt-1">
          Resumen de tus horas y ganancias
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Time Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTime('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {getDisplayRange()}
            </h2>
          </div>
          
          <button
            onClick={() => navigateTime('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Euro className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ganancias Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalEarnings || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats?.totalHours || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sesiones</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {stats && stats.totalHours > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tarifa Promedio</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency((stats.totalEarnings || 0) / (stats.totalHours || 1))}/hora
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas por Sesión</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatHours((stats.totalHours || 0) / (stats.totalSessions || 1))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Sesiones de Trabajo</h3>
          </div>
          <div className="divide-y">
            {sessions.slice(0, 10).map((session) => {
              const hours = session.end_time ? 
                calculateHours(session.start_time, session.end_time) : 0;
              
              return (
                <div key={session.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {formatDisplayDate(new Date(session.date))}
                        </span>
                        {session.is_manual && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {session.start_time} - {session.end_time || 'En curso'}
                        {hours > 0 && (
                          <span className="ml-2">({formatHours(hours)})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(session.earnings || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(session.hourly_rate)}/h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {sessions.length > 10 && (
            <div className="p-4 text-center border-t">
              <span className="text-sm text-gray-600">
                Mostrando 10 de {sessions.length} sesiones
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin datos para mostrar
          </h3>
          <p className="text-gray-600">
            No hay sesiones de trabajo registradas en este período.
          </p>
        </div>
      )}
    </div>
  );
};

export default Stats; 