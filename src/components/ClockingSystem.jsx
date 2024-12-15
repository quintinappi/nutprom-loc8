import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs, limit, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import { addOfflineClockEntry, getOfflineClockEntries, removeOfflineClockEntry } from '../utils/offlineSync';
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
  const [currentStatus, setCurrentStatus] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);
  const [isLeaveDay, setIsLeaveDay] = useState(false);

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
    // Listen for leave day changes in real-time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const leaveQuery = query(
      collection(db, 'clock_entries'),
      where('user_id', '==', userId),
      where('timestamp', '>=', today.toISOString()),
      where('timestamp', '<', tomorrow.toISOString()),
      where('isLeaveDay', '==', true)
    );

    const unsubscribe = onSnapshot(leaveQuery, (snapshot) => {
      setIsLeaveDay(!snapshot.empty);
    }, (error) => {
      console.error('Error in leave day updates:', error);
      toast.error("Failed to get leave day status updates");
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'clock_entries'), where('user_id', '==', userId), orderBy('timestamp', 'desc'), limit(1)),
      async (snapshot) => {
        if (!snapshot.empty) {
          const lastEntry = snapshot.docs[0].data();
          const status = lastEntry.action === 'in' ? 'Clocked In' : 'Clocked Out';
          setCurrentStatus(status);
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }
        } else {
          setCurrentStatus('Clocked Out');
          if (onStatusUpdate) {
            onStatusUpdate('Clocked Out');
          }
        }
      },
      (error) => {
        console.error('Error in realtime updates:', error);
        toast.error("Failed to get realtime updates. Please refresh the page.");
      }
    );
    return unsubscribe;
  }, [userId, onStatusUpdate]);

  const handleClockAction = async (action) => {
    try {
      setIsLoading(true);

      const clockEntry = await ClockingLogic.createClockEntry(userId, action, location);

      if (isOnline) {
        await addDoc(collection(db, 'clock_entries'), clockEntry);
        toast.success(`Successfully clocked ${action}`);
      } else {
        await addOfflineClockEntry(clockEntry);
        toast.success(`Clocked ${action} (offline mode)`);
      }

      if (onClockAction) {
        onClockAction(action);
      }
    } catch (error) {
      console.error('Error clocking in/out:', error);
      toast.error(`Failed to clock ${action}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookLeave = async () => {
    try {
      setIsLoading(true);

      const leaveEntries = await ClockingLogic.createLeaveDay(userId);

      if (isOnline) {
        const batch = writeBatch(db);
        leaveEntries.forEach(entry => {
          const docRef = doc(collection(db, 'clock_entries'));
          batch.set(docRef, entry);
        });
        await batch.commit();
        setIsLeaveDay(true);
        toast.success('Leave day booked successfully');
      } else {
        for (const entry of leaveEntries) {
          await addOfflineClockEntry(entry);
        }
        setIsLeaveDay(true);
        toast.success('Leave day booked (offline mode)');
      }

      if (onClockAction) {
        onClockAction('leave');
      }
    } catch (error) {
      console.error('Error booking leave:', error);
      toast.error('Failed to book leave. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {locationWarning && (
        <Alert variant="warning">
          <AlertDescription>{locationWarning}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Current Status: {isLeaveDay ? 'Leave Day Booked' : currentStatus}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            size="lg"
            onClick={() => handleClockAction('in')}
            disabled={currentStatus === 'Clocked In' || isLeaveDay}
            className="w-32"
          >
            Clock In
          </Button>
          <Button
            size="lg"
            onClick={() => handleClockAction('out')}
            disabled={currentStatus === 'Clocked Out' || isLeaveDay}
            className="w-32"
          >
            Clock Out
          </Button>
          <Button
            size="lg"
            onClick={handleBookLeave}
            disabled={isLeaveDay}
            className="w-32"
          >
            Book Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClockingSystem;