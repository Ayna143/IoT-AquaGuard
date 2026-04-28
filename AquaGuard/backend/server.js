// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Load your downloaded Firebase Service Account Key
// Note: If you renamed keys.txt to a .json file, update the name here
const serviceAccount = require('./keys.txt'); 

// 2. Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.database();
const aquariumRef = db.ref('aquarium');

// 3. Backend Logic: Real-time Water Quality Monitoring
console.log("🌊 AquaGuard Backend is listening to sensor data...");

aquariumRef.on('value', (snapshot) => {
  const data = snapshot.val();
  
  if (data) {
    console.log(`[${new Date().toLocaleTimeString()}] Data Received - pH: ${data.ph}, Temp: ${data.temp}°C, TDS: ${data.tds}ppm`);

    // --- ALERT LOGIC ---
    // If the water gets too hot, too acidic, or too dirty, the backend catches it here.
    // In the future, you can add Twilio (SMS) or Nodemailer (Email) inside these blocks.
    
    if (data.temp > 28.0) {
      console.warn("⚠️ ALERT: Water temperature is too high!");
    }
    
    if (data.ph < 6.5 || data.ph > 8.0) {
      console.warn("⚠️ ALERT: pH level is outside safe parameters!");
    }

    if (data.tds > 400) {
      console.warn("⚠️ ALERT: Water is getting too cloudy (High TDS)!");
    }
  }
});

// 4. A simple API route just to check if the server is running
app.get('/status', (req, res) => {
  res.json({ status: "AquaGuard Backend is active and monitoring." });
});

// 5. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});