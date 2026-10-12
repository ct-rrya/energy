/**
 * Firebase Client SDK Initialization
 * 
 * Initializes Firebase for frontend real-time Firestore updates.
 * Used ONLY for reading live sensor data from Firestore cache.
 * 
 * Security:
 * - API key is safe to expose (public by design)
 * - Write access controlled by Firestore security rules
 * - Backend service account handles all writes
 * 
 * Data Flow:
 * - Frontend: Read from liveReadings/latest (real-time listener)
 * - Backend: Write to liveReadings/latest (service account)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Log initialization (development only)
if (import.meta.env.DEV) {
  console.log('[Firebase] Initialized for project:', firebaseConfig.projectId);
}
