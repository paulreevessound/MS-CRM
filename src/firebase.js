import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
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

googleProvider.addScope('https://www.googleapis.com/auth/calendar');

// Use redirect instead of popup to avoid COOP/cross-origin issues
export const signInWithGoogle = () => signInWithRedirect(auth, googleProvider);
export { getRedirectResult };
export const signOutUser = () => signOut(auth);

export const loadUserData = async (uid) => {
  const ref = doc(db, 'users', uid, 'workboard', 'data');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().state : null;
};

export const saveUserData = async (uid, state) => {
  const ref = doc(db, 'users', uid, 'workboard', 'data');
  await setDoc(ref, { state, updatedAt: new Date().toISOString() });
};

export const loadUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const createUserProfile = async (uid, profile) => {
  const ref = doc(db, 'users', uid, 'profile', 'info');
  await setDoc(ref, profile, { merge: true });
};
