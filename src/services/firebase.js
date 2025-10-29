import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBmanwerNXleJVM5ZVb2oqNYmXIkBULkwQ",

    authDomain: "tshwane-sinkhole-monitor.firebaseapp.com",
  
    projectId: "tshwane-sinkhole-monitor",
  
    storageBucket: "tshwane-sinkhole-monitor.firebasestorage.app",
  
    messagingSenderId: "744070080352",
  
    appId: "1:744070080352:web:ff303ee6221ec7a975e005",
  
    measurementId: "G-F2P27C9P3X"
  
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;