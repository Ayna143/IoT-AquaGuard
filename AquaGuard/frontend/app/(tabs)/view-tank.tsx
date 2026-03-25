// app/(tabs)/view-tank.tsx — shared tank detail screen
import React, { useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {
  ACTIVITY,
  Card,
  GhostButton,
  PrimaryButton,
  ScreenHeader,
  sharedStyles,
  StatusBadge,
  T,
} from './shared';

const METRICS = [
  {
    key: 'ph', label: 'PH Level',
    getValue: (t: any) => t.ph,
    getUnit: () => '',
    range: 'Ideal range: 6.5 – 7.5  ·  Status: Normal',
  },
  {
    key: 'temp', label: 'Temperature',
    getValue: (t: any) => `${t.temp}°`,
    getUnit: () => 'C',
    range: 'Ideal range: 24°C – 28°C  ·  Stable',
  },
  {
    key: 'clarity', label: 'Clarity',
    getValue: (t: any) => `${t.clarity}%`,
    getUnit: () => '',
    range: 'Water clarity is excellent – No action needed',
  },
];

export default function ViewTankScreen({
  tank, onBack,
}: { tank: any; onBack: () => void }) {
  const [reminderOpen, setReminderOpen] = useState(false);

  // If for some reason tank data is missing, don't crash, just show a blank screen
  if (!tank) return null;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={tank.name}
        subtitle={`${tank.type} · Sensor ID ${tank.sensor}`}
        onBack={onBack}
        right={<StatusBadge status={tank.status} small />}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {METRICS.map(m => (
          <Card key={m.key} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>
              {m.getValue(tank)}
              <Text style={styles.metricUnit}>{m.getUnit()}</Text>
            </Text>
            <Text style={styles.metricRange}>{m.range}</Text>
          </Card>
        ))}

        <TouchableOpacity
          style={styles.reminderBtn}
          onPress={() => setReminderOpen(true)}
          activeOpacity={0.8}>
          <View style={styles.reminderIcon}>
            <Text style={{ fontSize: 14 }}>🔔</Text>
          </View>
          <Text style={styles.reminderBtnText}>Set Water Change Reminder</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {ACTIVITY.slice(0, 4).map(a => (
          <Card key={a.id} style={styles.actRow}>
            <View style={styles.actDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actEvent}>{a.event}</Text>
              <Text style={styles.actTime}>{a.time}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      <ReminderModal visible={reminderOpen} onClose={() => setReminderOpen(false)} tankName={tank.name} />
    </View>
  );
}

// Moved ReminderModal down here. Also passed the tankName as a prop so the modal shows the correct tank!
function ReminderModal({ visible, onClose, tankName }: { visible: boolean; onClose: () => void, tankName: string }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <View style={modal.header}>
            <Text style={modal.title}>Water Change Reminder</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modal.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={sharedStyles.inputLabel}>Tank</Text>
          <View style={[sharedStyles.selectBox, { marginBottom: 14 }]}>
            <Text style={sharedStyles.selectText}>{tankName}</Text>
            <Text style={{ color: T.textSec }}>▾</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={sharedStyles.inputLabel}>Frequency</Text>
              <View style={sharedStyles.selectBox}>
                <Text style={sharedStyles.selectText}>Every 7 days</Text>
                <Text style={{ color: T.textSec }}>▾</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sharedStyles.inputLabel}>Remind at</Text>
              <View style={sharedStyles.selectBox}>
                <Text style={sharedStyles.selectText}>9:30 AM</Text>
                <Text style={{ color: T.textSec }}>▾</Text>
              </View>
            </View>
          </View>

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
  metricLabel: {
    color: T.textSec, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  metricValue: {
    color: T.blue, fontSize: 40, fontWeight: '800', letterSpacing: -1,
  },
  metricUnit: { fontSize: 20, fontWeight: '500' },
  metricRange: { color: T.textMuted, fontSize: 12 },

  reminderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.white, borderRadius: 12,
    borderWidth: 1, borderColor: T.blue,
    padding: 14, marginVertical: 4,
  },
  reminderIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: T.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderBtnText: { color: T.blue, fontWeight: '600', fontSize: 14 },

  sectionTitle: {
    color: T.textPri, fontSize: 16, fontWeight: '700',
    marginTop: 6, marginBottom: 4,
  },
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
  },
  actDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.blue },
  actEvent: { color: T.textPri, fontWeight: '600', fontSize: 13 },
  actTime: { color: T.textMuted, fontSize: 11, marginTop: 2 },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', padding: 24,
  },
  box: {
    backgroundColor: T.white, borderRadius: 16,
    padding: 20, shadowColor: '#000',
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  title: { color: T.textPri, fontWeight: '700', fontSize: 17 },
  close: { color: T.textSec, fontSize: 18, padding: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});