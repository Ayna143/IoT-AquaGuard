// app/(tabs)/activity.tsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Firebase Imports
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig'; 

// Shared Components
import { Card, ScreenHeader, StatusBadge, T, TANKS } from './shared';
import ViewTankScreen from './view-tank';

export default function ActivityTab() {
  const [activeTank, setActiveTank] = useState<any>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  useEffect(() => {
    // Listen to the 'activity_logs' folder we are writing to from the dashboard
    const logsRef = ref(database, 'activity_logs/');

    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the Firebase object into an array and reverse it so newest is on top
        const logsArray = Object.keys(data).map(key => ({
          ...data[key],
          firebaseKey: key 
        })).reverse();
        
        setLiveLogs(logsArray);
      } else {
        setLiveLogs([]); // Clear logs if database is empty
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
            // Bulletproof search: ignores case and extra spaces
            const matchedTank = TANKS.find(t => 
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