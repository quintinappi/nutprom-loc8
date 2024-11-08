import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

export const useClockEntries = () => {
  const getClockEntriesInRange = async (startDate, endDate, userId) => {
    try {
      let q = query(
        collection(db, 'clock_entries'),
        where('timestamp', '>=', startDate.toISOString()),
        where('timestamp', '<=', endDate.toISOString()),
        orderBy('timestamp')
      );

      if (userId) {
        q = query(q, where('user_id', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        user: doc.data().user || {} // Assuming user data is nested in the clock entry
      }));

      return entries;
    } catch (error) {
      throw new Error(`Error fetching clock entries: ${error.message}`);
    }
  };

  return { getClockEntriesInRange };
};