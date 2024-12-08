import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSection from './ProfileSection';
import NotificationsSection from './NotificationsSection';
import ClockingSystem from '../ClockingSystem';
import UserShifts from '../UserShifts';
import AllUsersClockingHistory from '../AllUsersClockingHistory';

const DashboardContent = ({ 
  user,
  userRole,
  name,
  surname,
  profilePic,
  clockStatus,
  isLongShift,
  notifications,
  readNotifications,
  handleDeleteNotification,
  handleMarkAllNotificationsAsRead,
  users,
  onCollapseMenu,
  handleUnclockedUsers,
  handleLongShifts,
  handleLocationClick,
  setClockingAction,
  setIsLoading,
  isOnline,
  setClockStatus
}) => {
  if (!user) {
    return null;
  }

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
          <ProfileSection 
            name={name}
            surname={surname}
            profilePic={profilePic}
            clockStatus={clockStatus}
            isLongShift={isLongShift}
          />

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Clock In/Out</h3>
              <ClockingSystem 
                userId={user.uid} 
                userRole={userRole} 
                onClockAction={setClockingAction} 
                setIsLoading={setIsLoading}
                isOnline={isOnline}
                onStatusUpdate={setClockStatus}
                hideHeader={true}
              />
            </CardContent>
          </Card>

          {userRole === 'admin' && (
            <NotificationsSection 
              notifications={notifications}
              readNotifications={readNotifications}
              onDeleteNotification={handleDeleteNotification}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              users={users}
              onCollapseMenu={onCollapseMenu}
            />
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

export default DashboardContent;