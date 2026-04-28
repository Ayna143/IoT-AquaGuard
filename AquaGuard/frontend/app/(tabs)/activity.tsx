import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { auth, database } from '../../firebaseConfig'; 
import { Card, ScreenHeader, StatusBadge, T } from './shared';

const FILTERS = ['All', 'Water', 'Feeding', 'Reminders', 'Sensors'];

export default function ActivityTab() {
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // UPDATED: Points to the correct single-tank log path
    const logsRef = ref(database, `users/${user.uid}/tanks/mainTank/logs`);
    const unsubLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.keys(data).map(key => ({
          ...data[key],
          firebaseKey: key 
        })).reverse(); // Most recent first
        setLiveLogs(logsArray);
      } else {
        setLiveLogs([]); 
      }
      setLoading(false);
    });

    return () => unsubLogs();
  }, [user]);

  const filteredLogs = liveLogs.filter(log => {
    if (activeFilter === 'All') return true;
    const evt = (log.event || '').toLowerCase();
    
    if (activeFilter === 'Water' && evt.includes('water')) return true;
    if (activeFilter === 'Feeding' && evt.includes('feed')) return true;
    if (activeFilter === 'Reminders' && evt.includes('reminder')) return true;
    if (activeFilter === 'Sensors' && evt.includes('sensor')) return true;
    
    return false;
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={T.blue} /></View>;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Activity Logs" subtitle="Live Sync" />
      
      {filteredLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history found for this tank.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.firebaseKey}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconDot, { backgroundColor: item.status === 'CRITICAL' ? '#ef4444' : T.blue }]} />
                <View>
                  <Text style={styles.eventName}>{item.event}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              </View>
              <StatusBadge status={item.status} small />
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { color: T.textPri, fontWeight: '600', fontSize: 14 },
  time: { color: T.textMuted, fontSize: 11, marginTop: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { color: T.textSec, textAlign: 'center' }
});