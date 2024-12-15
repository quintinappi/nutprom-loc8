import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from './config';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { BrowserRouter, useNavigate } from 'react-router-dom';

const FirebaseAuthContext = createContext();

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole('user'); // Default role
        }
      } else {
        setUserRole(null);
        navigate('/login'); // Redirect to login page when user is null
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: 'user' // Default role for new users
    });
    navigate('/');
    return userCredential;
  };

  const logout = async () => {
    try {
      console.log('Firebase: Starting logout process');
      await signOut(auth);
      console.log('Firebase: Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('Firebase: Logout failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    login,
    signup,
    logout
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  return useContext(FirebaseAuthContext);
};

export const FirebaseAuthUI = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signup } = useFirebaseAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border rounded"
        required
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        {isSignUp ? 'Sign Up' : 'Log In'}
      </button>
      <p className="text-center">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="ml-2 text-blue-500"
        >
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </form>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <FirebaseAuthProvider>
        {/* Your app components here */}
      </FirebaseAuthProvider>
    </BrowserRouter>
  );
};

export default App;