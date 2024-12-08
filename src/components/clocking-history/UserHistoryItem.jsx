import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  
  // Skip rendering if user is unknown
  if (userName.includes('Unknown User')) {
    return null;
  }

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
};

export default UserHistoryItem;