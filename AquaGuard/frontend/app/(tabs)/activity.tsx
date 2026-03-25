// app/(tabs)/activity.tsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig'; 

import { Card, ScreenHeader, StatusBadge, T, TANKS } from './shared';
import ViewTankScreen from './view-tank';

export default function ActivityTab() {
  const [activeTank, setActiveTank] = useState<any>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  
  // ADDED: Track the live tanks here too so tapping a log opens the LIVE tank
  const [liveTanks, setLiveTanks] = useState(TANKS);

  useEffect(() => {
    // 1. Listen to Activity Logs
    const logsRef = ref(database, 'activity_logs/');
    const unsubLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.keys(data).map(key => ({
          ...data[key],
          firebaseKey: key 
        })).reverse();
        setLiveLogs(logsArray);
      } else {
        setLiveLogs([]); 
      }
    });

    // 2. Listen to Live Tank Data (Syncs completely with Dashboard)
    const tankRef = ref(database, 'aquarium/');
    const unsubTanks = onValue(tankRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let currentStatus = 'GOOD';
        if (data.ph > 8.0 || data.ph < 6.5 || data.temp > 28.0 || data.temp < 20.0) {
          currentStatus = 'CRITICAL';
        } else if (data.ph >= 7.6 || data.ph <= 6.7) {
          currentStatus = 'CAUTION';
        }

        setLiveTanks(currentTanks => 
          currentTanks.map(tank => 
            tank.name === "Fish Tank 1" 
              ? { 
                  ...tank, 
                  ph: data.ph ?? tank.ph, 
                  temp: data.temp ?? tank.temp, 
                  clarity: data.tds ? Math.round(Math.max(0, 100 - (data.tds / 10))) : tank.clarity,
                  status: currentStatus 
                }
              : tank
          )
        );
      }
    });

    return () => {
      unsubLogs();
      unsubTanks();
    };
  }, []);

  if (activeTank) {
    return <ViewTankScreen tank={activeTank} onBack={() => setActiveTank(null)} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Recent Activity" subtitle="Live Cloud Sync" />
      
      {liveLogs.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: T.textSec, marginTop: 40 }}>No critical activity logs found yet.</Text>
          <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>Alerts will appear here automatically.</Text>
        </View>
      ) : (
        <FlatList
          data={liveLogs}
          keyExtractor={item => item.firebaseKey || item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            
            // FIXED: Now searches the LIVE tanks instead of the static mock data!
            const matchedTank = liveTanks.find(t => 
              t.name.toLowerCase().trim() === item.tank.toLowerCase().trim()
            );

            return (
              <TouchableOpacity
                onPress={() => matchedTank && setActiveTank(matchedTank)}
                activeOpacity={0.7}>
                <Card style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconDot} />
                    <View>
                      <Text style={styles.eventName}>{item.event}</Text>
                      <Text style={styles.tankName}>{item.tank}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                  </View>
                  <StatusBadge status={item.status} small />
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  list: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.blue, marginTop: 2 },
  eventName: { color: T.textPri, fontWeight: '600', fontSize: 14 },
  tankName: { color: T.textSec, fontSize: 12, marginTop: 1 },
  time: { color: T.textMuted, fontSize: 11, marginTop: 1 },
});