import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDHrxLZEtg2HDDIaGFbji9NWjeIpXNXFXo",
  authDomain: "logger-791f8.firebaseapp.com",
  projectId: "logger-791f8",
  storageBucket: "logger-791f8.appspot.com",
  messagingSenderId: "221329878830",
  appId: "1:221329878830:web:945c6432a80a8492fe94bf",
  measurementId: "G-M8L6ECHTV1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Firebase persistence error:', err);
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser doesn\'t support persistence.');
  }
});

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
  if (user) {
    // Get new token if current one is about to expire
    user.getIdToken(true).then((token) => {
      console.log('Token refreshed successfully');
    }).catch((error) => {
      console.error('Error refreshing token:', error);
      // If token refresh fails, force re-login
      auth.signOut();
    });
  }
});

export { db, auth, storage };