import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ACTIVITY, Card, GhostButton, PrimaryButton, ScreenHeader, sharedStyles, StatusBadge, T } from './shared';

const METRICS = [
  { key: 'ph', label: 'PH Level', getValue: (t: any) => t.ph, getUnit: () => '', range: 'Ideal: 6.5 – 7.5' },
  { key: 'temp', label: 'Temperature', getValue: (t: any) => `${t.temp}°`, getUnit: () => 'C', range: 'Ideal: 24°C – 28°C' },
  { key: 'clarity', label: 'Clarity', getValue: (t: any) => `${t.clarity}%`, getUnit: () => '', range: 'Excellent clarity' },
];

export default function ViewTankScreen({ tank, onBack }: { tank: any; onBack: () => void }) {
  const [reminderOpen, setReminderOpen] = useState(false);
  if (!tank) return null;

  return (
    <View style={styles.root}>
      <ScreenHeader title={tank.name} subtitle={`Sensor ID ${tank.sensor}`} onBack={onBack} right={<StatusBadge status={tank.status} small />} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {METRICS.map(m => (
          <Card key={m.key} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.getValue(tank)}<Text style={styles.metricUnit}>{m.getUnit()}</Text></Text>
            <Text style={styles.metricRange}>{m.range}</Text>
          </Card>
        ))}
        <TouchableOpacity style={styles.reminderBtn} onPress={() => setReminderOpen(true)}>
          <Text style={styles.reminderBtnText}>🔔 Set Water Change Reminder</Text>
        </TouchableOpacity>
      </ScrollView>
      <ReminderModal visible={reminderOpen} onClose={() => setReminderOpen(false)} tankName={tank.name} />
    </View>
  );
}

function ReminderModal({ visible, onClose, tankName }: { visible: boolean; onClose: () => void, tankName: string }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Reminder for {tankName}</Text>
          <View style={modal.actions}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={onClose} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 10 },
  metricCard: { gap: 4 },
  metricLabel: { color: T.textSec, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: T.blue, fontSize: 40, fontWeight: '800' },
  metricUnit: { fontSize: 20 },
  metricRange: { color: T.textMuted, fontSize: 12 },
  reminderBtn: { backgroundColor: T.white, borderRadius: 12, borderWidth: 1, borderColor: T.blue, padding: 14, alignItems: 'center' },
  reminderBtnText: { color: T.blue, fontWeight: '600' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: T.white, borderRadius: 16, padding: 20 },
  title: { color: T.textPri, fontWeight: '700', fontSize: 17, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10 },
});