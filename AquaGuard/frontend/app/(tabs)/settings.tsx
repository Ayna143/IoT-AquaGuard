// app/(tabs)/settings.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Card,
  FormInput, PrimaryButton,
  REMINDERS,
  ScreenHeader,
  sharedStyles,
  T
} from './shared';

// ─── Edit Profile ─────────────────────────────────────────────────────────────
function EditProfile({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Edit Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarArea}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarIcon} />
          </View>
          <Text style={styles.avatarName}>Username</Text>
          <TouchableOpacity>
            <Text style={styles.changePhoto}>Change photo</Text>
          </TouchableOpacity>
        </View>
        <FormInput label="Username" placeholder="Username" />
        <FormInput label="Email" placeholder="bilatlat@gmail.com" keyboardType="email-address" />
        <FormInput label="Password" placeholder="••••••••••" secureTextEntry />
        <PrimaryButton label="Save Changes" onPress={onBack} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

// ─── Reminders ────────────────────────────────────────────────────────────────
function RemindersSettings({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Reminders" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {REMINDERS.map(r => (
          <Card key={r.id} style={styles.reminderCard}>
            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.reminderTank}>{r.tank}</Text>
                <Text style={styles.reminderSub}>Next water change</Text>
                <Text style={styles.reminderTime}>{r.schedule}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Sensor Modification ──────────────────────────────────────────────────────
function SensorSettings({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Sensor Modification" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={sharedStyles.inputLabel}>Fish Tank Selected</Text>
        <View style={[sharedStyles.selectBox, { marginBottom: 20 }]}>
          <Text style={sharedStyles.selectText}>Fish Tank 1</Text>
          <Text style={{ color: T.textSec }}>▾</Text>
        </View>
        {[
          { label: 'PH Levels', val: '6.5 – 7.5' },
          { label: 'Temperature', val: '24°C – 28°C' },
          { label: 'Turbidity', val: '85% – 100%' },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={sharedStyles.inputLabel}>{f.label}</Text>
            <View style={sharedStyles.selectBox}>
              <Text style={sharedStyles.selectText}>{f.val}</Text>
              <Text style={{ color: T.textSec }}>▾</Text>
            </View>
          </View>
        ))}
        <PrimaryButton label="Save" onPress={onBack} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

// ─── Main Settings ────────────────────────────────────────────────────────────
type SubScreen = null | 'profile' | 'reminders' | 'sensors';

export default function SettingsTab() {
  const [sub, setSub] = useState<SubScreen>(null);
  const router = useRouter();

  if (sub === 'profile')   return <EditProfile onBack={() => setSub(null)} />;
  if (sub === 'reminders') return <RemindersSettings onBack={() => setSub(null)} />;
  if (sub === 'sensors')   return <SensorSettings onBack={() => setSub(null)} />;

  const rows = [
    { key: 'reminders', label: 'Reminders',           sub: 'Water change schedules' },
    { key: 'sensors',   label: 'Sensor Modification', sub: 'Adjust sensor thresholds' },
  ];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Account card */}
        <Text style={styles.section}>Account</Text>
        <TouchableOpacity onPress={() => setSub('profile')} activeOpacity={0.8}>
          <Card style={styles.accountCard}>
            <View style={styles.avatarSmall}>
              <View style={styles.avatarSmallIcon} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.accountName}>Username</Text>
              <Text style={styles.accountEmail}>bilatlat@gmail.com</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </TouchableOpacity>

        {/* Settings rows */}
        <Text style={[styles.section, { marginTop: 24 }]}>App Settings</Text>
        {rows.map(r => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setSub(r.key as SubScreen)}
            activeOpacity={0.8}>
            <Card style={[styles.settingRow, { marginBottom: 8 }]}>
              <View style={[styles.settingIconBox,
                { backgroundColor: r.key === 'reminders' ? '#FEF3C7' : T.blueLight }]}>
                <Text style={{ fontSize: 16 }}>
                  {r.key === 'reminders' ? '🔔' : '🔧'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.settingLabel}>{r.label}</Text>
                <Text style={styles.settingSub}>{r.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOut}
          onPress={() => router.replace('/')}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16 },

  section: {
    color: T.textSec, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Account card
  accountCard: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.blueLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarSmallIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: T.blue, marginTop: 6,
  },
  accountName: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  accountEmail: { color: T.textSec, fontSize: 12, marginTop: 1 },
  chevron: { color: T.textMuted, fontSize: 20 },

  // Setting rows
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { color: T.textPri, fontWeight: '600', fontSize: 14 },
  settingSub: { color: T.textSec, fontSize: 12, marginTop: 1 },

  // Sign out
  signOut: {
    marginTop: 32, padding: 16,
    backgroundColor: '#FEE2E2', borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },

  // Edit profile
  avatarArea: { alignItems: 'center', marginBottom: 32 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: T.blueLight,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 10,
    borderWidth: 2, borderColor: T.blue,
  },
  avatarIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: T.blue, marginTop: 16,
  },
  avatarName: { color: T.textPri, fontWeight: '700', fontSize: 17 },
  changePhoto: { color: T.blue, fontSize: 13, marginTop: 4 },

  // Reminders
  reminderCard: { marginBottom: 10 },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderTank: { color: T.textPri, fontWeight: '700', fontSize: 14 },
  reminderSub: { color: T.textSec, fontSize: 12, marginTop: 2 },
  reminderTime: { color: T.blue, fontSize: 12, fontWeight: '600', marginTop: 2 },
  editBtn: {
    backgroundColor: T.blueLight, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  editBtnText: { color: T.blue, fontWeight: '600', fontSize: 13 },
});
