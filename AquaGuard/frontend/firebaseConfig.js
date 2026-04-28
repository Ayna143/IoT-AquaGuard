// frontend/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

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

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Export the database so you can use it in index.tsx
export default app;