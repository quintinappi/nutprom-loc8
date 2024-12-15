import { useState } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Logo from '@/components/Logo';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const TabletClock = () => {
  const [code, setCode] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const handleCodeChange = (e) => {
    const inputCode = e.target.value.replace(/\D/g, '');
    if (inputCode.length <= 4) {
      setCode(inputCode);
    }
  };

  const checkStatus = async () => {
    if (code.length !== 4) {
      toast.error('Invalid code. Please enter a 4-digit code.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('Invalid code. User not found.');
        setUserInfo(null);
        setStatus(null);
        return;
      }

      const user = querySnapshot.docs[0];
      const userId = user.id;
      const userData = user.data();
      setUserInfo({
        name: userData.name || '',
        surname: userData.surname || '',
        email: userData.email || '',
        avatar_url: userData.avatar_url || null
      });

      // Get today's start and end
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const clockEntriesRef = collection(db, 'clock_entries');
      // First check for leave day
      const leaveQuery = query(
        clockEntriesRef,
        where('user_id', '==', userId),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString()),
        where('isLeaveDay', '==', true),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const leaveSnapshot = await getDocs(leaveQuery);

      if (!leaveSnapshot.empty) {
        setStatus('leave');
        toast.info('Leave day is booked for today.');
        return;
      }

      // If no leave day, check regular clock status
      const clockStatusQuery = query(
        clockEntriesRef,
        where('user_id', '==', userId),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString()),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const clockStatusSnapshot = await getDocs(clockStatusQuery);

      if (clockStatusSnapshot.empty) {
        setStatus('out');
        toast.info('User has not clocked in yet.');
      } else {
        const lastEntry = clockStatusSnapshot.docs[0].data();
        setStatus(lastEntry.action === 'in' ? 'in' : 'out');
        toast.info(`User is currently clocked ${lastEntry.action === 'in' ? 'in' : 'out'}.`);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check status. Please try again.');
    }
  };

  const handleClock = async () => {
    if (code.length !== 4) {
      toast.error('Invalid code. Please enter a 4-digit code.');
      return;
    }

    if (!status) {
      toast.error('Please check your status first.');
      return;
    }

    const newAction = status === 'in' ? 'out' : 'in';

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('Invalid code. User not found.');
        return;
      }

      const user = querySnapshot.docs[0];
      const userId = user.id;

      const clockEntry = {
        user_id: userId,
        action: newAction,
        timestamp: new Date().toISOString(),
        location: 'Tablet Clock Station'
      };

      await addDoc(collection(db, 'clock_entries'), clockEntry);
      toast.success(`Successfully clocked ${newAction}`);
      setCode('');
      setStatus(newAction);
      setAction('');
      
      // Clear user info after successful clock action
      setTimeout(() => {
        setUserInfo(null);
        setStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error clocking in/out:', error);
      toast.error('Failed to clock in/out. Please try again.');
    }
  };

  const handleBookLeave = async () => {
    if (code.length !== 4) {
      toast.error('Invalid code. Please enter a 4-digit code.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('Invalid code. User not found.');
        return;
      }

      const user = querySnapshot.docs[0];
      const userId = user.id;

      // Create clock in and out entries for leave day
      const clockInEntry = {
        user_id: userId,
        action: 'in',
        timestamp: new Date().toISOString(),
        location: 'Leave Day',
        isLeaveDay: true
      };

      const clockOutEntry = {
        user_id: userId,
        action: 'out',
        timestamp: new Date().toISOString(),
        location: 'Leave Day',
        isLeaveDay: true
      };

      await addDoc(collection(db, 'clock_entries'), clockInEntry);
      await addDoc(collection(db, 'clock_entries'), clockOutEntry);
      
      toast.success('Leave day booked successfully');
      setStatus('leave');
      
      // Clear after delay
      setTimeout(() => {
        setCode('');
        setStatus(null);
        setUserInfo(null);
      }, 3000);
    } catch (error) {
      console.error('Error booking leave:', error);
      toast.error('Failed to book leave. Please try again.');
    }
  };

  const handleEndSession = () => {
    setCode('');
    setStatus(null);
    setUserInfo(null);
    toast.success('Session ended');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col items-center space-y-2">
          <Logo size="large" />
          <CardTitle className="text-2xl font-bold mt-4">NutProM Tablet Clocking Station</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter your 4-digit code"
                value={code}
                onChange={handleCodeChange}
                maxLength={4}
                className="text-2xl text-center tracking-wider h-14"
              />
              <Button onClick={checkStatus} className="w-32 h-14 text-lg">
                Check Status
              </Button>
            </div>

            {userInfo && status && (
              <div className="flex flex-col items-center space-y-4 py-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userInfo.avatar_url} alt={`${userInfo.name} ${userInfo.surname}`} />
                  <AvatarFallback>{userInfo.name.charAt(0)}{userInfo.surname.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold">{userInfo.name} {userInfo.surname}</h2>
                  <p className="text-xl text-gray-600 mt-2">
                    Current Status: {status === 'leave' ? 'Leave Day Booked' : `Clocked ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                  </p>
                </div>
              </div>
            )}

            {status && status !== 'leave' && (
              <div className="flex gap-4">
                <Button 
                  onClick={handleClock} 
                  className="flex-1 text-lg py-8"
                  variant={status === 'in' ? 'destructive' : 'default'}
                  disabled={status === 'leave'}
                >
                  Clock {status === 'in' ? 'Out' : 'In'}
                </Button>
                <Button 
                  onClick={handleBookLeave} 
                  variant="outline" 
                  className="flex-1 text-lg py-8"
                  disabled={status === 'leave'}
                >
                  Book Leave Day
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button 
            onClick={handleEndSession} 
            variant="destructive"
            size="lg"
            className="w-full max-w-md text-lg py-6"
          >
            END SESSION
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TabletClock;
