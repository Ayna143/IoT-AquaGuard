// frontend/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// These values come from your Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBdns4AdQw_1BzKrvM7voAjkMaLjvOduiA",
  authDomain: "aquaguards-iot.firebaseapp.com",
  databaseURL: "https://aquaguards-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aquaguards-iot",
  storageBucket: "aquaguards-iot.firebasestorage.app",
  messagingSenderId: "381492313687",
  appId: "1:381492313687:web:f3ec0f288e4a9daed82d12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database so you can use it in index.tsx
export const database = getDatabase(app);