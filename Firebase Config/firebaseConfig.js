// npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIwNaeWvkVGSq3EcWfRgRhWX_QQE6UaT8",
  authDomain: "propipechatgpt.firebaseapp.com",
  projectId: "propipechatgpt",
  storageBucket: "propipechatgpt.firebasestorage.app",
  messagingSenderId: "588287540532",
  appId: "1:588287540532:web:775a6b7228944393967961",
  measurementId: "G-E6LR54YB2F",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };
