import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// 1. Import the specific Firebase functions we need
import { ref, onValue } from 'firebase/database';
// 2. Import the database object YOU created in firebaseConfig.js
import { database } from '../firebaseConfig'; 

export default function AquaGuardDashboard() {
  // 3. Create a place to store the sensor data in the app's memory
  const [readings, setReadings] = useState({ ph: 0, tds: 0, temp: 0, status: "Connecting..." });

  useEffect(() => {
    // 4. Point to the "aquarium" node (where your ESP32 is sending data)
    const aquariumRef = ref(database, 'aquarium/');

    // 5. Start the "Live Listen"
    // Every time the ESP32 updates Firebase, this function runs automatically!
    const unsubscribe = onValue(aquariumRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReadings(data);
      }
    });

    // Clean up the listener when the app closes
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AquaGuard Live</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>pH Level: <Text style={styles.value}>{readings.ph.toFixed(2)}</Text></Text>
        <Text style={styles.label}>TDS: <Text style={styles.value}>{readings.tds} ppm</Text></Text>
        <Text style={styles.label}>Temperature: <Text style={styles.value}>{readings.temp}°C</Text></Text>
      </View>

      <Text style={[styles.status, { color: readings.status === 'Healthy' ? '#2ecc71' : '#e74c3c' }]}>
        System Status: {readings.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 5, width: '80%' },
  label: { fontSize: 18, marginVertical: 5 },
  value: { fontWeight: 'bold', color: '#3498db' },
  status: { marginTop: 20, fontSize: 18, fontWeight: 'bold' }
});