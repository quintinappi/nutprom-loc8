import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useFirebaseAuth } from '../firebase/auth';
import { db } from '../firebase/config';
import { doc, getDoc, collection, setDoc, query, where, onSnapshot, getDocs, writeBatch, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import AuthForm from '../components/AuthForm';
import Navbar from '../components/Navbar';
import LoadingOverlay from '../components/LoadingOverlay';
import InstallPrompt from '../components/InstallPrompt';
import MapPopup from '../components/MapPopup';
import Footer from '../components/Footer';
import { syncClockEntries } from '../utils/offlineSync';
import OverviewTab from '../components/dashboard/OverviewTab';
import ShiftsTab from '../components/dashboard/ShiftsTab';
import AllUsersTab from '../components/dashboard/AllUsersTab';

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

        <TabsContent value="overview">
          <OverviewTab 
            user={user}
            name={name}
            surname={surname}
            profilePic={profilePic}
            clockStatus={clockStatus}
            isLongShift={isLongShift}
            userRole={userRole}
            handleClockAction={handleClockAction}
            setIsLoading={setIsLoading}
            isOnline={isOnline}
            handleClockStatusUpdate={handleClockStatusUpdate}
            notifications={notifications}
            readNotifications={readNotifications}
            handleDeleteNotification={handleDeleteNotification}
            handleMarkAllAsRead={handleMarkAllNotificationsAsRead}
            users={users}
          />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftsTab 
            userId={user.uid}
            userRole={userRole}
            handleUnclockedUsers={handleUnclockedUsers}
            handleLongShifts={handleLongShifts}
            handleLocationClick={handleLocationClick}
          />
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="all-users">
            <AllUsersTab handleLocationClick={handleLocationClick} />
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
