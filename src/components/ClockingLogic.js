import { reverseGeocode } from '../utils/geocoding';

const ClockingLogic = {
  createClockEntry: async (userId, action, location) => {
    let locationName = 'Location not available';
    let latitude = null;
    let longitude = null;
    
    if (location) {
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
      location: locationName
    };
  }
};

export default ClockingLogic;