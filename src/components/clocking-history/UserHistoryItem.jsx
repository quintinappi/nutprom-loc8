import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';

const UserHistoryItem = ({ 
  userId, 
  userData, 
  getUserName, 
  getUserStatus, 
  formatDuration, 
  formatLocation, 
  handleLocationClick 
}) => {
  const status = getUserStatus(userData);
  const userName = getUserName(userId);
  
  // Only filter out completely unknown users
  if (userName === 'Unknown User') {
    return null;
  }

  const handleDeleteEntry = async (entryId, outEntryId) => {
    try {
      // Delete the clock-in entry
      await deleteDoc(doc(db, 'clock_entries', entryId));
      
      // If there's a corresponding clock-out entry, delete it too
      if (outEntryId) {
        await deleteDoc(doc(db, 'clock_entries', outEntryId));
      }
      
      toast.success('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  return (
    <AccordionItem key={userId} value={userId}>
      <AccordionTrigger 
        className={`px-3 hover:bg-gray-100 ${status.className}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <span>{userName}</span>
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
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userData.shifts.length > 0 ? (
              userData.shifts.map((shift, index) => (
                <TableRow key={index} className={shift.type === 'Leave Day' ? 'bg-blue-50' : ''}>
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
                    {shift.type === 'Leave Day' ? (
                      <span className="text-blue-600">Leave Day</span>
                    ) : shift.clockInLocation ? (
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
                    {shift.type === 'Leave Day' ? (
                      <span className="text-blue-600">Leave Day</span>
                    ) : shift.clockOutLocation ? (
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
                  <TableCell className="whitespace-nowrap">
                    <span className={shift.type === 'Leave Day' ? 'text-blue-600' : ''}>
                      {shift.type || 'Regular'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this entry? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteEntry(shift.id, shift.outEntryId)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No shifts found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
};

export default UserHistoryItem;