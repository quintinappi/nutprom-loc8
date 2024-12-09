import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const NotificationCenter = ({ 
  notifications, 
  readNotifications, 
  onDeleteNotification, 
  onMarkAllAsRead, 
  users 
}) => {
  const [activeView, setActiveView] = useState('unread');

  const handleMarkAllRead = async () => {
    try {
      await onMarkAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const renderNotification = (notification) => (
    <div key={notification.id} className="p-4 border-b last:border-b-0">
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-600">{notification.message}</p>
        {activeView === 'unread' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDeleteNotification(notification.id)}
          >
            Mark as read
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(notification.timestamp?.toDate()).toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="unread" 
            onClick={() => setActiveView('unread')}
          >
            Unread ({notifications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="read" 
            onClick={() => setActiveView('read')}
          >
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread">
          <ScrollArea className="h-[300px] w-full rounded-md border">
            {notifications.length > 0 ? (
              <>
                <div className="flex justify-end p-2 border-b">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAllRead}
                  >
                    Mark all as read
                  </Button>
                </div>
                {notifications.map(renderNotification)}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No unread notifications
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="read">
          <ScrollArea className="h-[300px] w-full rounded-md border">
            {readNotifications.length > 0 ? (
              readNotifications.map(renderNotification)
            ) : (
              <div className="p-4 text-center text-gray-500">
                No read notifications
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;