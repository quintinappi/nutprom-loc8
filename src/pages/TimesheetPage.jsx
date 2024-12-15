import React, { useState } from 'react';
import { useFirebaseAuth } from '../firebase/auth';
import { Navigate } from 'react-router-dom';
import TimesheetManager from '../components/timesheet/TimesheetManager';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

const TimesheetPage = () => {
  const { user, userRole } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('timesheet');

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (userRole !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
      />
      <div className="container mx-auto py-6 px-4">
        <TimesheetManager />
      </div>
    </div>
  );
};

export default TimesheetPage;
