import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

const ClockingTable = ({ entries, onLocationClick, onDeleteEntry, isAdmin }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Timestamp</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          {isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id || entry.timestamp}>
            <TableCell>{entry.action}</TableCell>
            <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
            <TableCell>
              {entry.location ? (
                <Button variant="link" onClick={() => onLocationClick(entry)}>
                  {entry.location}
                </Button>
              ) : (
                'No location data'
              )}
            </TableCell>
            <TableCell>{entry.id ? 'Synced' : 'Offline'}</TableCell>
            {isAdmin && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEntry(entry.id)}
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClockingTable;
