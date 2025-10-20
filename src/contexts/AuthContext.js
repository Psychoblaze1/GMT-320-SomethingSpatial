// Authentication context - manages user login/signup and admin permissions
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Loader from '../components/Loader/Loaderr';

const AuthContext = createContext();

// Hook to access auth functions and user data from anywhere
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create a new user account and save to database
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Save user info to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        displayName,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  // Get user's role from database and check if they're an admin
  async function fetchUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setIsAdmin(userData.role === 'admin');

        // Automatically grant admin to brandon.cooley@live.com
        if (userData.email.toLowerCase() === 'brandon.cooley@live.com' && userData.role !== 'admin') {
          await setDoc(doc(db, "users", uid), {
            ...userData,
            role: 'admin'
          });
          setUserRole('admin');
          setIsAdmin(true);
        }

        if (userData.email.toLowerCase() === 'zii010817@gmail.com' && userData.role !== 'admin') 
        {
          await setDoc(doc(db, "users", uid), {
            ...userData,
            role: 'admin'
          });
          setUserRole('admin');
          setIsAdmin(true)
        }

      }
    } 
      catch (error) {
      console.error("Error fetching user role:", error);
    }
  }

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserRole(user.uid);
      } else {
        setUserRole('user');
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isAdmin,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader message="Starting app — please wait…" /> : children}
    </AuthContext.Provider>
  );
}