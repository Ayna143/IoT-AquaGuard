import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig'; // Ensure your config path is correct

export default function Dashboard() {
  const [data, setData] = useState({ ph: 0, tds: 0, temp: 0, status: 'Loading...' });

  useEffect(() => {
    const aquariumRef = ref(database, 'aquarium/');
    
    // This creates a "Live" listener
    const unsubscribe = onValue(aquariumRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AquaGuard Live</Text>
      
      <View style={styles.card}>
        <Text>pH Level: {data.ph.toFixed(2)}</Text>
        <Text>TDS: {data.tds} ppm</Text>
        <Text>Temp: {data.temp}°C</Text>
        <Text style={{ color: data.status === 'Healthy' ? 'green' : 'red' }}>
          Status: {data.status}
        </Text>
      </View>
    </View>
  );
}