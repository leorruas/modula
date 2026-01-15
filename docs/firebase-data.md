// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4_DUcQfMNQn1VHcw1QOSewHwEtm477nk",
  authDomain: "modula-app.firebaseapp.com",
  projectId: "modula-app",
  storageBucket: "modula-app.firebasestorage.app",
  messagingSenderId: "329207789560",
  appId: "1:329207789560:web:dbb2dc30ea8bad7dbc080d",
  measurementId: "G-5T5WHTP0LX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);