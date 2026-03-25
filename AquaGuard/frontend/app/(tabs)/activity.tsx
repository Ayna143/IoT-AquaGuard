// app/(tabs)/activity.tsx
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ACTIVITY, Card, ScreenHeader, StatusBadge, T, TANKS } from './shared';
import ViewTankScreen from './view-tank';

export default function ActivityTab() {
  // FIX 1: Tell TypeScript this can be a Tank object or null
  const [activeTank, setActiveTank] = useState<any>(null);

  if (activeTank) {
    return <ViewTankScreen tank={activeTank} onBack={() => setActiveTank(null)} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Recent Activity" subtitle="Last synced 4 mins ago" />
      <FlatList
        data={ACTIVITY}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          // FIX 2: Bulletproof matching (ignores case and hidden spaces)
          const matchedTank = TANKS.find(t => 
            t.name.toLowerCase().trim() === item.tank.toLowerCase().trim()
          );

          return (
            <TouchableOpacity
              onPress={() => {
                if (matchedTank) {
                  setActiveTank(matchedTank);
                } else {
                  console.warn(`No match for: "${item.tank}"`);
                }
              }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  list: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.blue, marginTop: 2,
  },
  eventName: { color: T.textPri, fontWeight: '600', fontSize: 14 },
  tankName: { color: T.textSec, fontSize: 12, marginTop: 1 },
  time: { color: T.textMuted, fontSize: 11, marginTop: 1 },
});
