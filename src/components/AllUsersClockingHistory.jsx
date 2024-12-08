import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import TimePeriodTabs from './clocking-history/TimePeriodTabs';

const AllUsersClockingHistory = ({ onLocationClick }) => {
  const [shifts, setShifts] = useState({});
  const [users, setUsers] = useState({});

  useEffect(() => {
    // Fetch users data
    const fetchUsers = async () => {
      console.log('Fetching users...');
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const usersData = {};
        querySnapshot.forEach((doc) => {
          usersData[doc.id] = {
            name: doc.data().name || '',
            surname: doc.data().surname || '',
            email: doc.data().email || ''
          };
        });
        console.log('Users fetched:', usersData);
        setUsers(usersData);
      }, (error) => {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users data');
      });
      return unsubscribe;
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      console.log('Fetching shifts...');
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      console.log('Start date:', startDate.toISOString());

      const q = query(
        collection(db, 'clock_entries'),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Shifts snapshot received');
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Raw entries:', entries);
        
        const processedShifts = processShifts(entries);
        console.log('Processed shifts:', processedShifts);
        setShifts(processedShifts);
      }, (error) => {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to fetch shifts data');
      });

      return unsubscribe;
    };

    fetchShifts();
  }, []);

  const processShifts = (entries) => {
    console.log('Processing shifts from entries:', entries);
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const userShiftsMap = {};

    sortedEntries.forEach(entry => {
      const userId = entry.user_id;
      if (!userShiftsMap[userId]) {
        userShiftsMap[userId] = {
          userId,
          shifts: [],
          currentClockIn: null
        };
      }

      if (entry.action === 'in') {
        userShiftsMap[userId].currentClockIn = entry;
      } else if (entry.action === 'out' && userShiftsMap[userId].currentClockIn) {
        userShiftsMap[userId].shifts.push({
          clockIn: userShiftsMap[userId].currentClockIn.timestamp,
          clockOut: entry.timestamp,
          clockInLocation: userShiftsMap[userId].currentClockIn.location,
          clockOutLocation: entry.location,
          latitude: userShiftsMap[userId].currentClockIn.latitude,
          longitude: userShiftsMap[userId].currentClockIn.longitude,
          clockOutLatitude: entry.latitude,
          clockOutLongitude: entry.longitude,
          duration: calculateDuration(userShiftsMap[userId].currentClockIn.timestamp, entry.timestamp)
        });
        userShiftsMap[userId].currentClockIn = null;
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
          clockOutLatitude: null,
          clockOutLongitude: null,
          duration: calculateDuration(userData.currentClockIn.timestamp, new Date().toISOString())
        });
      }
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

  const formatDuration = (hours) => {
    if (hours === null) return '-';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
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
    // Split by comma and get the last part which is usually the city/town
    const parts = fullLocation.split(',');
    // Get the first part before "Local Municipality" or "Ward"
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
    // Check if user has any active shifts
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
      
      // First try to sort by name + surname
      const nameA = `${userA.name || ''} ${userA.surname || ''}`.trim().toLowerCase();
      const nameB = `${userB.name || ''} ${userB.surname || ''}`.trim().toLowerCase();
      
      if (nameA && nameB) {
        return nameA.localeCompare(nameB);
      }
      
      // Fall back to email if name is not available
      const emailA = userA.email || '';
      const emailB = userB.email || '';
      return emailA.localeCompare(emailB);
    });
  };

  return (
    <div className="w-full">
      <TimePeriodTabs
        shifts={shifts}
        sortUserEntries={sortUserEntries}
        getUserName={getUserName}
        getUserStatus={getUserStatus}
        formatDuration={formatDuration}
        formatLocation={formatLocation}
        handleLocationClick={handleLocationClick}
      />
    </div>
  );
};

export default AllUsersClockingHistory;
