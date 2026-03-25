// app/(tabs)/dashboard.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, ScreenHeader, StatusBadge, T, TANKS } from './shared';
import ViewTankScreen from './view-tank';

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// app/(tabs)/dashboard.tsx
export default function DashboardTab() {
  // FIX: Type definition to allow the tank object
  const [activeTank, setActiveTank] = useState<any>(null);

  if (activeTank) {
    return <ViewTankScreen tank={activeTank} onBack={() => setActiveTank(null)} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="My Tanks"
        subtitle={`${TANKS.length} tanks monitored`}
        right={
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.list}>
        {TANKS.map(tank => (
          <TouchableOpacity 
            key={tank.id} 
            onPress={() => setActiveTank(tank)} 
            activeOpacity={0.85}
          >
            <Card style={styles.tankCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.tankName}>{tank.name}</Text>
                  <Text style={styles.tankSub}>{tank.type} · Sensor ID {tank.sensor}</Text>
                </View>
                <StatusBadge status={tank.status} />
              </View>
              <View style={styles.statsRow}>
                {/* Ensure values have fallbacks to prevent crashes */}
                <StatPill label="PH" value={tank.ph || '0.0'} />
                <View style={styles.divider} />
                <StatPill label="TEMP" value={`${tank.temp || '--'}°C`} />
                <View style={styles.divider} />
                <StatPill label="CLARITY" value={`${tank.clarity || '0'}%`} />
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, marginRight: 12 },
  tankName: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  tankSub: { color: T.textSec, fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: T.blueLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  divider: {
    width: 1, height: 28, backgroundColor: T.border, marginHorizontal: 8,
  },
  pill: { flex: 1, alignItems: 'center' },
  pillValue: {
    color: T.blue, fontWeight: '800', fontSize: 18, letterSpacing: -0.5,
  },
  pillLabel: {
    color: T.textMuted, fontSize: 10, fontWeight: '600',
    letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase',
  },
  addBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: T.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: T.blue, fontSize: 22, lineHeight: 26, fontWeight: '600' },
});
