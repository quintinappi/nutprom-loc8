import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Logo from '@/components/Logo';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import TimesheetSignDialog from '../components/timesheet/TimesheetSignDialog';
import { format } from 'date-fns';
import PDFExportButton from '../components/pdf/PDFExportButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, 'dd/MM/yyyy');
};

const TabletClock = () => {
  const [code, setCode] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
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
        id: userId,
        name: userData.name || '',
        surname: userData.surname || '',
        email: userData.email || '',
        avatar_url: userData.avatar_url || null
      });

      // Fetch pending timesheets
      const timesheetsRef = collection(db, 'timesheets');
      const timesheetsQuery = query(
        timesheetsRef,
        where('employeeId', '==', userId),
        where('status', '==', 'PENDING_EMPLOYEE')
      );
      const timesheetsSnapshot = await getDocs(timesheetsQuery);
      const timesheets = timesheetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingTimesheets(timesheets);

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
        setPendingTimesheets([]);
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
        setPendingTimesheets([]);
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
    setPendingTimesheets([]);
    toast.success('Session ended');
  };

  const handleSignClick = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowPreview(true);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setShowSignDialog(true);
  };

  const handleSignDialogClose = () => {
    setShowSignDialog(false);
    setSelectedTimesheet(null);
  };

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          const adminData = adminDoc.data();
          if (adminData?.pdfSettings?.logoBase64) {
            console.log('Logo found from admin settings');
            setCompanyLogo(adminData.pdfSettings.logoBase64);
          } else {
            console.log('No logo found in admin settings');
          }
        } else {
          console.log('No admin user found');
        }
      } catch (error) {
        console.error('Error fetching company logo:', error);
      }
    };
    fetchLogo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col items-center space-y-2">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-24 object-contain"
            />
          ) : (
            <Logo size="large" />
          )}
          <CardTitle className="text-2xl font-bold mt-4">
            NutProM Tablet Clocking Station
          </CardTitle>
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

            {pendingTimesheets.length > 0 && (
              <div className="container mx-auto py-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Timesheets for Signature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingTimesheets.map((timesheet) => (
                        <div key={timesheet.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Period: {formatDate(timesheet.period?.start)} - {formatDate(timesheet.period?.end)}</p>
                            <p className="text-muted-foreground">Total Hours: {timesheet.totals?.total_hours?.toFixed(2)}</p>
                          </div>
                          <Button onClick={() => handleSignClick(timesheet)}>
                            View and Sign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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

      {/* Timesheet Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-6">
          <DialogHeader>
            <DialogTitle>Review Timesheet</DialogTitle>
          </DialogHeader>
          {selectedTimesheet && (
            <div className="flex flex-col h-[calc(95vh-8rem)]">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(false)}
                className="mb-4"
              >
                Back to List
              </Button>
              <div className="flex-1 min-h-0">
                <PDFExportButton
                  employeeDetails={{
                    name: userInfo?.name || '',
                    surname: userInfo?.surname || '',
                    fullName: `${userInfo?.name || ''} ${userInfo?.surname || ''}`.trim()
                  }}
                  period={{
                    start: formatDate(selectedTimesheet.period?.start),
                    end: formatDate(selectedTimesheet.period?.end)
                  }}
                  entries={selectedTimesheet.entries || []}
                  totals={selectedTimesheet.totals || {}}
                  companyLogo={companyLogo}
                  employeeSignature={selectedTimesheet.employeeSignature}
                  showPreview={true}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-auto">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePreviewClose}>
                  Proceed to Sign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <TimesheetSignDialog
        open={showSignDialog}
        onClose={handleSignDialogClose}
        timesheet={selectedTimesheet}
        onSignComplete={() => {
          setShowSignDialog(false);
          setSelectedTimesheet(null);
          // Refresh the list of pending timesheets
          checkStatus();
        }}
      />
    </div>
  );
};

export default TabletClock;
