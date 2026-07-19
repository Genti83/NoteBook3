const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Capacitor } from '@capacitor/core';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
try {
  enableIndexedDbPersistence(db).catch(console.error);
} catch (e) {}

let _auth;
try {
  _auth = initializeAuth(app, {
    persistence: Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence
  });
} catch (e) {
  _auth = getAuth(app);
}

export const auth = _auth;
auth.settings.appVerificationDisabledForTesting = true;
`;

fs.writeFileSync('src/lib/firebase.ts', code);
