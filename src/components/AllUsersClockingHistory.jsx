import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import TimePeriodTabs from './clocking-history/TimePeriodTabs';

const AllUsersClockingHistory = ({ onLocationClick, period = 'today' }) => {
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
      console.log('Fetching shifts for period:', period);
      try {
        setLoading(true);
        
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        switch(period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'all':
            startDate.setFullYear(2000);
            break;
        }
        
        console.log('Creating query with startDate:', startDate);
        
        const q = query(
          collection(db, 'clock_entries'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          console.log('Received shifts snapshot with', querySnapshot.size, 'documents');
          const entries = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate() || new Date(data.timestamp)
            };
          });
          
          console.log('Processed entries:', entries);
          const processedShifts = processShifts(entries);
          console.log('Final processed shifts:', processedShifts);
          setShifts(processedShifts);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error in shifts snapshot:', error);
        toast.error('Failed to fetch shifts data');
        setLoading(false);
      }
    };

    fetchShifts();
  }, [period]);

  const processShifts = (entries) => {
    console.log('Processing shifts from entries:', entries);
    const userShiftsMap = {};

    // Create a map of latest clock actions per user
    const latestClockActions = new Map();
    entries.forEach(entry => {
      if (!entry.user_id) return;
      
      const timestamp = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
      
      if (!latestClockActions.has(entry.user_id) || 
          timestamp > latestClockActions.get(entry.user_id).timestamp) {
        latestClockActions.set(entry.user_id, {
          action: entry.action,
          timestamp
        });
      }
    });

    // Process all entries
    entries.forEach(entry => {
      if (!entry.user_id) {
        console.warn('Entry missing user_id:', entry);
        return;
      }

      if (!userShiftsMap[entry.user_id]) {
        const latestAction = latestClockActions.get(entry.user_id);
        userShiftsMap[entry.user_id] = {
          userId: entry.user_id,
          shifts: [],
          currentClockIn: null,
          lastAction: latestAction?.action || 'out'
        };
      }

      const userShifts = userShiftsMap[entry.user_id];
      const timestamp = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);

      if (entry.action === 'in') {
        // Only set as current clock in if this is the latest action
        const isLatestAction = latestClockActions.get(entry.user_id)?.action === 'in';
        if (isLatestAction) {
          userShifts.currentClockIn = {
            ...entry,
            timestamp
          };
        }
      } else if (entry.action === 'out') {
        // Find the matching clock in entry
        const matchingClockIn = entries.find(e => 
          e.user_id === entry.user_id && 
          e.action === 'in' && 
          new Date(e.timestamp) < timestamp
        );

        if (matchingClockIn) {
          const clockInTime = new Date(matchingClockIn.timestamp);
          userShifts.shifts.push({
            clockIn: clockInTime,
            clockOut: timestamp,
            clockInLocation: matchingClockIn.location,
            clockOutLocation: entry.location,
            latitude: matchingClockIn.latitude,
            longitude: matchingClockIn.longitude,
            clockOutLatitude: entry.latitude,
            clockOutLongitude: entry.longitude,
            duration: calculateDuration(clockInTime, timestamp)
          });
        }
      }
    });

    // Sort shifts by clock in time, most recent first
    Object.values(userShiftsMap).forEach(userData => {
      if (userData.currentClockIn) {
        userData.shifts.unshift({
          clockIn: userData.currentClockIn.timestamp,
          clockOut: null,
          clockInLocation: userData.currentClockIn.location,
          clockOutLocation: null,
          latitude: userData.currentClockIn.latitude,
          longitude: userData.currentClockIn.longitude,
          duration: calculateDuration(userData.currentClockIn.timestamp, new Date())
        });
      }
      userData.shifts.sort((a, b) => b.clockIn - a.clockIn);
    });

    console.log('Processed shifts map:', userShiftsMap);
    return userShiftsMap;
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationInHours = (end - start) / (1000 * 60 * 60);
    return durationInHours > 0 ? durationInHours : 0;
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

  const formatLocation = (location) => {
    console.log('Formatting location:', location);
    if (!location) return 'N/A';
    
    if (typeof location === 'string') {
      const parts = location.split(',');
      return parts[0].split('Ward')[0].split('Local Municipality')[0].trim() || 'N/A';
    } else if (location.latitude && location.longitude) {
      return `${location.latitude}, ${location.longitude}`;
    }
    
    return 'N/A';
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
    const isOnDuty = userData.lastAction === 'in';
    return {
      isOnDuty,
      text: isOnDuty ? 'On Duty' : 'Off Duty',
      className: isOnDuty ? 'bg-green-50' : 'bg-red-50'
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
        activeView={period}
      />
    </div>
  );
};

export default AllUsersClockingHistory;