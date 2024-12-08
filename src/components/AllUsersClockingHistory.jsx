import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AllUsersClockingHistory = ({ onLocationClick }) => {
  const [shifts, setShifts] = useState({});
  const [activeView, setActiveView] = useState('today');
  const [users, setUsers] = useState({});

  useEffect(() => {
    // Fetch users data
    const fetchUsers = async () => {
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
        setUsers(usersData);
      });
      return unsubscribe;
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      // Adjust start date based on active view
      switch (activeView) {
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
        
        const processedShifts = processShifts(entries);
        setShifts(processedShifts);
      });

      return unsubscribe;
    };

    fetchShifts();
  }, [activeView]);

  const processShifts = (entries) => {
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
    return user.name && user.surname 
      ? `${user.name} ${user.surname}`
      : user.email || 'Unknown User';
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
    return Object.entries(entries)
      .filter(([userId, userData]) => {
        const user = users[userId] || {};
        // Filter out entries where both name and email are missing or where the user is "Unknown"
        return (user.name || user.email) && user.name !== 'Unknown User';
      })
      .sort((a, b) => {
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
      <Tabs defaultValue="today" className="w-full" onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        {['today', 'week', 'month', 'all'].map((period) => (
          <TabsContent key={period} value={period}>
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <Accordion type="multiple" className="w-full">
                {sortUserEntries(shifts).map(([userId, userData]) => {
                  const status = getUserStatus(userData);
                  return (
                    <AccordionItem key={userId} value={userId}>
                      <AccordionTrigger 
                        className={`px-3 hover:bg-gray-100 ${status.className}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <span>{getUserName(userId)}</span>
                            <span className={`text-sm ${status.isOnDuty ? 'text-green-600' : 'text-red-600'}`}>
                              {status.text}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {userData.shifts.length} entries
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-[180px]">Clock In</TableHead>
                              <TableHead className="w-[180px]">Clock Out</TableHead>
                              <TableHead className="w-[100px]">Duration</TableHead>
                              <TableHead className="min-w-[200px]">Clock In Location</TableHead>
                              <TableHead className="min-w-[200px]">Clock Out Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userData.shifts.length > 0 ? (
                              userData.shifts.map((shift, index) => (
                                <TableRow key={index}>
                                  <TableCell className="whitespace-nowrap">
                                    {new Date(shift.clockIn).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {shift.clockOut ? new Date(shift.clockOut).toLocaleString() : 'Active'}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {formatDuration(shift.duration)}
                                  </TableCell>
                                  <TableCell className="truncate max-w-[300px]">
                                    {shift.clockInLocation ? (
                                      <button
                                        onClick={() => handleLocationClick({
                                          ...shift,
                                          location: shift.clockInLocation
                                        })}
                                        className="text-blue-500 hover:underline focus:outline-none text-left"
                                        title={shift.clockInLocation}
                                      >
                                        {formatLocation(shift.clockInLocation)}
                                      </button>
                                    ) : (
                                      <span className="text-gray-500">N/A</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="truncate max-w-[300px]">
                                    {shift.clockOutLocation ? (
                                      <button
                                        onClick={() => handleLocationClick({
                                          location: shift.clockOutLocation,
                                          coordinates: {
                                            latitude: shift.clockOutLatitude,
                                            longitude: shift.clockOutLongitude
                                          }
                                        })}
                                        className="text-blue-500 hover:underline focus:outline-none text-left"
                                        title={shift.clockOutLocation}
                                      >
                                        {formatLocation(shift.clockOutLocation)}
                                      </button>
                                    ) : (
                                      <span className="text-gray-500">N/A</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500">
                                  No shifts found for this period
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              {Object.keys(shifts).length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No shifts found for this period
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AllUsersClockingHistory;
