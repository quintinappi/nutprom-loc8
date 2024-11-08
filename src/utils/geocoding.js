export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    if (data.address) {
      const suburb = data.address.suburb || data.address.town || data.address.city || data.address.village;
      const city = data.address.city || data.address.town || data.address.village;
      return suburb && city ? `${suburb}, ${city}` : city || suburb || 'Unknown location';
    }
    return 'Location not found';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Error fetching location';
  }
}