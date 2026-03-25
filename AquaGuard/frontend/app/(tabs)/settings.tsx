import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ref, onValue, update, push, set } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { Card, FormInput, PrimaryButton, ScreenHeader, sharedStyles, T } from './shared';

function SensorSettings({ onBack, tankName }: { onBack: () => void, tankName: string }) {
  const [t, setT] = useState({ phMin: '6.5', phMax: '7.5', tempMin: '24.0', tempMax: '28.0', clarityMin: '80' });

  useEffect(() => {
    onValue(ref(database, 'settings/thresholds'), snap => {
      if (snap.exists()) setT(snap.val());
    });
  }, []);

  const handleSave = () => {
    update(ref(database, 'settings/thresholds'), t);

    const newLogRef = push(ref(database, 'activity_logs/'));
    set(newLogRef, {
      id: Date.now().toString(),
      tank: tankName,
      event: "Updated Sensor Thresholds",
      time: new Date().toLocaleString(),
      status: "GOOD"
    }).then(() => onBack());
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Sensor Modification" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionTitle}>pH Levels</Text>
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}><FormInput label="Minimum pH" value={t.phMin} onChangeText={(v: string) => setT({ ...t, phMin: v })} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><FormInput label="Maximum pH" value={t.phMax} onChangeText={(v: string) => setT({ ...t, phMax: v })} keyboardType="numeric" /></View>
        </View>

        <Text style={styles.sectionTitle}>Temperature (°C)</Text>
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}><FormInput label="Min Temp" value={t.tempMin} onChangeText={(v: string) => setT({ ...t, tempMin: v })} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><FormInput label="Max Temp" value={t.tempMax} onChangeText={(v: string) => setT({ ...t, tempMax: v })} keyboardType="numeric" /></View>
        </View>

        <Text style={styles.sectionTitle}>Turbidity (Clarity %)</Text>
        <FormInput label="Minimum Acceptable Clarity" value={t.clarityMin} onChangeText={(v: string) => setT({ ...t, clarityMin: v })} keyboardType="numeric" />
        <PrimaryButton label="Save & Sync Thresholds" onPress={handleSave} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}

export default function SettingsTab() {
  const [sub, setSub] = useState<null | 'sensors'>(null);
  const [tankName, setTankName] = useState('Fish Tank 1');

  useEffect(() => {
    onValue(ref(database, 'aquarium/info/name'), (snap) => {
      if (snap.exists()) setTankName(snap.val());
    });
  }, []);

  if (sub === 'sensors') return <SensorSettings onBack={() => setSub(null)} tankName={tankName} />;

  return (
    <View style={styles.root}>
      <ScreenHeader title="App Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.section}>System Controls</Text>
        <TouchableOpacity onPress={() => setSub('sensors')} activeOpacity={0.8}>
          <Card style={styles.settingRow}>
            <View style={[styles.settingIconBox, { backgroundColor: T.blueLight }]}>
              <Text style={{ fontSize: 18 }}>🔧</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.settingLabel}>Sensor Modification</Text>
              <Text style={styles.settingSub}>Adjust Good/Critical thresholds</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>AquaGuard System v1.1.0</Text>
          <Text style={styles.infoSub}>Connected to Realtime Database</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 20 },
  sectionTitle: { color: T.textPri, fontWeight: '700', fontSize: 15, marginTop: 10, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  section: { color: T.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  settingIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  settingSub: { color: T.textSec, fontSize: 12, marginTop: 1 },
  chevron: { color: T.textMuted, fontSize: 22 },
  infoBox: { marginTop: 40, alignItems: 'center' },
  infoText: { color: T.textMuted, fontSize: 12, fontWeight: '600' },
  infoSub: { color: T.textMuted, fontSize: 10, marginTop: 2 },
});