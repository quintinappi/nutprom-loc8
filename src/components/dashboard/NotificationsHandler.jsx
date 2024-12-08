import { useEffect } from 'react';
import { collection, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const NotificationsHandler = ({ user, userRole, setNotifications }) => {
  useEffect(() => {
    if (user && userRole === 'admin') {
      console.log('Setting up notifications listener for admin user:', user.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('readAt', '==', null)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Notifications snapshot received:', querySnapshot.size, 'notifications');
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsList);
      }, (error) => {
        console.error('Error in notifications listener:', error);
      });

      return () => unsubscribe();
    }
  }, [user, userRole, setNotifications]);

  return null;
};

export default NotificationsHandler;