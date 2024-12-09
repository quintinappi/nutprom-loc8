import { deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function removeDuplicateEntries(entries) {
  const uniqueEntries = [];
  const seenEntries = new Map();
  const batch = writeBatch(db);

  for (const entry of entries) {
    const entryKey = `${entry.user_id}-${entry.action}-${entry.timestamp}`;
    if (!seenEntries.has(entryKey)) {
      seenEntries.set(entryKey, entry);
      uniqueEntries.push(entry);
    } else {
      // Mark duplicate for deletion
      batch.delete(doc(db, 'clock_entries', entry.id));
    }
  }

  try {
    // Execute batch delete
    await batch.commit();
    console.log(`Deleted ${entries.length - uniqueEntries.length} duplicate entries`);
  } catch (error) {
    console.error('Error deleting duplicate entries:', error);
  }

  return uniqueEntries;
}