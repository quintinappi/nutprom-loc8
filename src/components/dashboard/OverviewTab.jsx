import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from '../Logo';
import ClockingSystem from '../ClockingSystem';
import NotificationCenter from '../NotificationCenter';

const OverviewTab = ({ 
  user, 
  name, 
  surname, 
  profilePic, 
  clockStatus, 
  isLongShift, 
  userRole, 
  handleClockAction, 
  setIsLoading, 
  isOnline, 
  handleClockStatusUpdate,
  notifications,
  readNotifications,
  handleDeleteNotification,
  handleMarkAllAsRead,
  users
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {userRole === 'admin' && (
        <Card>
          <CardContent className="pt-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <NotificationCenter 
              notifications={notifications}
              readNotifications={readNotifications}
              onDeleteNotification={handleDeleteNotification}
              onMarkAllAsRead={handleMarkAllAsRead}
              users={users}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverviewTab;