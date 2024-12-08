import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClockEntries } from '../integrations/supabase/hooks/useClockEntries';
import LoadingOverlay from './LoadingOverlay';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ExportCSV = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [users, setUsers] = useState([]);
  const [pairedShifts, setPairedShifts] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastExportTime, setLastExportTime] = useState(0);

  const { getClockEntriesInRange } = useClockEntries();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  const { data: clockEntries, isLoading, error } = useQuery({
    queryKey: ['clockEntries', startDate, endDate, selectedUserId],
    queryFn: () => getClockEntriesInRange(new Date(startDate), new Date(endDate), selectedUserId),
    enabled: !!startDate && !!endDate && !!selectedUserId,
  });

  useEffect(() => {
    if (clockEntries) {
      const shifts = pairClockEntries(clockEntries);
      setPairedShifts(shifts);
    }
  }, [clockEntries]);

  const pairClockEntries = (entries) => {
    const sortedEntries = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const shifts = [];
    let currentShift = null;

    sortedEntries.forEach(entry => {
      if (entry.action === 'in' && !currentShift) {
        currentShift = { clockIn: entry.timestamp, user: entry.user };
      } else if (entry.action === 'out' && currentShift) {
        currentShift.clockOut = entry.timestamp;
        shifts.push(currentShift);
        currentShift = null;
      }
    });

    // Add any unpaired clock-ins
    if (currentShift) {
      shifts.push(currentShift);
    }

    return shifts;
  };

  const calculateShiftDuration = (clockIn, clockOut) => {
    if (!clockOut) return null;
    const duration = (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60); // in hours
    return duration.toFixed(2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const exportToCSV = async () => {
    if (!pairedShifts.length) return;

    const now = Date.now();
    if (now - lastExportTime < 5000) {
      toast.info('Please wait a few seconds before exporting again.');
      return;
    }

    setIsExporting(true);
    setLastExportTime(now);
    toast.info('Preparing CSV file for download...');

    try {
      const selectedUser = users.find(user => user.id === selectedUserId);
      const userName = selectedUser?.name || 'Unknown';
      const userSurname = selectedUser?.surname || 'User';
      const userEmail = selectedUser?.email || 'unknown@email.com';

      const csvContent = [
        ['User Name', 'Surname', 'Email Address', 'Clock In Date', 'Clock In Time', 'Clock Out Date', 'Clock Out Time', 'Duration (hours)'],
        ...pairedShifts.map(shift => {
          const duration = calculateShiftDuration(shift.clockIn, shift.clockOut);
          return [
            userName,
            userSurname,
            userEmail,
            formatDate(shift.clockIn),
            formatTime(shift.clockIn),
            shift.clockOut ? formatDate(shift.clockOut) : '',
            shift.clockOut ? formatTime(shift.clockOut) : '',
            duration || ''
          ];
        })
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `clock_entries_${userName}_${userSurname}_${startDate}_to_${endDate}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV file download initiated. Check your downloads folder.');
    } catch (error) {
      console.error('Error during CSV export:', error);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <LoadingOverlay isLoading={isLoading || isExporting} />
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <Input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <Input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700">Select User</label>
        <Select onValueChange={setSelectedUserId} value={selectedUserId}>
          <SelectTrigger id="userSelect">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} {user.surname} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        onClick={() => setShowConfirmDialog(true)} 
        disabled={isLoading || !pairedShifts.length || isExporting}
        className="w-full"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          'Export to CSV'
        )}
      </Button>
      {error && <p className="text-red-500">Error: {error.message}</p>}
      {pairedShifts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mt-4 mb-2">Shifts to be exported:</h3>
          <ul className="space-y-2">
            {pairedShifts.map((shift, index) => {
              const duration = calculateShiftDuration(shift.clockIn, shift.clockOut);
              return (
                <li key={index} className="border p-2 rounded">
                  <p>Clock In: {formatDate(shift.clockIn)} {formatTime(shift.clockIn)}</p>
                  <p>Clock Out: {shift.clockOut ? `${formatDate(shift.clockOut)} ${formatTime(shift.clockOut)}` : 'N/A'}</p>
                  <p>Duration: {duration ? `${duration} hours` : 'N/A'}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm CSV Export</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export the CSV file? This will download the file to your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={exportToCSV}>Download</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExportCSV;