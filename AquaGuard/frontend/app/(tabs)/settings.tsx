// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Firebase Imports
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebaseConfig'; 

import {
  Card,
  ScreenHeader,
  sharedStyles,
  T,
  PrimaryButton
} from './shared';

// ─── Sensor Modification ──────────────────────────────────────────────────────
function SensorSettings({ onBack }: { onBack: () => void }) {
  // Local state to manage the inputs before saving to Firebase
  const [thresholds, setThresholds] = useState({
    phMin: 6.5,
    phMax: 8.5,
    tempMax: 28.0
  });

  const handleSave = () => {
    // Push the new thresholds to Firebase so the Dashboard & Hardware sync up
    const settingsRef = ref(database, 'settings/thresholds');
    set(settingsRef, thresholds).then(() => onBack());
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Sensor Modification" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={sharedStyles.inputLabel}>Fish Tank Selected</Text>
        <View style={[sharedStyles.selectBox, { marginBottom: 20 }]}>
          <Text style={sharedStyles.selectText}>Fish Tank 1 (Live)</Text>
          <Text style={{ color: T.textSec }}>▾</Text>
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={sharedStyles.inputLabel}>pH Alert Range</Text>
          <View style={sharedStyles.selectBox}>
            <Text style={sharedStyles.selectText}>{thresholds.phMin} – {thresholds.phMax} pH</Text>
            <Text style={{ color: T.textSec }}>Edit ▾</Text>
          </View>
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={sharedStyles.inputLabel}>Max Temperature</Text>
          <View style={sharedStyles.selectBox}>
            <Text style={sharedStyles.selectText}>{thresholds.tempMax}°C</Text>
            <Text style={{ color: T.textSec }}>Edit ▾</Text>
          </View>
        </View>

        <PrimaryButton label="Save & Sync" onPress={handleSave} style={{ marginTop: 8 }} />
        <Text style={styles.hint}>Updating these will sync with your hardware alarm.</Text>
      </ScrollView>
    </View>
  );
}

// ─── Reminders ────────────────────────────────────────────────────────────────
function RemindersSettings({ onBack }: { onBack: () => void }) {
  const [liveReminders, setLiveReminders] = useState<any[]>([]);

  useEffect(() => {
    const remindersRef = ref(database, 'reminders/');
    const unsubscribe = onValue(remindersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setLiveReminders(list);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Live Reminders" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {liveReminders.length === 0 ? (
           <Text style={styles.emptyText}>No reminders set in Firebase.</Text>
        ) : (
          liveReminders.map(r => (
            <Card key={r.id} style={styles.reminderCard}>
              <View style={styles.reminderRow}>
                <View>
                  <Text style={styles.reminderTank}>{r.tank}</Text>
                  <Text style={styles.reminderSub}>{r.task || 'Water Change'}</Text>
                  <Text style={styles.reminderTime}>{r.schedule}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Settings ────────────────────────────────────────────────────────────
type SubScreen = null | 'reminders' | 'sensors';

export default function SettingsTab() {
  const [sub, setSub] = useState<SubScreen>(null);

  if (sub === 'reminders') return <RemindersSettings onBack={() => setSub(null)} />;
  if (sub === 'sensors')   return <SensorSettings onBack={() => setSub(null)} />;

  const rows = [
    { key: 'reminders', label: 'Reminders',           sub: 'Water change schedules', icon: '🔔' },
    { key: 'sensors',   label: 'Sensor Modification', sub: 'Adjust live thresholds', icon: '🔧' },
  ];

  return (
    <View style={styles.root}>
      <ScreenHeader title="App Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <Text style={styles.section}>System Controls</Text>
        {rows.map(r => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setSub(r.key as SubScreen)}
            activeOpacity={0.8}>
            <Card style={[styles.settingRow, { marginBottom: 12 }]}>
              <View style={[styles.settingIconBox, 
                { backgroundColor: r.key === 'reminders' ? '#FEF3C7' : T.blueLight }]}>
                <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.settingLabel}>{r.label}</Text>
                <Text style={styles.settingSub}>{r.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>AquaGuard System v1.0.4</Text>
          <Text style={styles.infoSub}>Connected to Realtime Database</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 20 },
  section: {
    color: T.textSec, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  settingSub: { color: T.textSec, fontSize: 12, marginTop: 1 },
  chevron: { color: T.textMuted, fontSize: 22 },
  
  // Reminders
  reminderCard: { marginBottom: 12 },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderTank: { color: T.textPri, fontWeight: '700', fontSize: 14 },
  reminderSub: { color: T.textSec, fontSize: 12, marginTop: 2 },
  reminderTime: { color: T.blue, fontSize: 12, fontWeight: '700', marginTop: 4 },
  editBtn: { backgroundColor: T.blueLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: T.blue, fontWeight: '700', fontSize: 12 },
  
  // Info
  infoBox: { marginTop: 40, alignItems: 'center' },
  infoText: { color: T.textMuted, fontSize: 12, fontWeight: '600' },
  infoSub: { color: T.textMuted, fontSize: 10, marginTop: 2 },
  emptyText: { textAlign: 'center', color: T.textMuted, marginTop: 40 },
  hint: { textAlign: 'center', color: T.textSec, fontSize: 11, marginTop: 12 }
});