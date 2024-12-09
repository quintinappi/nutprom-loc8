import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

export { db, auth, storage };