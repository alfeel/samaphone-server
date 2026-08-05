import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC4lo_pPVVA_ixAIybhNKwlLbReKr308eQ",
  authDomain: "sama-phone.firebaseapp.com",
  projectId: "sama-phone",
  storageBucket: "sama-phone.firebasestorage.app",
  messagingSenderId: "887727148149",
  appId: "1:887727148149:android:e74244d6a6ed5092eabc3c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
