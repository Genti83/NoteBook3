import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
enableIndexedDbPersistence(db).catch(console.error);

export const auth = getAuth(app);
auth.settings.appVerificationDisabledForTesting = true;
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Firebase persistence error:", err);
});
