// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCgnxOcM5CEgnqIAvOIMjf6PoU2g5UWcK0",
  authDomain: "high-score-health.firebaseapp.com",
  projectId: "high-score-health",
  storageBucket: "high-score-health.firebasestorage.app",
  messagingSenderId: "391154255146",
  appId: "1:391154255146:web:dc80892568109993d50a53",
  measurementId: "G-MYZB74DNWH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export for use in other files
export { db, auth, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };