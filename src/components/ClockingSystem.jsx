import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from 'sonner';
import { addOfflineClockEntry, getOfflineClockEntries, removeOfflineClockEntry } from '../utils/offlineSync';
import ClockingTable from './ClockingTable';
import ClockingLogic from './ClockingLogic';

const ClockingSystem = ({ 
  userId, 
  userRole, 
  onClockAction, 
  setIsLoading, 
  isOnline, 
  onStatusUpdate,
  hideHeader = false 
}) => {
  const [clockEntries, setClockEntries] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationWarning(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationWarning("Unable to get your location. Location data will not be recorded.");
          toast.warning("Location services are not available. Clocking will proceed without location data.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationWarning("Geolocation is not supported by this browser. Location data will not be recorded.");
      toast.warning("Your browser doesn't support geolocation. Clocking will proceed without location data.");
    }
  }, []);

  useEffect(() => {
    fetchClockEntries();
    const unsubscribe = onSnapshot(
      query(collection(db, 'clock_entries'), where('user_id', '==', userId), orderBy('timestamp', 'desc')),
      fetchClockEntries,
      (error) => {
        console.error('Error in realtime updates:', error);
        toast.error("Failed to get realtime updates. Please refresh the page.");
      }
    );
    return unsubscribe;
  }, [userId]);

  const fetchClockEntries = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'clock_entries'), where('user_id', '==', userId), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const offlineEntries = await getOfflineClockEntries();
      const allEntries = [...entries, ...offlineEntries].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      const uniqueEntries = removeDuplicates(allEntries);
      setClockEntries(uniqueEntries);
      updateCurrentStatus(uniqueEntries);
    } catch (error) {
      console.error('Error fetching clock entries:', error);
      toast.error("Failed to load clock entries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeDuplicates = (entries) => {
    const uniqueMap = new Map();
    entries.forEach(entry => {
      const key = `${entry.user_id}-${entry.action}-${entry.timestamp}`;
      if (!uniqueMap.has(key) || !uniqueMap.get(key).id) {
        uniqueMap.set(key, entry);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const updateCurrentStatus = (entries) => {
    if (entries.length > 0) {
      const lastEntry = entries[0];
      setCurrentStatus(lastEntry.action === 'in' ? 'Clocked In' : 'Clocked Out');
      onStatusUpdate(lastEntry.action === 'in' ? 'Clocked In' : 'Clocked Out', calculateDuration(lastEntry));
    } else {
      setCurrentStatus('Not Clocked In');
      onStatusUpdate('Not Clocked In', 0);
    }
  };

  const calculateDuration = (lastEntry) => {
    if (lastEntry.action === 'in') {
      const clockInTime = new Date(lastEntry.timestamp);
      const now = new Date();
      return (now - clockInTime) / (1000 * 60 * 60); // Convert to hours
    }
    return 0;
  };

  const handleClock = async (action) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const clockEntry = await ClockingLogic.createClockEntry(userId, action, location);
      
      if (isOnline) {
        await addDoc(collection(db, 'clock_entries'), clockEntry);
      } else {
        await addOfflineClockEntry(clockEntry);
      }

      setCurrentStatus(action === 'in' ? 'Clocked In' : 'Clocked Out');
      onClockAction(action);
      
      const successMessage = isOnline
        ? `Successfully clocked ${action}`
        : `Clocked ${action} (saved offline)`;
      toast.success(successMessage);

      if (!location) {
        toast.warning("Clocked without location data. Please enable location services if possible.");
      }

    } catch (error) {
      console.error('Error clocking in/out:', error);
      toast.error("Failed to clock in/out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {!hideHeader && <h2 className="text-2xl font-bold mb-4">Clocking System</h2>}
      <div className="space-y-4">
        <div className="flex justify-center mb-6 space-x-4">
          {currentStatus === 'Clocked Out' || currentStatus === 'Not Clocked In' ? (
            <Button onClick={() => handleClock('in')} size="lg" className="px-8 py-4 text-lg">
              Clock In
            </Button>
          ) : (
            <Button onClick={() => handleClock('out')} size="lg" className="px-8 py-4 text-lg">
              Clock Out
            </Button>
          )}
        </div>
        {currentStatus && (
          <Alert className="mb-4">
            <AlertDescription>Current Status: {currentStatus}</AlertDescription>
          </Alert>
        )}
        {locationWarning && (
          <Alert variant="warning" className="mb-4">
            <AlertDescription>{locationWarning}</AlertDescription>
          </Alert>
        )}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="clock-history">
            <AccordionTrigger className="text-xl font-semibold">My clocking history</AccordionTrigger>
            <AccordionContent>
              <ClockingTable entries={clockEntries} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ClockingSystem;