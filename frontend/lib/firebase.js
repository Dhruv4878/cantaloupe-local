// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZascMq3COGtR-D4oPYRqey5DEeFnbrbg",
  authDomain: "chatbotpostgenerator-fe9ac.firebaseapp.com",
  projectId: "chatbotpostgenerator-fe9ac",
  storageBucket: "chatbotpostgenerator-fe9ac.firebasestorage.app",
  messagingSenderId: "248918770067",
  appId: "1:248918770067:web:df824326f6698d0f4b6866",
  measurementId: "G-8XKNYK58ZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);