import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

export const useClockEntries = () => {
  const getClockEntriesInRange = async (startDate, endDate, userId) => {
    try {
      console.log('Fetching clock entries:', { startDate, endDate, userId });
      const clockEntriesRef = collection(db, 'clock_entries');
      const q = query(
        clockEntriesRef,
        where('user_id', '==', userId),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));
      
      console.log('Fetched entries:', entries);
      return entries;
    } catch (error) {
      console.error('Error fetching clock entries:', error);
      throw error;
    }
  };

  return { getClockEntriesInRange };
};