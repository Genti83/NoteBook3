import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
console.log(auth ? 'Auth object created' : 'Auth object is null');
