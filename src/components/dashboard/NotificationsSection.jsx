import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import NotificationCenter from '../NotificationCenter';

const NotificationsSection = ({ 
  notifications, 
  readNotifications, 
  onDeleteNotification, 
  onMarkAllAsRead, 
  users, 
  onCollapseMenu 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <NotificationCenter 
          notifications={notifications}
          readNotifications={readNotifications}
          onDeleteNotification={onDeleteNotification}
          onMarkAllAsRead={onMarkAllAsRead}
          users={users}
          onCollapseMenu={onCollapseMenu}
        />
      </CardContent>
    </Card>
  );
};

export default NotificationsSection;