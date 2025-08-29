
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nirvana-0101.firebaseapp.com",
  projectId: "nirvana-0101",
  storageBucket: "nirvana-0101.firebasestorage.app",
  messagingSenderId: "602174755349",
  appId: "1:602174755349:web:17e67db98cbc5e249d741c",
  measurementId: "G-YV6K0L8TSZ"
};

const appAuth = initializeApp(firebaseConfig);

export const analytics = getAnalytics(appAuth);

export const auth = getAuth(appAuth);
export const db = getFirestore(appAuth);

export default appAuth;
