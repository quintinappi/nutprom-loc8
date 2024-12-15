import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Import toast

const TimesheetTable = ({ entries = [], onModifiedHoursChange, onCommentChange, onApprove, selectedUser }) => {
  const [editEntry, setEditEntry] = useState(null);
  const [editType, setEditType] = useState(null);
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [editComment, setEditComment] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const parseTimeString = (timeString) => {
    if (!timeString) return '';
    try {
      let date;
      if (timeString instanceof Date) {
        date = timeString;
      } else if (typeof timeString === 'object' && timeString.seconds) {
        date = new Date(timeString.seconds * 1000);
      } else {
        date = new Date(timeString);
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid time:', timeString);
        return '';
      }

      // Format as HH:mm for input type="time"
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error parsing time:', error);
      return '';
    }
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '-';
    try {
      let date;
      if (timeString instanceof Date) {
        date = timeString;
      } else if (typeof timeString === 'object' && timeString.seconds) {
        date = new Date(timeString.seconds * 1000);
      } else {
        date = new Date(timeString);
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid display time:', timeString);
        return '-';
      }

      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting display time:', error);
      return '-';
    }
  };

  const handleEdit = (entry) => {
    console.log('Editing entry:', entry);
    
    if (!selectedUser?.id) {
      console.error('No user selected');
      toast.error('Please select a user first');
      return;
    }
    
    // Deep clone the entry to avoid state mutations
    const entryToEdit = {
      ...JSON.parse(JSON.stringify(entry)),
      userId: selectedUser.id // Ensure userId is set in the edit entry
    };
    
    console.log('Prepared entry for edit:', entryToEdit);
    setEditEntry(entryToEdit);
    
    // Parse times for the input fields
    const parsedTimeIn = parseTimeString(entry.time_in);
    const parsedTimeOut = parseTimeString(entry.time_out);
    
    console.log('Setting edit times:', { parsedTimeIn, parsedTimeOut });
    
    setTimeIn(parsedTimeIn);
    setTimeOut(parsedTimeOut);
    setTotalHours(entry.modified_hours?.toString() || '');
    setEditComment(entry.comment || '');
    setEditType('clockTimes'); // Default to clock times
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!selectedUser) {
        toast.error('Please select a user first');
        return;
      }

      if (!editEntry) {
        console.error('No entry selected for editing');
        return;
      }

      const updates = {
        userId: selectedUser.id,
        date: editEntry.date,
        comment: editComment,
        status: editEntry.status || 'pending',
        id: editEntry.id
      };

      console.log('Preparing updates with user:', { selectedUser, updates });

      if (editType === 'clockTimes') {
        if (!timeIn || !timeOut) {
          toast.error('Both clock-in and clock-out times are required');
          return;
        }

        const clockInTime = parse(timeIn, 'HH:mm', new Date(editEntry.date));
        const clockOutTime = parse(timeOut, 'HH:mm', new Date(editEntry.date));

        if (isNaN(clockInTime.getTime()) || isNaN(clockOutTime.getTime())) {
          toast.error('Invalid time format. Please use HH:mm format');
          return;
        }

        // Calculate duration in hours
        const durationMs = clockOutTime.getTime() - clockInTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        Object.assign(updates, {
          clock_in_time: timeIn,
          clock_out_time: timeOut,
          time_in: clockInTime.toISOString(),
          time_out: clockOutTime.toISOString(),
          duration: durationHours,
          modified_hours: durationHours
        });
      }

      if (editType === 'totalHours') {
        if (!totalHours || isNaN(parseFloat(totalHours))) {
          toast.error('Valid total hours required');
          return;
        }

        const hours = parseFloat(totalHours);
        
        // If there's a clock-in time, calculate clock-out based on duration
        let clockInTime = editEntry.time_in ? new Date(editEntry.time_in) : new Date(editEntry.date);
        if (editEntry.clock_in_time) {
          const [hours, minutes] = editEntry.clock_in_time.split(':').map(Number);
          clockInTime.setHours(hours, minutes, 0, 0);
        }
        
        // Calculate clock-out time based on total hours
        const clockOutTime = new Date(clockInTime);
        clockOutTime.setHours(clockOutTime.getHours() + Math.floor(hours));
        clockOutTime.setMinutes(clockOutTime.getMinutes() + Math.round((hours % 1) * 60));
        
        Object.assign(updates, {
          modified_hours: hours,
          duration: hours,
          original_hours: `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`,
          comment: editComment || 'Manual hours override',
          clock_in_time: format(clockInTime, 'HH:mm'),
          clock_out_time: format(clockOutTime, 'HH:mm'),
          time_in: clockInTime.toISOString(),
          time_out: clockOutTime.toISOString()
        });
      }

      console.log('Saving updates:', updates);
      await onModifiedHoursChange(editEntry.id, updates);

      // Reset state
      setShowEditDialog(false);
      setEditEntry(null);
      setEditType(null);
      setTimeIn('');
      setTimeOut('');
      setTotalHours('');
      setEditComment('');

      toast.success('Entry updated successfully');
    } catch (error) {
      console.error('Error saving edit:', error);
      toast.error('Failed to save changes: ' + error.message);
    }
  };

  // Calculate totals
  const totalOriginalHours = entries.reduce((sum, entry) => sum + (parseFloat(entry.original_hours) || 0), 0);
  const totalModifiedHours = entries.reduce((sum, entry) => {
    const modifiedHours = parseFloat(entry.modified_hours) || 0;
    const regularHours = Math.min(modifiedHours, 9);
    return sum + regularHours;
  }, 0);
  
  const totalOvertimeHours = entries.reduce((sum, entry) => {
    const modifiedHours = parseFloat(entry.modified_hours) || 0;
    const overtimeHours = Math.max(0, modifiedHours - 9);
    return sum + overtimeHours;
  }, 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (h)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => {
            const modifiedHours = parseFloat(entry.modified_hours) || 0;
            const overtimeHours = Math.max(0, modifiedHours - 9);
            const regularHours = Math.min(modifiedHours, 9);
            const hasMultiDayClocking = entry.multi_day_clocking;
            
            return (
              <tr key={entry.id || entry.date} 
                  className={`${entry.isLeaveDay ? 'bg-gray-50' : ''} 
                            ${entry.status === 'approved' ? 'bg-green-50' : 
                              hasMultiDayClocking ? 'bg-yellow-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(entry.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.isLeaveDay ? 'Leave Day' : formatDisplayTime(entry.time_in)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.isLeaveDay ? '-' : formatDisplayTime(entry.time_out)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.original_hours || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.modified_hours || '0.00'}
                  {regularHours > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Regular: {regularHours.toFixed(2)}h
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {overtimeHours > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      {overtimeHours.toFixed(2)}h
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">
                  <Input
                    type="text"
                    value={entry.comment || ''}
                    onChange={(e) => onCommentChange(entry.id || entry.date, e.target.value)}
                    disabled={entry.status === 'approved'}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500
                              ${hasMultiDayClocking ? 'border-yellow-500' : ''}`}
                    placeholder={hasMultiDayClocking ? "Requires review" : ""}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-sm ${
                    entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                    hasMultiDayClocking ? 'bg-yellow-100 text-yellow-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {entry.status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Entry for {formatDate(editEntry?.date)}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <RadioGroup value={editType} onValueChange={setEditType}>
                          <div className="flex items-center space-x-2 mb-4">
                            <RadioGroupItem value="clockTimes" id="clockTimes" />
                            <Label htmlFor="clockTimes">Edit Clock Times</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="totalHours" id="totalHours" />
                            <Label htmlFor="totalHours">Override Total Hours</Label>
                          </div>
                        </RadioGroup>

                        {editType === 'clockTimes' && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <Label>Time In</Label>
                              <Input
                                type="time"
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Time Out</Label>
                              <Input
                                type="time"
                                value={timeOut}
                                onChange={(e) => setTimeOut(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Comment (optional)</Label>
                              <Input
                                type="text"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {editType === 'totalHours' && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <Label>Total Hours</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={totalHours}
                                onChange={(e) => setTotalHours(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Comment</Label>
                              <Input
                                type="text"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                placeholder="admin override"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button onClick={handleSaveEdit}>
                            Save Changes
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {entry.status !== 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApprove(entry)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Approve
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={3} className="px-6 py-4">Total Hours:</td>
            <td className="px-6 py-4">{totalOriginalHours.toFixed(2)}</td>
            <td className="px-6 py-4">
              {totalModifiedHours.toFixed(2)}
              <div className="text-xs text-gray-500 mt-1">
                Regular: {totalModifiedHours.toFixed(2)}h
              </div>
            </td>
            <td className="px-6 py-4">
              {totalOvertimeHours > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                  {totalOvertimeHours.toFixed(2)}h
                </span>
              ) : '-'}
            </td>
            <td colSpan={3}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TimesheetTable;
