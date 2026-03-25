// app/(tabs)/activity.tsx
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebaseConfig'; 
import { Card, ScreenHeader, StatusBadge, T } from './shared';

const FILTERS = ['All', 'Water', 'Feeding', 'Reminders', 'Sensors'];

export default function ActivityTab() {
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [tankName, setTankName] = useState('Fish Tank 1');
  const [activeFilter, setActiveFilter] = useState('All');
  const router = useRouter();

  useEffect(() => {
    onValue(ref(database, 'aquarium/info/name'), (snap) => {
      if (snap.exists()) setTankName(snap.val());
    });

    const unsubLogs = onValue(ref(database, 'activity_logs/'), (snapshot) => {
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

    return () => unsubLogs();
  }, []);

  // Filter Logic
  const filteredLogs = liveLogs.filter(log => {
    if (activeFilter === 'All') return true;
    const evt = (log.event || '').toLowerCase();
    
    if (activeFilter === 'Water' && evt.includes('water')) return true;
    if (activeFilter === 'Feeding' && evt.includes('feed')) return true;
    if (activeFilter === 'Reminders' && evt.includes('reminder')) return true;
    if (activeFilter === 'Sensors' && evt.includes('sensor')) return true;
    
    return false;
  });

  return (
    <View style={styles.root}>
      <ScreenHeader title={`${tankName} Activity`} subtitle="Live Cloud Sync" />
      
      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredLogs.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: T.textSec, marginTop: 40 }}>No logs match this filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.firebaseKey}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
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
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  filterContainer: { backgroundColor: T.white, paddingVertical: 10, borderBottomWidth: 1, borderColor: T.border },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.inputBg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.blue, borderColor: T.blueDark },
  filterText: { color: T.textSec, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: T.white },
  list: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.blue, marginTop: 2 },
  eventName: { color: T.textPri, fontWeight: '600', fontSize: 14 },
  tankName: { color: T.textSec, fontSize: 12, marginTop: 1 },
  time: { color: T.textMuted, fontSize: 11, marginTop: 1 },
});