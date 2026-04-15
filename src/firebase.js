import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCzMTqJKRMxqTDZcMUbJ_BEBPFXjx9Ego4",
  authDomain: "ms-crm-26eaa.firebaseapp.com",
  projectId: "ms-crm-26eaa",
  storageBucket: "ms-crm-26eaa.firebasestorage.app",
  messagingSenderId: "816183016490",
  appId: "1:816183016490:web:9847f1a49b7aec5ccbd753",
  measurementId: "G-XNHDJ1WWWG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Request Google Calendar scope at sign-in
googleProvider.addScope('https://www.googleapis.com/auth/calendar');

// Sign in with Google popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Sign out
export const signOutUser = () => signOut(auth);

// Load a user's workboard data from Firestore
export const loadUserData = async (uid) => {
  const ref = doc(db, 'users', uid, 'workboard', 'data');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().state : null;
};

// Save a user's workboard data to Firestore
export const saveUserData = async (uid, state) => {
  const ref = doc(db, 'users', uid, 'workboard', 'data');
  await setDoc(ref, { state, updatedAt: new Date().toISOString() });
};

// Load user profile (role etc)
export const loadUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// Create user profile on first sign-in
export const createUserProfile = async (uid, profile) => {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  await setDoc(ref, profile, { merge: true });
};
