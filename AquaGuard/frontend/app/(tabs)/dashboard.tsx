// app/(tabs)/dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Firebase Imports
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../../firebaseConfig'; 

// Shared Components & Mock Data
import { Card, ScreenHeader, StatusBadge, T, TANKS } from './shared';
import ViewTankScreen from './view-tank';

// Helper component for the small stat displays
function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardTab() {
  const [activeTank, setActiveTank] = useState<any>(null);
  const [liveTanks, setLiveTanks] = useState(TANKS);
  
  // This cooldown timer prevents the app from spamming the database with alerts
  const lastAlarmTime = useRef<number>(0); 

  useEffect(() => {
    // Listen to the live aquarium data from the ESP32
    const tankRef = ref(database, 'aquarium/');

    const unsubscribe = onValue(tankRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        
        // --- 1. DETERMINE TANK HEALTH ---
        let currentStatus = 'GOOD';
        
        if (data.ph > 8.0 || data.ph < 6.5) {
          currentStatus = 'CRITICAL';
          
          // --- 2. AUTOMATIC LOGGING ---
          const now = Date.now();
          // Check if 5 minutes (300,000 ms) have passed since the last logged alert
          if (now - lastAlarmTime.current > 300000) {
            lastAlarmTime.current = now; 

            // Create a new entry in the activity_logs folder
            const newLogRef = push(ref(database, 'activity_logs/'));
            
            set(newLogRef, {
              id: now.toString(),
              tank: "Fish Tank 1",
              event: `Critical pH Alert: ${data.ph}`,
              time: new Date().toLocaleString(),
              status: "CRITICAL"
            });
          }
        } else if (data.ph >= 7.6 || data.ph <= 6.7) {
          currentStatus = 'CAUTION';
        }

        // --- 3. UPDATE THE DASHBOARD UI ---
        setLiveTanks(currentTanks => 
          currentTanks.map(tank => 
            tank.name === "Fish Tank 1" 
              ? { 
                  ...tank, 
                  ph: data.ph ?? tank.ph, 
                  temp: data.temp ?? tank.temp, 
                  // Use Math.round() instead of .toFixed(0) so it stays a Number!
                  clarity: data.tds ? Math.round(Math.max(0, 100 - (data.tds / 10))) : tank.clarity,
                  status: currentStatus 
                }
              : tank
          )
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Navigation Logic
  if (activeTank) {
    return <ViewTankScreen tank={activeTank} onBack={() => setActiveTank(null)} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="My Tanks"
        subtitle={`${liveTanks.length} tanks monitored · Live`}
        right={
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.list}>
        {liveTanks.map(tank => (
          <TouchableOpacity 
            key={tank.id} 
            onPress={() => setActiveTank(tank)} 
            activeOpacity={0.85}
          >
            <Card style={styles.tankCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.tankName}>{tank.name}</Text>
                  <Text style={styles.tankSub}>{tank.type} · Sensor {tank.sensor}</Text>
                </View>
                <StatusBadge status={tank.status} />
              </View>

              <View style={styles.statsRow}>
                <StatPill 
                  label="PH" 
                  value={typeof tank.ph === 'number' ? tank.ph.toFixed(1) : tank.ph} 
                />
                <View style={styles.divider} />
                <StatPill 
                  label="TEMP" 
                  value={`${tank.temp}°C`} 
                />
                <View style={styles.divider} />
                <StatPill 
                  label="CLARITY" 
                  value={`${tank.clarity}%`} 
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  list: { padding: 16, gap: 12 },
  tankCard: { gap: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: 12 },
  tankName: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  tankSub: { color: T.textSec, fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: T.blueLight, borderRadius: 10, padding: 12, alignItems: 'center' },
  divider: { width: 1, height: 28, backgroundColor: T.border, marginHorizontal: 8 },
  pill: { flex: 1, alignItems: 'center' },
  pillValue: { color: T.blue, fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
  pillLabel: { color: T.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: T.blueLight, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: T.blue, fontSize: 22, lineHeight: 26, fontWeight: '600' },
});