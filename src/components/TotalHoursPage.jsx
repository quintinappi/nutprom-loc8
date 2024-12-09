import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TotalsGraph from './TotalsGraph';
import { useFirebaseAuth } from '../firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from './Navbar'; // Import Navbar

const TotalHoursPage = () => {
  const [myTotals, setMyTotals] = useState({ thisMonth: 0, yesterday: 0, today: 0 });
  const [employeeTotals, setEmployeeTotals] = useState({});
  const [users, setUsers] = useState({});
  const { user, logout } = useFirebaseAuth();
  const [userRole, setUserRole] = useState('user');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('total-hours'); // Add state for activeTab

  useEffect(() => {
    const fetchUserRoleAndData = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setUserRole(userData.role);
          await fetchUsers();
          await fetchClockEntries(userData.role);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoleAndData();
  }, [user]);

  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = {};
    usersSnapshot.forEach(doc => {
      usersData[doc.id] = {
        name: doc.data().name || '',
        surname: doc.data().surname || '',
        email: doc.data().email || ''
      };
    });
    setUsers(usersData);
  };

  const fetchClockEntries = async (role) => {
    try {
      const q = query(collection(db, 'clock_entries'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (role === 'admin') {
        calculateEmployeeTotals(entries);
      }
      calculateMyTotals(entries.filter(entry => entry.user_id === user.uid));
    } catch (err) {
      console.error('Error fetching clock entries:', err);
      setError('Failed to load clock entries. Please try again.');
    }
  };

  const calculateTotals = (entries) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let thisMonth = 0;
    let yesterday = 0;
    let today = 0;

    const sortedEntries = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentEntry = sortedEntries[i];
      const nextEntry = sortedEntries[i + 1];

      if (currentEntry.action === 'in' && nextEntry.action === 'out') {
        const duration = calculateShiftDuration(currentEntry.timestamp, nextEntry.timestamp);
        if (duration !== null) {
          const shiftDate = new Date(currentEntry.timestamp);

          if (shiftDate >= startOfMonth) thisMonth += duration;
          if (shiftDate >= startOfYesterday && shiftDate < startOfToday) yesterday += duration;
          if (shiftDate >= startOfToday) today += duration;

          i++; // Skip the next entry as we've processed it
        }
      }
    }

    return { thisMonth, yesterday, today };
  };

  const calculateMyTotals = (entries) => {
    setMyTotals(calculateTotals(entries));
  };

  const calculateEmployeeTotals = (entries) => {
    const totals = {};
    entries.forEach(entry => {
      if (!totals[entry.user_id]) {
        totals[entry.user_id] = [];
      }
      totals[entry.user_id].push(entry);
    });

    const calculatedTotals = {};
    Object.entries(totals).forEach(([userId, userEntries]) => {
      calculatedTotals[userId] = calculateTotals(userEntries);
    });

    setEmployeeTotals(calculatedTotals);
  };

  const calculateShiftDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInHours = (end - start) / (1000 * 60 * 60);
    return durationInHours > 0 ? durationInHours : null;
  };

  const getUserDisplayName = (userId) => {
    const user = users[userId];
    if (user) {
      return `${user.name} ${user.surname} - ${user.email}`;
    }
    return 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        userRole={userRole}
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Tabs defaultValue="my-hours">
                <TabsList>
                  <TabsTrigger value="my-hours">My Total Hours</TabsTrigger>
                  {userRole === 'admin' && <TabsTrigger value="employee-hours">Employee Total Hours</TabsTrigger>}
                </TabsList>
                <TabsContent value="my-hours">
                  <TotalsGraph
                    thisMonth={myTotals.thisMonth}
                    yesterday={myTotals.yesterday}
                    today={myTotals.today}
                    userName="My Total Hours"
                  />
                </TabsContent>
                {userRole === 'admin' && (
                  <TabsContent value="employee-hours">
                    {Object.entries(employeeTotals).length > 0 ? (
                      Object.entries(employeeTotals).map(([userId, totals]) => (
                        <TotalsGraph
                          key={userId}
                          thisMonth={totals.thisMonth}
                          yesterday={totals.yesterday}
                          today={totals.today}
                          userName={getUserDisplayName(userId)}
                        />
                      ))
                    ) : (
                      <Alert>
                        <AlertDescription>No employee data available.</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TotalHoursPage;