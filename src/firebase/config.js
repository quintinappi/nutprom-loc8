import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: "AIzaSyDHrxLZEtg2HDDIaGFbji9NWjeIpXNXFXo",
  authDomain: "logger-791f8.firebaseapp.com",
  projectId: "logger-791f8",
  storageBucket: "logger-791f8.appspot.com",
  messagingSenderId: "221329878830",
  appId: "1:221329878830:web:945c6432a80a8492fe94bf",
  measurementId: "G-M8L6ECHTV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence with proper error handling
try {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      toast.warning('Multiple tabs detected. Some offline features may be limited.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser doesn\'t support persistence');
      toast.warning('Your browser doesn\'t support offline mode.');
    }
  });
} catch (err) {
  console.error('Error enabling persistence:', err);
}

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('Firebase messaging not supported:', err);
}

// Function to get FCM token with proper error handling
export const getFCMToken = async () => {
  if (!messaging) return null;
  
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY'
    });
    return currentToken;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
};

// Export initialized services
export { db, auth, messaging };