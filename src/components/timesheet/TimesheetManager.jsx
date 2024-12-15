import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TimesheetFilters from './TimesheetFilters';
import TimesheetTable from './TimesheetTable';
import { toast } from 'sonner';
import { useFirebaseAuth } from '../../firebase/auth';

const TimesheetManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const { user } = useFirebaseAuth();

  // Function to generate a unique local ID
  const generateLocalId = (date) => `local-${date}-${Math.random().toString(36).substr(2, 9)}`;

  // Function to process entries and ensure uniqueness
  const processEntries = (entries, dateRange) => {
    console.log('Processing entries:', { entries, dateRange });
    
    // Create a map of dates to entries
    const entriesByDate = new Map();
    
    // Initialize all dates in the range with empty entries
    const days = eachDayOfInterval({
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      entriesByDate.set(dateStr, {
        date: dateStr,
        time_in: null,
        time_out: null,
        duration: 0,
        original_hours: '0h 0m',
        modified_hours: '0.00',
        status: 'pending',
        comment: '',
        isLeaveDay: false,
        leaveType: null
      });
    });
    
    // First process leave entries to ensure they take precedence
    entries.filter(entry => entry.isLeaveDay).forEach(entry => {
      const date = entry.date || format(new Date(entry.timestamp), 'yyyy-MM-dd');
      entriesByDate.set(date, {
        ...entriesByDate.get(date),
        id: entry.id,
        isLeaveDay: true,
        leaveType: entry.leaveType,
        original_hours: '8h 0m',
        duration: 8,
        modified_hours: '8.00',
        status: entry.status || 'approved',
        comment: entry.comment || ''
      });
    });
    
    // Then process clock entries for non-leave days
    entries.filter(entry => !entry.isLeaveDay).forEach(entry => {
      const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      const existingEntry = entriesByDate.get(date);
      
      // Skip if it's a leave day
      if (existingEntry && !existingEntry.isLeaveDay) {
        existingEntry.id = entry.id;
        existingEntry.status = entry.status || existingEntry.status;
        existingEntry.comment = entry.comment || existingEntry.comment;
        existingEntry.modified_hours = entry.modified_hours || existingEntry.modified_hours;
        
        if (entry.action === 'in' || entry.time_in) {
          existingEntry.time_in = entry.time_in || entry.timestamp;
          existingEntry.clock_in_id = entry.id;
        } else if (entry.action === 'out' || entry.time_out) {
          existingEntry.time_out = entry.time_out || entry.timestamp;
          existingEntry.clock_out_id = entry.id;
        }
        
        // Check for multi-day clocking
        if (existingEntry.time_in && !existingEntry.time_out) {
          // Look ahead for matching clock-out
          const clockOutEntry = entries.find(e => 
            e.action === 'out' && 
            new Date(e.timestamp) > new Date(existingEntry.time_in)
          );
          
          if (clockOutEntry) {
            const clockOutDate = format(new Date(clockOutEntry.timestamp), 'yyyy-MM-dd');
            if (clockOutDate !== date) {
              existingEntry.multi_day_clocking = true;
              existingEntry.multi_day_end = clockOutEntry.timestamp;
              
              // Mark all days between clock-in and clock-out
              const startDate = new Date(existingEntry.time_in);
              const endDate = new Date(clockOutEntry.timestamp);
              const daysBetween = eachDayOfInterval({ start: startDate, end: endDate });
              
              daysBetween.forEach(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                if (dayStr !== date) {
                  const dayEntry = entriesByDate.get(dayStr);
                  if (dayEntry) {
                    dayEntry.multi_day_clocking = true;
                    dayEntry.related_clock_in = existingEntry.time_in;
                    dayEntry.related_clock_out = clockOutEntry.timestamp;
                  }
                }
              });
            }
          }
        }
        
        // Calculate duration if we have both timestamps
        if (existingEntry.time_in && existingEntry.time_out) {
          const clockInTime = new Date(existingEntry.time_in).getTime();
          const clockOutTime = new Date(existingEntry.time_out).getTime();
          const durationMinutes = Math.max(0, (clockOutTime - clockInTime) / (1000 * 60));
          const hours = Math.floor(durationMinutes / 60);
          const minutes = Math.round(durationMinutes % 60);
          existingEntry.original_hours = `${hours}h ${minutes}m`;
          existingEntry.duration = parseFloat((durationMinutes / 60).toFixed(2));
          if (!existingEntry.modified_hours || existingEntry.modified_hours === '0.00') {
            existingEntry.modified_hours = existingEntry.duration.toFixed(2);
          }
        }
      }
    });
    
    // Convert map to array and sort by date
    const processedEntries = Array.from(entriesByDate.values());
    console.log('Processed entries:', processedEntries);
    
    return processedEntries;
  };

  const fetchEntries = async (userId, dateRange) => {
    if (!userId || !dateRange?.start || !dateRange?.end) {
      console.log('Missing required data:', { userId, startDate: dateRange?.start, endDate: dateRange?.end });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all clock entries including empty days
      const clockingsRef = collection(db, "clock_entries");
      const startDate = startOfDay(dateRange.start);
      const endDate = endOfDay(dateRange.end);

      console.log('Fetching with params:', { 
        userId, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      
      const q = query(
        clockingsRef,
        where("user_id", "==", userId),
        where("timestamp", ">=", startDate.toISOString()),
        where("timestamp", "<=", endDate.toISOString()),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const clockEntries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw clock entry:', { id: doc.id, ...data });
        return { id: doc.id, ...data };
      });
      
      console.log("Raw clocking entries:", clockEntries);
      
      // Fetch leave entries
      const leaveRef = collection(db, "leave_requests");
      const leaveQuery = query(
        leaveRef,
        where("user_id", "==", userId),
        where("status", "==", "approved"),
        orderBy("startDate", "asc")
      );
      
      const leaveSnapshot = await getDocs(leaveQuery);
      const allLeaveEntries = leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("All leave entries:", allLeaveEntries);

      // Filter leave entries for the date range
      const leaveEntries = allLeaveEntries.filter(entry => {
        const leaveStart = new Date(entry.startDate);
        const leaveEnd = new Date(entry.endDate);
        const rangeStart = new Date(dateRange.start);
        const rangeEnd = new Date(dateRange.end);
        
        const isInRange = leaveStart <= rangeEnd && leaveEnd >= rangeStart;
        console.log('Leave entry date check:', {
          entry: entry.id,
          leaveStart,
          leaveEnd,
          rangeStart,
          rangeEnd,
          isInRange
        });
        return isInRange;
      });
      
      console.log("Filtered leave entries:", leaveEntries);
      
      // Convert leave entries into daily entries
      const leaveEntriesByDay = [];
      leaveEntries.forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = eachDayOfInterval({ start, end });
        
        days.forEach(day => {
          if (day >= new Date(dateRange.start) && day <= new Date(dateRange.end)) {
            leaveEntriesByDay.push({
              id: `${leave.id}-${format(day, 'yyyy-MM-dd')}`,
              date: format(day, 'yyyy-MM-dd'),
              user_id: userId,
              isLeaveDay: true,
              status: 'approved',
              modified_hours: '8.00',
              comment: 'Leave Day'
            });
          }
        });
      });
      
      console.log("Leave entries by day:", leaveEntriesByDay);
      
      // Combine all entries
      const allEntries = [...clockEntries, ...leaveEntriesByDay];
      console.log("Combined entries:", allEntries);
      
      const processedEntries = processEntries(allEntries, { start: dateRange.start, end: dateRange.end });
      console.log("Final processed entries:", processedEntries);
      
      setTimesheetEntries(processedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to fetch timesheet entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifiedHoursChange = async (entryId, updates) => {
    try {
      if (!updates.userId) {
        console.error('No userId provided for update:', updates);
        toast.error('User ID is required for updating entries');
        return;
      }

      console.log('Handling modified hours change:', { entryId, updates });
      
      const entriesRef = collection(db, 'timesheet_entries');
      const dateStr = format(new Date(updates.date), 'yyyy-MM-dd');
      
      // First try to find by entryId if provided
      let docRef;
      let existingDoc = null;
      
      if (entryId && entryId !== 'new') {
        docRef = doc(db, 'timesheet_entries', entryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existingDoc = { id: docSnap.id, ...docSnap.data() };
        } else {
          docRef = null;
        }
      }
      
      // If no document found by ID, query by date and userId
      if (!docRef) {
        const q = query(
          entriesRef,
          where('date', '==', dateStr),
          where('userId', '==', updates.userId)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          docRef = doc(db, 'timesheet_entries', querySnapshot.docs[0].id);
          existingDoc = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
      }

      const finalUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
        // Ensure time fields are properly formatted
        time_in: updates.time_in ? new Date(updates.time_in).toISOString() : null,
        time_out: updates.time_out ? new Date(updates.time_out).toISOString() : null,
        // Ensure numeric fields are numbers
        duration: parseFloat(updates.duration || 0),
        modified_hours: parseFloat(updates.modified_hours || 0)
      };

      // Update timesheet entry
      if (docRef) {
        await updateDoc(docRef, finalUpdates);
      } else {
        // Create new timesheet entry
        docRef = await addDoc(entriesRef, {
          ...finalUpdates,
          date: dateStr,
          createdAt: serverTimestamp()
        });
      }

      // Update clock entries if we're modifying hours
      if (updates.modified_hours) {
        const clockingsRef = collection(db, 'clock_entries');
        
        // Create clock-in entry using existing time_in if available
        const clockInTime = updates.time_in ? new Date(updates.time_in) : startOfDay(new Date(updates.date));
        const clockOutTime = updates.time_out ? new Date(updates.time_out) : (() => {
          const time = new Date(clockInTime);
          time.setHours(time.getHours() + Math.floor(updates.modified_hours));
          time.setMinutes(time.getMinutes() + Math.round((updates.modified_hours % 1) * 60));
          return time;
        })();
        
        const clockInEntry = {
          user_id: updates.userId,
          date: dateStr,
          timestamp: clockInTime.toISOString(),
          status: updates.status || 'pending',
          action: 'in',
          modified_hours: parseFloat(updates.modified_hours),
          comment: updates.comment || '',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        const clockOutEntry = {
          user_id: updates.userId,
          date: dateStr,
          timestamp: clockOutTime.toISOString(),
          status: updates.status || 'pending',
          action: 'out',
          modified_hours: parseFloat(updates.modified_hours),
          comment: updates.comment || '',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        // Delete existing clock entries for this date if any
        const existingEntriesQuery = query(
          clockingsRef,
          where('date', '==', dateStr),
          where('user_id', '==', updates.userId)
        );
        const existingEntries = await getDocs(existingEntriesQuery);
        for (const doc of existingEntries.docs) {
          await deleteDoc(doc.ref);
        }

        // Add new clock entries
        await addDoc(clockingsRef, clockInEntry);
        await addDoc(clockingsRef, clockOutEntry);
      }

      console.log('Document updated/created successfully with:', finalUpdates);
      toast.success('Entry updated successfully');
      
      // Refresh entries
      await fetchEntries(updates.userId, selectedDateRange);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry: ' + error.message);
    }
  };

  const handleCommentChange = (entryId, value) => {
    console.log('Comment change:', { entryId, value });
    setTimesheetEntries(entries =>
      entries.map(entry =>
        (entry.id === entryId || entry.date === entryId)
          ? { ...entry, comment: value }
          : entry
      )
    );
  };

  const handleApprove = async (entry) => {
    try {
      console.log('Entry to approve:', entry);
      
      // For entries without an ID (empty days)
      if (!entry.id) {
        // Update local state
        setTimesheetEntries(prevEntries => 
          prevEntries.map(e => 
            e.date === entry.date
              ? {
                  ...e,
                  status: 'approved',
                  modified_hours: entry.modified_hours || '0.00',
                  comment: entry.comment || ''
                }
              : e
          )
        );

        const startOfDayTime = startOfDay(new Date(entry.date)).toISOString();
        const modifiedHours = entry.modified_hours ? parseFloat(entry.modified_hours) : 0;
        
        // Create clock-in entry
        const clockInEntry = {
          user_id: selectedUser.id,
          date: entry.date,
          timestamp: startOfDayTime,
          status: 'approved',
          action: 'in',
          modified_hours: modifiedHours,
          comment: entry.comment || '',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        // Create clock-out entry with the duration based on modified hours
        const clockOutTime = new Date(startOfDayTime);
        clockOutTime.setHours(clockOutTime.getHours() + Math.floor(modifiedHours));
        clockOutTime.setMinutes((modifiedHours % 1) * 60);
        
        const clockOutEntry = {
          user_id: selectedUser.id,
          date: entry.date,
          timestamp: clockOutTime.toISOString(),
          status: 'approved',
          action: 'out',
          modified_hours: modifiedHours,
          comment: entry.comment || '',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        // Add both entries to Firestore
        const clockingsRef = collection(db, 'clock_entries');
        await addDoc(clockingsRef, clockInEntry);
        await addDoc(clockingsRef, clockOutEntry);
        
        toast.success('Day approved successfully');
        return;
      }

      // For clock entries
      const docRef = doc(db, 'clock_entries', entry.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error('Document not found:', entry.id);
        toast.error('Entry not found in database');
        return;
      }

      const currentData = docSnap.data();
      console.log('Current document data:', currentData);

      const updateData = {
        status: 'approved',
        updated_at: serverTimestamp(),
        modified_hours: entry.modified_hours ? parseFloat(entry.modified_hours) : (currentData.modified_hours || 0),
        comment: entry.comment || currentData.comment || ''
      };

      console.log('Updating document:', { id: entry.id, updateData });

      await updateDoc(docRef, updateData);
      
      setTimesheetEntries(prevEntries => 
        prevEntries.map(e => 
          e.id === entry.id
            ? {
                ...e,
                status: 'approved',
                modified_hours: updateData.modified_hours.toString(),
                comment: updateData.comment
              }
            : e
        )
      );

      toast.success('Entry approved successfully');

      // Refresh data after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchEntries(selectedUser.id, selectedDateRange.start, selectedDateRange.end);

    } catch (error) {
      console.error('Error approving entry:', error);
      console.error('Failed entry:', entry);
      toast.error(`Failed to approve entry: ${error.message}`);
    }
  };

  const handleFilter = async ({ user, dateRange }) => {
    setSelectedUser(user);
    setSelectedDateRange(dateRange);
    await fetchEntries(user.id, dateRange);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Fetch users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const fetchedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(fetchedUsers);

        // Set initial user
        if (user) {
          const currentUser = fetchedUsers.find(u => u.id === user.uid);
          if (currentUser) {
            setSelectedUser(currentUser);
            await fetchEntries(currentUser.id, selectedDateRange);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  return (
    <div className="space-y-4">
      <TimesheetFilters 
        users={users}
        selectedUser={selectedUser}
        selectedDateRange={selectedDateRange}
        onFilter={handleFilter}
        isAdmin={user?.is_admin}
      />
      <TimesheetTable
        entries={timesheetEntries}
        onModifiedHoursChange={handleModifiedHoursChange}
        onCommentChange={handleCommentChange}
        onApprove={handleApprove}
        selectedUser={selectedUser}  // Pass selectedUser to TimesheetTable
      />
    </div>
  );
};

export default TimesheetManager;
