import { reverseGeocode } from '../utils/geocoding';

const ClockingLogic = {
  createClockEntry: async (userId, action, location, isLeaveDay = false) => {
    let locationName = 'Location not available';
    let latitude = null;
    let longitude = null;
    
    if (location && !isLeaveDay) {
      try {
        locationName = await reverseGeocode(location.latitude, location.longitude);
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        locationName = 'Error fetching location';
      }
    }
    
    return {
      user_id: userId,
      action: action,
      timestamp: new Date().toISOString(),
      latitude,
      longitude,
      location: locationName,
      isLeaveDay: isLeaveDay
    };
  },

  createLeaveDay: async (userId) => {
    const now = new Date();
    const clockInTime = new Date(now);
    const clockOutTime = new Date(now);
    clockOutTime.setMinutes(clockOutTime.getMinutes() + 1);

    return [
      {
        user_id: userId,
        action: 'in',
        timestamp: clockInTime.toISOString(),
        latitude: null,
        longitude: null,
        location: 'Leave Day',
        isLeaveDay: true
      },
      {
        user_id: userId,
        action: 'out',
        timestamp: clockOutTime.toISOString(),
        latitude: null,
        longitude: null,
        location: 'Leave Day',
        isLeaveDay: true
      }
    ];
  }
};

export default ClockingLogic;