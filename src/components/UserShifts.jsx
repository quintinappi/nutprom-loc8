import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const UserShifts = ({ userId, userRole, onUnclockedUsers, onLongShifts, onLocationClick }) => {
  const [shifts, setShifts] = useState([]);
  const [activeView, setActiveView] = useState('today');

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
          // Set to a past date to get all entries
          startDate = new Date(2000, 0, 1);
          break;
        // 'today' is default, already set
      }

      const q = query(
        collection(db, 'clock_entries'),
        where('user_id', '==', userId),
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
        
        // Only check for unclosed and long shifts in today's view
        if (activeView === 'today') {
          checkUnclosedShifts(processedShifts);
          checkLongShifts(processedShifts);
        }
      });

      return unsubscribe;
    };

    fetchShifts();
  }, [userId, onUnclockedUsers, onLongShifts, activeView]); // Add activeView to dependencies

  const processShifts = (entries) => {
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const shifts = [];
    let clockInEntry = null;

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      
      if (entry.action === 'in') {
        clockInEntry = entry;
      } else if (entry.action === 'out' && clockInEntry) {
        shifts.push({
          clockIn: clockInEntry.timestamp,
          clockOut: entry.timestamp,
          clockInLocation: clockInEntry.location,
          clockOutLocation: entry.location,
          latitude: clockInEntry.latitude,
          longitude: clockInEntry.longitude,
          duration: calculateDuration(clockInEntry.timestamp, entry.timestamp)
        });
        clockInEntry = null;
      }
    }

    if (clockInEntry) {
      shifts.push({
        clockIn: clockInEntry.timestamp,
        clockInLocation: clockInEntry.location,
        clockOutLocation: null,
        clockOut: null,
        latitude: clockInEntry.latitude,
        longitude: clockInEntry.longitude,
        duration: calculateDuration(clockInEntry.timestamp, new Date().toISOString())
      });
    }

    return shifts.sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn));
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

  const checkUnclosedShifts = (processedShifts) => {
    const unclosedShifts = processedShifts.filter(shift => !shift.clockOut);
    if (unclosedShifts.length > 0 && onUnclockedUsers) {
      onUnclockedUsers(unclosedShifts);
    }
  };

  const checkLongShifts = (processedShifts) => {
    const longShifts = processedShifts.filter(shift => shift.duration >= 12);
    if (longShifts.length > 0 && onLongShifts) {
      onLongShifts(longShifts);
    }
  };

  const handleLocationClick = (shift) => {
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

  const formatLocation = (fullLocation) => {
    if (!fullLocation) return 'N/A';
    // Split by comma and get the last part which is usually the city/town
    const parts = fullLocation.split(',');
    // Get the first part before "Local Municipality" or "Ward"
    const location = parts[0].split('Ward')[0].split('Local Municipality')[0].trim();
    return location;
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
            <ScrollArea className="h-[400px] w-full rounded-md border">
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
                  {shifts.length > 0 ? (
                    shifts.map((shift, index) => (
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
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UserShifts;