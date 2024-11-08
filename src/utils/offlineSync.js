import { openDB } from 'idb';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const DB_NAME = 'offlineClockingDB';
const STORE_NAME = 'clockEntries';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
      store.createIndex('user_id', 'user_id');
    },
  });
}

export async function addOfflineClockEntry(entry) {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
}

export async function getOfflineClockEntries() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removeOfflineClockEntry(timestamp) {
  const db = await getDB();
  await db.delete(STORE_NAME, timestamp);
}

export async function syncClockEntries() {
  const offlineDB = await getDB();
  const clockEntriesCollection = collection(db, 'clock_entries');
  
  const entries = await offlineDB.getAll(STORE_NAME);
  const syncedEntries = [];

  for (const entry of entries) {
    const q = query(
      clockEntriesCollection,
      where('user_id', '==', entry.user_id),
      where('action', '==', entry.action),
      where('timestamp', '==', entry.timestamp)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(clockEntriesCollection, entry);
      syncedEntries.push(entry.timestamp);
    } else {
      console.log('Duplicate entry found, skipping:', entry);
      syncedEntries.push(entry.timestamp);
    }
  }

  for (const timestamp of syncedEntries) {
    await removeOfflineClockEntry(timestamp);
  }

  return { success: true, syncedCount: syncedEntries.length };
}