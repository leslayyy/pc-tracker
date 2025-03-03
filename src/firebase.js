// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBh4xrDGId-_rmRWquRKYk2wjjpYHS5vo0",
  authDomain: "pc-tracker-a8d16.firebaseapp.com",
  projectId: "pc-tracker-a8d16",
  storageBucket: "pc-tracker-a8d16.appspot.com",
  messagingSenderId: "1023193658391",
  appId: "1:1023193658391:web:e3080c340064cbab6fd852",
  measurementId: "G-V0L1JS4BSZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
