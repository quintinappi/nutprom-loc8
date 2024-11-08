import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UserShiftDetails = ({ shifts }) => {
  const formatDuration = (hours) => {
    if (hours === null) return '-';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Shift Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shifts.map((shift, index) => (
          <TableRow key={index}>
            <TableCell>{new Date(shift.clockIn).toLocaleString()}</TableCell>
            <TableCell>{shift.clockOut ? new Date(shift.clockOut).toLocaleString() : 'Not clocked out'}</TableCell>
            <TableCell>{shift.duration ? formatDuration(parseFloat(shift.duration)) : '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserShiftDetails;