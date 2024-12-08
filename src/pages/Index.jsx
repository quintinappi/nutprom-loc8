import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AuthForm from '../components/AuthForm';
import UserManagement from '../components/UserManagement';
import TotalHoursPage from '../components/TotalHoursPage';
import Settings from '../components/Settings';
import LoadingOverlay from '../components/LoadingOverlay';
import InstallPrompt from '../components/InstallPrompt';
import MapPopup from '../components/MapPopup';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import DashboardContent from '../components/dashboard/DashboardContent';
import NotificationsHandler from '../components/dashboard/NotificationsHandler';
import UsersDataHandler from '../components/dashboard/UsersDataHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebaseAuth } from '../firebase/auth';
import { toast } from 'sonner';

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
  const { user, loading, logout, userRole } = useFirebaseAuth();
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
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryAttempts(0);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingOverlay isLoading={true} />;
    }

    if (!user) {
      return <AuthForm />;
    }

    switch (activeTab) {
      case 'clock':
        return (
          <DashboardContent
            user={user}
            userRole={userRole}
            name={name}
            surname={surname}
            profilePic={profilePic}
            clockStatus={clockStatus}
            isLongShift={currentShiftDuration >= 12}
            notifications={notifications}
            readNotifications={readNotifications}
            handleDeleteNotification={() => {}}
            handleMarkAllNotificationsAsRead={() => {}}
            users={users}
            onCollapseMenu={() => setActiveTab('clock')}
            handleUnclockedUsers={() => {}}
            handleLongShifts={() => {}}
            handleLocationClick={(location) => {
              setSelectedLocation(location);
              setIsMapOpen(true);
            }}
            setClockingAction={setClockingAction}
            setIsLoading={setIsLoading}
            isOnline={isOnline}
            setClockStatus={setClockStatus}
          />
        );
      case 'total-hours':
        return <TotalHoursPage />;
      case 'users':
        return userRole === 'admin' ? <UserManagement onUserDeleted={() => {}} /> : null;
      case 'settings':
        return (
          <Settings 
            onProfileUpdate={() => {}} 
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
      <NotificationsHandler 
        user={user}
        userRole={userRole}
        setNotifications={setNotifications}
      />
      <UsersDataHandler 
        isOnline={isOnline}
        retryAttempts={retryAttempts}
        setRetryAttempts={setRetryAttempts}
        setUsers={setUsers}
      />
      <Navbar 
        onLogout={logout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mx-auto mt-16 mb-8 bg-white">
          <CardContent className="pt-8">
            {!isOnline && (
              <div className="bg-yellow-500 text-white p-2 text-center mb-4 rounded">
                You are currently offline. Some features may be limited.
              </div>
            )}
            {renderContent()}
          </CardContent>
        </Card>
      </div>
      <ClockingAnimation isVisible={showClockingAnimation} action={clockingAction} />
      {showInstallPrompt && <InstallPrompt onDismiss={() => setShowInstallPrompt(false)} />}
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