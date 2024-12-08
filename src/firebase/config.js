import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

let app;
let auth;
let db;

try {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  toast.error('Error initializing application. Please refresh the page.');
}

export { db, auth };