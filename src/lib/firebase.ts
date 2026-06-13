import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging: Messaging | null = null;
export let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  // Only initialize if config is present (to avoid crashing if user hasn't set env vars)
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Messaging is only supported in browser contexts that support the required APIs
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(app);
    }
  }
} catch (error) {
  console.warn('Failed to initialize Firebase:', error);
}

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not initialized');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_FIREBASE_VAPID_KEY is missing. Cannot generate FCM token.');
        return null;
      }
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token generated:', token);
      // In a real app, you would send this token to your backend (e.g., Supabase) to save it for this user.
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const setupMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { messaging };
