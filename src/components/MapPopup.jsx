import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Add this new component to handle map updates
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      console.log('Updating map center to:', center); // Debug log
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
};

const MapPopup = ({ isOpen, onClose, location, coordinates }) => {
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    console.log('MapPopup received coordinates:', coordinates); // Debug log
    if (coordinates?.latitude && coordinates?.longitude) {
      const center = [coordinates.latitude, coordinates.longitude];
      console.log('Setting map center to:', center); // Debug log
      setMapCenter(center);
    }
  }, [coordinates]);

  if (!isOpen || !mapCenter) {
    console.log('MapPopup not rendering. isOpen:', isOpen, 'mapCenter:', mapCenter); // Debug log
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-lg overflow-hidden w-full max-w-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <p className="text-gray-600 mb-4">{location}</p>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <MapUpdater center={mapCenter} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={mapCenter}>
                  <Popup>{location}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapPopup;