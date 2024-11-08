import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClockingDashboard = () => {
  const [clockEntries, setClockEntries] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'clock_entries'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClockEntries(entries);
    });

    return unsubscribe;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clocking Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clockEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.user_id}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                <TableCell>{entry.latitude}, {entry.longitude}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClockingDashboard;