// Timezone utilities for IST (Indian Standard Time)
// 
// TIME SOURCES:
// 1. Browser/Client: new Date() - Gets current system time
// 2. Server: process.env.TZ = 'Asia/Kolkata' - Server timezone set in server.js
// 3. Database: MongoDB stores UTC timestamps, converted to IST for display
// 4. API: All date/time responses converted to IST before sending to client
//
// WHERE TIME IS FETCHED FROM:
// - Frontend: Browser's system time converted to IST
// - Backend: Server time (set to IST timezone)
// - Database: UTC timestamps converted to IST for display
// - Events: Event start/end times stored in UTC, displayed in IST

export const IST_TIMEZONE = 'Asia/Kolkata';

// Convert UTC date to IST
export const toIST = (utcDate) => {
  if (!utcDate) return null;
  return new Date(utcDate).toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // 24-hour format
  });
};

// Format date in IST
export const formatDateIST = (dateString) => {
  if (!dateString) return 'Not provided';
  return new Date(dateString).toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time in IST
export const formatTimeIST = (dateString) => {
  if (!dateString) return 'Not provided';
  return new Date(dateString).toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format
  });
};

// Format date and time in IST
export const formatDateTimeIST = (dateString) => {
  if (!dateString) return 'Not provided';
  return new Date(dateString).toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format
  });
};

// Get current IST time
export const getCurrentIST = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // 24-hour format
  });
};

// Check if event is happening now (within 15 minutes) in IST
export const isEventHappeningNow = (startTime) => {
  if (!startTime) return false;
  
  const now = new Date();
  const eventStart = new Date(startTime);
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
  
  return now <= eventStart && eventStart <= fifteenMinutesFromNow;
};

// Get time difference in IST
export const getTimeDifferenceIST = (dateString) => {
  if (!dateString) return 'Not provided';
  
  const now = new Date();
  const eventDate = new Date(dateString);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins <= 0) {
    return 'Event started';
  } else if (diffMins <= 15) {
    return `Starting in ${diffMins} minutes`;
  } else if (diffMins < 60) {
    return `Starting in ${diffMins} minutes`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `Starting in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `Starting in ${days} day${days > 1 ? 's' : ''}`;
  }
};

// Format relative time in IST
export const formatRelativeTimeIST = (dateString) => {
  if (!dateString) return 'Not provided';
  
  const now = new Date();
  const eventDate = new Date(dateString);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins <= 0) {
    return 'Event started';
  } else if (diffMins <= 15) {
    return `Starting in ${diffMins} minutes`;
  } else {
    return formatDateTimeIST(dateString);
  }
};
