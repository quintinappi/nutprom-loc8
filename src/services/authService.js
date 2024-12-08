import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const authService = {
  async signIn(email, password) {
    console.log('AuthService: Attempting sign in for email:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthService: Sign in successful for user:', userCredential.user.uid);
      
      // Verify and create user document if it doesn't exist
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        console.log('AuthService: Creating user document for new user');
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('AuthService: Sign in failed:', error);
      throw error;
    }
  },

  async signUp(email, password) {
    console.log('AuthService: Attempting sign up for email:', email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('AuthService: Sign up successful for user:', userCredential.user.uid);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      
      return userCredential.user;
    } catch (error) {
      console.error('AuthService: Sign up failed:', error);
      throw error;
    }
  },

  async signOut() {
    console.log('AuthService: Attempting sign out');
    try {
      await signOut(auth);
      console.log('AuthService: Sign out successful');
    } catch (error) {
      console.error('AuthService: Sign out failed:', error);
      throw error;
    }
  }
};