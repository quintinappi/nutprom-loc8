import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AuthForm from '../components/AuthForm';
import ClockingSystem from '../components/ClockingSystem';
import UserShifts from '../components/UserShifts';
import Navbar from '../components/Navbar';
import Settings from '../components/Settings';
import LoadingOverlay from '../components/LoadingOverlay';
import InstallPrompt from '../components/InstallPrompt';
import UserManagement from '../components/UserManagement';
import AllUsersClockingHistory from '../components/AllUsersClockingHistory';
import MapPopup from '../components/MapPopup';
import NotificationCenter from '../components/NotificationCenter';
import TotalHoursPage from '../components/TotalHoursPage';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebaseAuth } from '../firebase/auth';
import { db } from '../firebase/config';
import { doc, getDoc, collection, setDoc, query, where, onSnapshot, getDocs, writeBatch, Timestamp, updateDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { syncClockEntries } from '../utils/offlineSync';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClockingAnimation = ({ isVisible, action }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed top-20 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg"
      >
        Successfully clocked {action}!
      </motion.div>
    )}
  </AnimatePresence>
);

const Index = () => {
  const { user, loading, logout } = useFirebaseAuth();
  const [userRole, setUserRole] = useState(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [activeTab, setActiveTab] = useState('clock');
  const [showClockingAnimation, setShowClockingAnimation] = useState(false);
  const [clockingAction, setClockingAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [clockStatus, setClockStatus] = useState('');
  const [currentShiftDuration, setCurrentShiftDuration] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState({});
  const [readNotifications, setReadNotifications] = useState([]);

  const fetchUsers = useCallback(async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = {};
    usersSnapshot.forEach(doc => {
      usersData[doc.id] = { 
        name: doc.data().name, 
        surname: doc.data().surname,
        email: doc.data().email,
        avatar_url: doc.data().avatar_url
      };
    });
    setUsers(usersData);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && userRole === 'admin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('readAt', '==', null)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsList);
      });

      return () => unsubscribe();
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const syncOfflineData = async () => {
    try {
      setIsLoading(true);
      const syncResult = await syncClockEntries();
      if (syncResult.success) {
        console.log('Offline data synced successfully');
        toast.success('Offline data synced successfully');
      } else {
        console.error('Error syncing offline data:', syncResult.error);
        toast.error('Failed to sync offline data');
      }
    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || 'user');
          setName(userData.name || '');
          setSurname(userData.surname || '');
          setProfilePic(userData.avatar_url || null);
          
          if (!userData.name || !userData.surname || !userData.avatar_url) {
            const message = 'Please complete your profile in the settings.';
            await addNotification(message, 'profileIncomplete');
          }
        } else {
          setUserRole('user');
        }
      }
    };
    if (!loading) {
      fetchUserData();
    }
  }, [user, loading]);

  useEffect(() => {
    if (isOnline && user) {
      syncOfflineData();
    }
  }, [isOnline, user]);

  const handleLogout = () => {
    logout();
  };

  const handleClockAction = (action) => {
    setClockingAction(action);
    setShowClockingAnimation(true);
    setTimeout(() => setShowClockingAnimation(false), 3000);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setName(updatedProfile.name);
    setSurname(updatedProfile.surname);
    setProfilePic(updatedProfile.avatar_url);
  };

  const handleInstallPromptDismiss = () => {
    setShowInstallPrompt(false);
  };

  const handleClockStatusUpdate = (status, duration) => {
    setClockStatus(status);
    setCurrentShiftDuration(duration);
  };

  const handleLocationClick = (data) => {
    console.log('Location data received:', data); // Debug log
    setSelectedLocation(data);
    setIsMapOpen(true);
  };

  const handleUnclockedUsers = async (unclockedUsersList) => {
    if (unclockedUsersList.length > 0) {
      const message = `${unclockedUsersList.length} user(s) haven't clocked out in the last 24 hours.`;
      await addNotification(message, 'unclockedUsers', unclockedUsersList);
    }
  };

  const handleLongShifts = async (longShiftsList) => {
    if (longShiftsList.length > 0) {
      const message = `${longShiftsList.length} user(s) have been clocked in for over 12 hours.`;
      await addNotification(message, 'longShift', longShiftsList);
    }
  };

  const addNotification = async (message, type, users = []) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('type', '==', type),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );
      
      const existingNotifications = await getDocs(q);
      
      if (!existingNotifications.empty) {
        const notification = existingNotifications.docs[0].data();
        
        if (!notification.readAt) {
          console.log('Active unread notification exists. Skipping.');
          return;
        }
        
        if (notification.readAt && new Date(notification.readAt.toDate()).toDateString() === today.toDateString()) {
          console.log('Notification already acknowledged today. Skipping.');
          return;
        }
      }

      await setDoc(doc(collection(db, 'notifications')), {
        userId: user.uid,
        message,
        timestamp: Timestamp.now(),
        type,
        users,
        readAt: null,
        status: 'unread',
        acknowledgedDates: [],
        repeated: false
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Failed to add notification');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const now = Timestamp.now();
      
      await updateDoc(notificationRef, { 
        readAt: now,
        status: 'read',
        acknowledgedDates: arrayUnion(now)
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      setIsLoading(true);
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      notifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { 
          readAt: now,
          status: 'read',
          acknowledgedDates: arrayUnion(now)
        });
      });
      
      await batch.commit();
      setNotifications([]);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserDeleted = useCallback(() => {
    // Implement user deletion logic here
    console.log('User deleted');
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    
    const setupReadNotificationsListener = async () => {
      if (!user || userRole !== 'admin') return;

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('status', '==', 'read'),
        orderBy('readAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReadNotifications(notificationsList);
      });
    };

    setupReadNotificationsListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, userRole]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthForm />;

  const isLongShift = currentShiftDuration >= 12;

  const renderDashboardContent = () => {
    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shifts">Shifts & History</TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="all-users">All Users</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Card */}
            <Card className="col-span-1 md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <Logo size="large" />
                  <div className={`mt-4 flex flex-col items-center ${isLongShift ? 'bg-red-100 p-4 rounded' : ''}`}>
                    <Avatar className="w-24 h-24 mb-2">
                      <AvatarImage src={profilePic} alt={`${name} ${surname}`} className="object-cover" />
                      <AvatarFallback>{name.charAt(0)}{surname.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold">{name} {surname}</h2>
                    <p className="text-sm text-gray-600 mt-1">Status: {clockStatus}</p>
                    {isLongShift && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>
                          Warning: Current shift exceeds 12 hours!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clocking Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Clock In/Out</h3>
                <ClockingSystem 
                  userId={user.uid} 
                  userRole={userRole} 
                  onClockAction={handleClockAction} 
                  setIsLoading={setIsLoading}
                  isOnline={isOnline}
                  onStatusUpdate={handleClockStatusUpdate}
                  hideHeader={true}
                />
              </CardContent>
            </Card>

            {/* Notifications Card (Admin Only) */}
            {userRole === 'admin' && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                  <NotificationCenter 
                    notifications={notifications}
                    readNotifications={readNotifications}
                    onDeleteNotification={handleDeleteNotification}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    users={users}
                    onCollapseMenu={() => setActiveTab('clock')}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shifts">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Shifts & History</h3>
              <UserShifts 
                userId={user.uid} 
                userRole={userRole} 
                onUnclockedUsers={handleUnclockedUsers}
                onLongShifts={handleLongShifts}
                showHistory={true}
                showLocation={true}
                onLocationClick={handleLocationClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="all-users">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">All Users Activity</h3>
                <AllUsersClockingHistory onLocationClick={handleLocationClick} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'clock':
        return renderDashboardContent();
      case 'total-hours':
        return <TotalHoursPage />;
      case 'users':
        return userRole === 'admin' ? <UserManagement onUserDeleted={handleUserDeleted} /> : null;
      case 'settings':
        return (
          <Settings 
            onProfileUpdate={handleProfileUpdate} 
            setIsLoading={setIsLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <LoadingOverlay isLoading={isLoading} />
      <Navbar 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mx-auto mt-16 mb-8 bg-white">
          <CardContent className="pt-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
      <ClockingAnimation isVisible={showClockingAnimation} action={clockingAction} />
      {showInstallPrompt && <InstallPrompt onDismiss={handleInstallPromptDismiss} />}
      <MapPopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        location={selectedLocation?.location}
        coordinates={selectedLocation?.coordinates}
      />
      <Footer />
    </div>
  );
};

export default Index;
