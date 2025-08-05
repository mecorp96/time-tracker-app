import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date) => {
  return format(date, 'dd/MM/yyyy', { locale: es });
};

export const formatDisplayTime = (timeString) => {
  return timeString;
};

export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const getCurrentTime = () => {
  const now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
};

export const getCurrentDate = () => {
  return formatDate(new Date());
};

export const getDayOfWeek = (date = new Date()) => {
  return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
};

export const getDayName = (dayOfWeek) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek];
};

export const isCurrentlyWorking = (workSchedule) => {
  const now = new Date();
  const currentDay = getDayOfWeek(now);
  const currentTime = getCurrentTime();
  
  return workSchedule.some(schedule => {
    if (schedule.day_of_week !== currentDay) return false;
    
    return isTimeInRange(currentTime, schedule.start_time, schedule.end_time);
  });
};

export const isTimeInRange = (currentTime, startTime, endTime) => {
  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  // Handle overnight schedules (e.g., 22:00 - 06:00)
  if (start > end) {
    return current >= start || current <= end;
  }
  
  return current >= start && current <= end;
};

export const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return formatTime(hours, mins);
};

export const calculateHours = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // Handle overnight work
  if (end < start) {
    end += 24 * 60; // Add 24 hours
  }
  
  return (end - start) / 60;
};

export const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0) {
    return `${m}m`;
  } else if (m === 0) {
    return `${h}h`;
  } else {
    return `${h}h ${m}m`;
  }
};

export const getWeekRange = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    startDate: start,
    endDate: end
  };
};

export const getMonthRange = (date = new Date()) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    startDate: start,
    endDate: end
  };
};

export const isWorkingHours = (workSchedule, date = new Date()) => {
  const dayOfWeek = getDayOfWeek(date);
  const currentTime = getCurrentTime();
  
  const todaySchedule = workSchedule.filter(schedule => 
    schedule.day_of_week === dayOfWeek
  );
  
  return todaySchedule.some(schedule => 
    isTimeInRange(currentTime, schedule.start_time, schedule.end_time)
  );
};

export const getNextWorkSession = (workSchedule) => {
  const now = new Date();
  const currentDay = getDayOfWeek(now);
  const currentTime = getCurrentTime();
  
  // Check if there's a work session today after current time
  const todaySchedule = workSchedule
    .filter(schedule => schedule.day_of_week === currentDay)
    .filter(schedule => timeToMinutes(schedule.start_time) > timeToMinutes(currentTime))
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  
  if (todaySchedule.length > 0) {
    return {
      day: getDayName(currentDay),
      time: todaySchedule[0].start_time,
      isToday: true
    };
  }
  
  // Look for next working day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextDaySchedule = workSchedule
      .filter(schedule => schedule.day_of_week === nextDay)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    
    if (nextDaySchedule.length > 0) {
      return {
        day: getDayName(nextDay),
        time: nextDaySchedule[0].start_time,
        isToday: false
      };
    }
  }
  
  return null;
}; 