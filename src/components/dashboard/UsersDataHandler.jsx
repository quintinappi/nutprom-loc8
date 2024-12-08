import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';

const UsersDataHandler = ({ isOnline, retryAttempts, setRetryAttempts, setUsers }) => {
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOnline) {
        console.log('Offline: Using cached data if available');
        return;
      }

      try {
        console.log('Fetching users data...');
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
        console.log('Users data fetched successfully:', Object.keys(usersData).length, 'users');
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        if (retryAttempts < 3) {
          setTimeout(() => {
            setRetryAttempts(prev => prev + 1);
          }, 1000 * (retryAttempts + 1));
        } else {
          toast.error('Failed to fetch users. Please check your connection.');
        }
      }
    };

    fetchUsers();
  }, [isOnline, retryAttempts, setRetryAttempts, setUsers]);

  return null;
};

export default UsersDataHandler;