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
    const fetchShifts = () => {
      console.log('Fetching shifts for period:', period);
      try {
        setLoading(true);
        
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        // Match exact same date filtering as UserShifts
        switch(period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'all':
            startDate = new Date(2000, 0, 1);
            break;
          // 'today' is default, already set
        }

        // Create query exactly like UserShifts but without user filter
        const q = query(
          collection(db, 'clock_entries'),
          where('timestamp', '>=', startDate.toISOString()),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const entries = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('Fetched entries:', entries);
          const processedData = processShifts(entries);
          setShifts(processedData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to fetch shifts data');
        setLoading(false);
      }
    };

    fetchShifts();
  }, [period]);

  const processShifts = (entries) => {
    console.log('Processing shifts from entries:', entries);
    const userShiftsMap = {};

    // First, organize entries by user
    entries.forEach(entry => {
      if (!entry.user_id) {
        console.warn('Entry missing user_id:', entry);
        return;
      }

      if (!userShiftsMap[entry.user_id]) {
        userShiftsMap[entry.user_id] = {
          userId: entry.user_id,
          entries: [],
          shifts: []
        };
      }

      userShiftsMap[entry.user_id].entries.push(entry);
    });

    // Process each user's entries
    Object.values(userShiftsMap).forEach(userData => {
      // Sort entries chronologically for each user
      const sortedEntries = [...userData.entries].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      let clockInEntry = null;
      const shifts = [];

      // Process entries in chronological order
      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        
        if (entry.action === 'in') {
          clockInEntry = entry;
        } else if (entry.action === 'out' && clockInEntry) {
          shifts.push({
            clockIn: clockInEntry.timestamp,
            clockOut: entry.timestamp,
            clockInLocation: clockInEntry.location || 'Location not available',
            clockOutLocation: entry.location || 'Location not available',
            latitude: clockInEntry.latitude,
            longitude: clockInEntry.longitude,
            clockOutLatitude: entry.latitude,
            clockOutLongitude: entry.longitude,
            duration: calculateDuration(clockInEntry.timestamp, entry.timestamp)
          });
          clockInEntry = null;
        }
      }

      // Handle active clock-in
      if (clockInEntry) {
        shifts.push({
          clockIn: clockInEntry.timestamp,
          clockOut: null,
          clockInLocation: clockInEntry.location || 'Location not available',
          clockOutLocation: null,
          latitude: clockInEntry.latitude,
          longitude: clockInEntry.longitude,
          duration: calculateDuration(clockInEntry.timestamp, new Date())
        });
      }

      // Sort shifts by clock-in time, most recent first
      userData.shifts = shifts.sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn));
      // Set current status based on last entry
      userData.lastAction = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].action : 'out';
      userData.currentClockIn = clockInEntry;
    });

    console.log('Processed shifts map:', userShiftsMap);
    return userShiftsMap;
  };

  const getUserStatus = (userData) => {
    // Get the most recent entry by timestamp
    if (!userData.entries || userData.entries.length === 0) {
      return {
        text: 'Not on Duty',
        isOnDuty: false,
        className: ''
      };
    }

    // Sort entries by timestamp in descending order (most recent first)
    const sortedEntries = [...userData.entries].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // The most recent entry determines the status
    const lastEntry = sortedEntries[0];
    const isOnDuty = lastEntry.action === 'in';
    
    return {
      text: isOnDuty ? 'On Duty' : 'Not on Duty',
      isOnDuty: isOnDuty,
      className: isOnDuty ? 'bg-green-50' : ''
    };
  };

  const formatDuration = (durationInHours) => {
    if (!durationInHours || isNaN(durationInHours)) return '0h 0m';
    const hours = Math.floor(durationInHours);
    const minutes = Math.round((durationInHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatLocation = (location) => {
    if (!location || location === 'N/A') return 'Location not available';
    return location;
  };

  const calculateDuration = (startTime, endTime) => {
    try {
      const start = new Date(startTime);
      const end = endTime instanceof Date ? endTime : new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date in duration calculation:', { startTime, endTime });
        return 0;
      }
      
      const durationInHours = (end - start) / (1000 * 60 * 60);
      return durationInHours > 0 ? durationInHours : 0;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
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
        loading={loading}
        users={users}
        sortUserEntries={sortUserEntries}
        getUserName={getUserName}
        getUserStatus={getUserStatus}
        formatDuration={formatDuration}
        formatLocation={formatLocation}
        handleLocationClick={handleLocationClick}
        activeView={period}
      />
    </div>
  );
};

export default AllUsersClockingHistory;