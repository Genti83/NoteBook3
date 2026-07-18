import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
enableIndexedDbPersistence(db).catch(console.error);

let _auth;
try {
    _auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
    });
} catch (e) {
    _auth = getAuth(app);
}
export const auth = _auth;
auth.settings.appVerificationDisabledForTesting = true;
