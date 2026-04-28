import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { ref, onValue, update, push } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons'; 
import { auth, database } from '../../firebaseConfig'; 
import { Card, FormInput, ScreenHeader, T, PrimaryButton } from './shared'; 

interface ThresholdSettings {
  phMin: string; phMax: string; tempMin: string; tempMax: string; clarityMin: string;
}

export default function ProfileScreen() {
  const [view, setView] = useState<'main' | 'sensors'>('main');
  const [tank, setTank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Default fallback limits
  const [limits, setLimits] = useState<ThresholdSettings>({ 
    phMin: '6.5', phMax: '7.5', tempMin: '24.0', tempMax: '28.0', clarityMin: '80' 
  });

  const user = auth.currentUser;

  const getInitial = () => {
    const name = user?.displayName || user?.email || 'A';
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    if (!user) return setLoading(false);
    
    // Fetch both the tank info AND the user-specific thresholds at the same time
    const tankRef = ref(database, `users/${user.uid}/tanks/mainTank`);
    const unsub = onValue(tankRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setTank(data);
        
        // If the user has saved custom thresholds, populate the form with them
        if (data.thresholds) {
          setLimits(data.thresholds);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const saveSensorSettings = () => {
    if (!user) return;

    // SAVE FIX: Save the thresholds directly into the user's mainTank path
    update(ref(database, `users/${user.uid}/tanks/mainTank/thresholds`), limits)
      .then(() => {
        // Log the change
        push(ref(database, `users/${user.uid}/tanks/mainTank/logs`), {
          event: "Updated Sensor Thresholds",
          time: new Date().toLocaleString(),
          status: "GOOD"
        });
        Alert.alert("Saved", "Thresholds synced to your dashboard.");
        setView('main');
      })
      .catch((error) => {
        Alert.alert("Error", "Could not save settings: " + error.message);
      });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={T.blue} /></View>;

  if (view === 'sensors') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Sensor Modification" onBack={() => setView('main')} />
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          <Text style={styles.sectionLabel}>pH Levels</Text>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}><FormInput label="Min" value={limits.phMin} onChangeText={(v: string) => setLimits({ ...limits, phMin: v })} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><FormInput label="Max" value={limits.phMax} onChangeText={(v: string) => setLimits({ ...limits, phMax: v })} keyboardType="numeric" /></View>
          </View>
          <Text style={styles.sectionLabel}>Temperature (°C)</Text>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}><FormInput label="Min" value={limits.tempMin} onChangeText={(v: string) => setLimits({ ...limits, tempMin: v })} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><FormInput label="Max" value={limits.tempMax} onChangeText={(v: string) => setLimits({ ...limits, tempMax: v })} keyboardType="numeric" /></View>
          </View>
          <Text style={styles.sectionLabel}>Turbidity (%)</Text>
          <FormInput label="Min Clarity" value={limits.clarityMin} onChangeText={(v: string) => setLimits({ ...limits, clarityMin: v })} keyboardType="numeric" />
          <PrimaryButton label="Save & Sync" onPress={saveSensorSettings} style={{ marginTop: 20 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{getInitial()}</Text></View>
        <Text style={styles.userName}>{user?.displayName || 'Aqua User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>My Aquarium</Text>
      {tank && (
        <Card style={styles.tankCard}>
          <MaterialIcons name="waves" size={24} color={T.blue} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.tankName}>{tank.name || "Main Tank"}</Text>
            <Text style={styles.tankDetails}>{tank.description || "No description set"}</Text>
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>System Configuration</Text>
      <TouchableOpacity onPress={() => setView('sensors')} activeOpacity={0.8}>
        <Card style={styles.settingRow}>
          <View style={[styles.settingIconBox, { backgroundColor: T.blueLight }]}><MaterialIcons name="tune" size={20} color={T.blue} /></View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.settingLabel}>Sensor Modification</Text>
            <Text style={styles.settingSub}>Adjust thresholds and alerts</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={T.textMuted} />
        </Card>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={() => { signOut(auth); router.replace('/login'); }}>
        <MaterialIcons name="logout" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { paddingBottom: 20 },
  profileCard: { alignItems: 'center', marginBottom: 32, paddingTop: 40 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.blue, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: T.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  userEmail: { fontSize: 14, color: '#64748b' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 20, marginBottom: 12 },
  sectionLabel: { color: T.textPri, fontWeight: '700', fontSize: 15, marginTop: 15, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  tankCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tankName: { fontSize: 16, fontWeight: '700', color: T.blue },
  tankDetails: { fontSize: 12, color: '#64748b' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  settingIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  settingSub: { color: T.textSec, fontSize: 12, marginTop: 1 },
  logoutButton: { marginTop: 40, padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});