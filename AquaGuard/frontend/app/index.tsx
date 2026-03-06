import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar } from 'react-native';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// 1. Your Firebase Configuration
const firebaseConfig = {
  databaseURL: "https://aquaguards-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function Index() {
  const [waterData, setWaterData] = useState({ temp: 0, ph: 0, tds: 0 });

  useEffect(() => {
    // 2. Listen to the "aquarium" path in your database
    const dataRef = ref(db, 'aquarium/');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setWaterData({
          temp: data.temp || 0,
          ph: data.ph || 0,
          tds: data.tds || 0,
        });
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>AquaGuard Live</Text>
      
      <View style={styles.cardContainer}>
        <DataCard label="Temperature" value={waterData.temp} unit="°C" color="#FF6B6B" />
        <DataCard label="pH Level" value={waterData.ph} unit="" color="#4ECDC4" />
        <DataCard label="TDS (Solids)" value={waterData.tds} unit="ppm" color="#45B7D1" />
      </View>
    </SafeAreaView>
  );
}

// Simple component for the Dashboard Cards
const DataCard = ({ label, value, unit, color }: any) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value.toFixed(1)} {unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F3F7', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 40, marginBottom: 20, textAlign: 'center' },
  cardContainer: { width: '100%', gap: 15 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, borderLeftWidth: 10, elevation: 4 },
  label: { fontSize: 14, color: '#636E72', fontWeight: '600' },
  value: { fontSize: 32, fontWeight: 'bold', color: '#2D3436', marginTop: 5 }
});