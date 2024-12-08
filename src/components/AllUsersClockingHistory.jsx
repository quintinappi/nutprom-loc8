import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import TimePeriodTabs from './clocking-history/TimePeriodTabs';

const AllUsersClockingHistory = ({ onLocationClick }) => {
  const [shifts, setShifts] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      console.log('Fetching users...');
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = {
            name: doc.data().name || '',
            surname: doc.data().surname || '',
            email: doc.data().email || ''
          };
        });
        console.log('Users fetched:', usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users data');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      console.log('Fetching shifts...');
      try {
        setLoading(true);
        // Get start of today
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const q = query(
          collection(db, 'clock_entries'),
          where('timestamp', '>=', startDate.toISOString()),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          console.log('Received shifts snapshot');
          const entries = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Raw entries:', entries);
          
          const processedShifts = processShifts(entries);
          console.log('Processed shifts:', processedShifts);
          setShifts(processedShifts);
          setLoading(false);
        }, (error) => {
          console.error('Error in shifts snapshot:', error);
          toast.error('Failed to fetch shifts data');
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up shifts listener:', error);
        toast.error('Failed to set up shifts listener');
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const processShifts = (entries) => {
    console.log('Processing shifts from entries:', entries);
    const userShiftsMap = {};

    // Sort entries by timestamp
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    sortedEntries.forEach(entry => {
      if (!entry.user_id) {
        console.warn('Entry missing user_id:', entry);
        return;
      }

      if (!userShiftsMap[entry.user_id]) {
        userShiftsMap[entry.user_id] = {
          userId: entry.user_id,
          shifts: [],
          currentClockIn: null
        };
      }

      if (entry.action === 'in') {
        userShiftsMap[entry.user_id].currentClockIn = entry;
      } else if (entry.action === 'out' && userShiftsMap[entry.user_id].currentClockIn) {
        userShiftsMap[entry.user_id].shifts.push({
          clockIn: userShiftsMap[entry.user_id].currentClockIn.timestamp,
          clockOut: entry.timestamp,
          clockInLocation: userShiftsMap[entry.user_id].currentClockIn.location,
          clockOutLocation: entry.location,
          latitude: userShiftsMap[entry.user_id].currentClockIn.latitude,
          longitude: userShiftsMap[entry.user_id].currentClockIn.longitude,
          clockOutLatitude: entry.latitude,
          clockOutLongitude: entry.longitude,
          duration: calculateDuration(
            userShiftsMap[entry.user_id].currentClockIn.timestamp, 
            entry.timestamp
          )
        });
        userShiftsMap[entry.user_id].currentClockIn = null;
      }
    });

    // Add active shifts
    Object.values(userShiftsMap).forEach(userData => {
      if (userData.currentClockIn) {
        userData.shifts.push({
          clockIn: userData.currentClockIn.timestamp,
          clockOut: null,
          clockInLocation: userData.currentClockIn.location,
          clockOutLocation: null,
          latitude: userData.currentClockIn.latitude,
          longitude: userData.currentClockIn.longitude,
          duration: calculateDuration(userData.currentClockIn.timestamp, new Date().toISOString())
        });
      }
      // Sort shifts by clock in time, most recent first
      userData.shifts.sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn));
    });

    console.log('Final processed shifts:', userShiftsMap);
    return userShiftsMap;
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationInHours = (end - start) / (1000 * 60 * 60);
    return durationInHours > 0 ? durationInHours : null;
  };

  const getUserName = (userId) => {
    const user = users[userId] || {};
    if (user.name && user.surname) {
      return `${user.name} ${user.surname}`;
    } else if (user.email) {
      return user.email;
    }
    return 'Unknown User';
  };

  const formatLocation = (fullLocation) => {
    if (!fullLocation) return 'N/A';
    const parts = fullLocation.split(',');
    const location = parts[0].split('Ward')[0].split('Local Municipality')[0].trim();
    return location;
  };

  const handleLocationClick = (shift) => {
    console.log('Location clicked:', shift);
    if (shift.clockInLocation && shift.latitude && shift.longitude) {
      onLocationClick({
        location: shift.clockInLocation,
        coordinates: {
          latitude: parseFloat(shift.latitude),
          longitude: parseFloat(shift.longitude)
        }
      });
    } else {
      toast.error('Location data not available');
    }
  };

  const getUserStatus = (userData) => {
    const hasActiveShift = userData.shifts.some(shift => !shift.clockOut);
    return {
      isOnDuty: hasActiveShift,
      text: hasActiveShift ? 'On Duty' : 'Off Duty',
      className: hasActiveShift ? 'bg-green-50' : 'bg-red-50'
    };
  };

  const sortUserEntries = (entries) => {
    return Object.entries(entries).sort((a, b) => {
      const userA = users[a[0]] || {};
      const userB = users[b[0]] || {};
      
      const nameA = `${userA.name || ''} ${userA.surname || ''}`.trim().toLowerCase();
      const nameB = `${userB.name || ''} ${userB.surname || ''}`.trim().toLowerCase();
      
      if (nameA && nameB) {
        return nameA.localeCompare(nameB);
      }
      
      const emailA = userA.email || '';
      const emailB = userB.email || '';
      return emailA.localeCompare(emailB);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TimePeriodTabs
        shifts={shifts}
        sortUserEntries={sortUserEntries}
        getUserName={getUserName}
        getUserStatus={getUserStatus}
        formatDuration={calculateDuration}
        formatLocation={formatLocation}
        handleLocationClick={handleLocationClick}
      />
    </div>
  );
};

export default AllUsersClockingHistory;