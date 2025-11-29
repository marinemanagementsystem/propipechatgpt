import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Gerçek Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyCIwNaeWvkVGSq3EcWfRgRhWX_QQE6UaT8",
  authDomain: "propipechatgpt.firebaseapp.com",
  projectId: "propipechatgpt",
  storageBucket: "propipechatgpt.firebasestorage.app",
  messagingSenderId: "588287540532",
  appId: "1:588287540532:web:775a6b7228944393967961",
  measurementId: "G-E6LR54YB2F",
};

// Firebase başlangıcı
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export { analytics, firebaseConfig, app };
