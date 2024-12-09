import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import Logo from './Logo';

const CodeClocking = () => {
  const [code, setCode] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

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
        email: userData.email || ''
      });

      const clockEntriesRef = collection(db, 'clock_entries');
      const lastEntryQuery = query(
        clockEntriesRef,
        where('user_id', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const lastEntrySnapshot = await getDocs(lastEntryQuery);

      if (lastEntrySnapshot.empty) {
        setStatus('out');
        toast.info('User has not clocked in yet.');
      } else {
        const lastEntry = lastEntrySnapshot.docs[0].data();
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
      };

      await addDoc(collection(db, 'clock_entries'), clockEntry);
      toast.success(`Successfully clocked ${newAction}`);
      setCode('');
      setStatus(newAction);
      setAction('');
    } catch (error) {
      console.error('Error clocking in/out:', error);
      toast.error('Failed to clock in/out. Please try again.');
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="flex flex-col items-center">
        <Logo size="large" />
        <CardTitle className="mt-4">NutProM Clocking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your 4-digit code"
            value={code}
            onChange={handleCodeChange}
            maxLength={4}
          />
          <Button onClick={checkStatus} className="w-full">
            Check Status
          </Button>
          {userInfo && status && (
            <Alert>
              <AlertDescription>
                {userInfo.name} {userInfo.surname} ({userInfo.email}) is currently clocked {status}.
              </AlertDescription>
            </Alert>
          )}
          {status && (
            <Button onClick={handleClock} className="w-full">
              Clock {status === 'in' ? 'Out' : 'In'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeClocking;
