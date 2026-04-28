import React, { useState, useEffect, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons'; 
import { auth, database } from '../../firebaseConfig'; 
import { Card, GhostButton, PrimaryButton, ScreenHeader, StatusBadge, T, FormInput } from './shared';

export default function DashboardTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [waterChangeOpen, setWaterChangeOpen] = useState(false);
  const [feedingOpen, setFeedingOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  
  const lastAlarmTime = useRef<number>(0); 
  const [now, setNow] = useState(Date.now());
  const [raw, setRaw] = useState({ ph: 7.0, temp: 25.0, tds: 0 });
  
  const [info, setInfo] = useState<{ name: string; description: string; nextWaterChange: number | null }>({ 
    name: 'Loading...', 
    description: '', 
    nextWaterChange: null 
  });
  
  const [status, setStatus] = useState('GOOD');
  const [limits, setLimits] = useState({ phMin: 6.5, phMax: 7.5, tempMin: 24, tempMax: 28, clarityMin: 80 });

  const user = auth.currentUser;

  const getStatusConfig = () => {
    const currentClarity = Math.round(Math.max(0, 100 - (raw.tds / 10)));
    
    if (status === 'CRITICAL') {
      return { label: 'CRITICAL WATER QUALITY', color: '#ef4444', icon: 'report-problem' };
    }

    const phBuffer = (limits.phMax - limits.phMin) * 0.1;
    const isWarning = 
      raw.ph < (limits.phMin + phBuffer) || raw.ph > (limits.phMax - phBuffer) ||
      raw.temp < (limits.tempMin + 1) || raw.temp > (limits.tempMax - 1) ||
      currentClarity < (limits.clarityMin + 5);

    if (isWarning) {
      return { label: 'WATER QUALITY WARNING', color: '#f59e0b', icon: 'warning' };
    }

    return { label: 'WATER QUALITY NORMAL', color: '#10b981', icon: 'check-circle' };
  };

  const statusConfig = getStatusConfig();

  useEffect(() => {
    if (!user) return;
    
    const tankRef = ref(database, `users/${user.uid}/tanks/mainTank`);
    const unsub = onValue(tankRef, (snap) => {
      if (snap.exists()) {
        const tank = snap.val();
        setInfo({
          name: tank.name || "My Tank",
          description: tank.description || "",
          nextWaterChange: tank.nextWaterChange || null
        });
        
        if (tank.thresholds) {
          setLimits({
            phMin: parseFloat(tank.thresholds.phMin) || 6.5,
            phMax: parseFloat(tank.thresholds.phMax) || 7.5,
            tempMin: parseFloat(tank.thresholds.tempMin) || 24,
            tempMax: parseFloat(tank.thresholds.tempMax) || 28,
            clarityMin: parseFloat(tank.thresholds.clarityMin) || 80
          });
        }
      }
      setIsLoading(false);
    });
    
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const deviceRef = ref(database, `devices/ESP32_AQUAGUARD_01`); 
    const unsub = onValue(deviceRef, snap => {
      if (snap.exists()) {
        const data = snap.val();
        setRaw({ ph: data.ph || 7.0, temp: data.temp || 25.0, tds: data.tds || 0 });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    let currentStatus = 'GOOD';
    let alertMessage = '';
    const clarity = Math.round(Math.max(0, 100 - (raw.tds / 10)));

    if (raw.ph > limits.phMax || raw.ph < limits.phMin) {
      currentStatus = 'CRITICAL';
      alertMessage = `Critical pH Level: ${raw.ph.toFixed(1)}`;
    } else if (raw.temp > limits.tempMax || raw.temp < limits.tempMin) {
      currentStatus = 'CRITICAL';
      alertMessage = `Critical Temperature: ${raw.temp.toFixed(1)}°C`;
    } else if (clarity < limits.clarityMin) {
      currentStatus = 'CRITICAL';
      alertMessage = `Critical Turbidity: ${clarity}%`;
    }

    setStatus(currentStatus);

    if (currentStatus === 'CRITICAL' && alertMessage !== '') {
      const currentMs = Date.now();
      if (currentMs - lastAlarmTime.current > 300000) { 
        lastAlarmTime.current = currentMs; 
        const newLogRef = push(ref(database, `users/${user.uid}/tanks/mainTank/logs`));
        set(newLogRef, { id: currentMs.toString(), event: alertMessage, time: new Date().toLocaleString(), status: "CRITICAL" });
      }
    }
  }, [raw, limits, user]);

  const confirmAction = (event: string) => {
    if (!user) return;
    const newLogRef = push(ref(database, `users/${user.uid}/tanks/mainTank/logs`));
    set(newLogRef, { 
      id: Date.now().toString(), 
      event: event, 
      time: new Date().toLocaleString(), 
      status: "GOOD" 
    }).then(() => { 
        setWaterChangeOpen(false); 
        setFeedingOpen(false); 
    });
  };

  const clarity = Math.round(Math.max(0, 100 - (raw.tds / 10)));
  const showWaterBanner = info.nextWaterChange && now >= info.nextWaterChange;

  if (isLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title={info.name} subtitle="Live Monitoring" right={<StatusBadge status={status} small />} />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={[styles.qualityBanner, { backgroundColor: statusConfig.color }]}>
          <MaterialIcons name={statusConfig.icon as any} size={18} color="#fff" />
          <Text style={styles.qualityBannerText}>{statusConfig.label}</Text>
        </View>

        {showWaterBanner && (
          <View style={styles.bannerCard}>
            <Text style={styles.bannerText}>⚠️ Time to change water</Text>
          </View>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoDesc}>{info.description || "No description set."}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditOpen(true)}><Text style={styles.editLink}>Edit Info</Text></TouchableOpacity>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setWaterChangeOpen(true)}>
            <Text style={styles.actionBtnText}>💧 Water</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setFeedingOpen(true)}>
            <Text style={styles.actionBtnText}>🐟 Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: T.blueLight }]} onPress={() => setReminderOpen(true)}>
            <Text style={[styles.actionBtnText, { color: T.blue }]}>🔔 Remind</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>PH Level</Text>
          <Text style={styles.metricValue}>{raw.ph.toFixed(1)}</Text>
          <Text style={styles.metricRange}>Ideal: {limits.phMin} – {limits.phMax}</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={styles.metricValue}>{raw.temp.toFixed(1)}<Text style={styles.metricUnit}>°C</Text></Text>
          <Text style={styles.metricRange}>Ideal: {limits.tempMin}°C – {limits.tempMax}°C</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Turbidity</Text>
          <Text style={styles.metricValue}>{clarity}<Text style={styles.metricUnit}>%</Text></Text>
          <Text style={styles.metricRange}>Min: {limits.clarityMin}%</Text>
        </Card>
      </ScrollView>

      <EditInfoModal 
        visible={editOpen} 
        onClose={() => setEditOpen(false)} 
        currentName={info.name} 
        currentDesc={info.description} 
        userUid={user?.uid} 
      />
      
      <ConfirmModal visible={waterChangeOpen} title="Water Change" onConfirm={() => confirmAction("Water Changed")} onClose={() => setWaterChangeOpen(false)} />
      <ConfirmModal visible={feedingOpen} title="Feeding" onConfirm={() => confirmAction("Feeding Completed")} onClose={() => setFeedingOpen(false)} />
      <ReminderModal visible={reminderOpen} onClose={() => setReminderOpen(false)} userUid={user?.uid} />
    </View>
  );
}

// ==========================
// SUB-COMPONENTS
// ==========================

function EditInfoModal({ visible, onClose, currentName, currentDesc, userUid }: any) {
  const [name, setName] = React.useState(currentName);
  const [desc, setDesc] = React.useState(currentDesc);

  React.useEffect(() => { if (visible) { setName(currentName); setDesc(currentDesc); } }, [visible, currentName, currentDesc]);

  const handleSave = () => {
    update(ref(database, `users/${userUid}/tanks/mainTank`), { name, description: desc }); 
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Edit Tank Info</Text>
          <FormInput label="Tank Name" value={name} onChangeText={setName} />
          <FormInput label="Description" value={desc} onChangeText={setDesc} />
          <View style={modal.actions}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({ visible, title, onConfirm, onClose }: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Confirm {title}?</Text>
          <View style={modal.actions}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Confirm" onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ----------------------------------------------------
// Reminder Modal (Simplified to Days Only)
// ----------------------------------------------------
function ReminderModal({ visible, onClose, userUid }: any) {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [days, setDays] = React.useState('7');

  React.useEffect(() => {
    if (visible && userUid) {
      const reminderRef = ref(database, `users/${userUid}/tanks/mainTank/reminder`);
      onValue(reminderRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setIsEnabled(data.enabled || false);
          setDays(data.days || '7');
        }
      }, { onlyOnce: true });
    }
  }, [visible, userUid]);

  const handleSave = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }
    if (finalStatus !== 'granted') {
      Alert.alert("Permission Required", "Please enable notifications in your phone settings to use reminders.");
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (isEnabled) {
      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum <= 0) {
        Alert.alert("Invalid Input", "Please enter a valid number of days.");
        return;
      }

      // Schedule the recurring notification
      await Notifications.scheduleNotificationAsync({
        content: { title: "AquaGuard", body: "Time for your routine aquarium maintenance!" },
        trigger: { seconds: daysNum * 86400, repeats: true } as any,
      });
    }

    // Save to Firebase
    update(ref(database, `users/${userUid}/tanks/mainTank/reminder`), {
      enabled: isEnabled,
      days,
    });

    Alert.alert("Saved", isEnabled ? `Reminder set for every ${days} day(s).` : "Reminders disabled.");
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Set Reminder</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Reminders</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#cbd5e1', true: T.blue }}
            />
          </View>

          {isEnabled && (
            <View style={styles.reminderConfig}>
              <FormInput
                label="Every (Days)"
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={[modal.actions, { marginTop: 20 }]}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 10 },
  qualityBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    borderRadius: 12, 
    gap: 8,
    marginBottom: 4
  },
  qualityBannerText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  bannerCard: { backgroundColor: '#FEF3C7', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B', alignItems: 'center' },
  bannerText: { color: '#B45309', fontWeight: '800' },
  infoCard: { padding: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  infoDesc: { color: T.textSec, fontSize: 13 },
  editLink: { color: T.blue, fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: T.blue },
  actionBtnText: { fontWeight: '700', fontSize: 13, color: T.blue },
  metricCard: { padding: 16, borderRadius: 12, backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  metricLabel: { color: T.textSec, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: T.blue, fontSize: 40, fontWeight: '800' },
  metricUnit: { fontSize: 20 },
  metricRange: { color: T.textMuted, fontSize: 12, marginTop: 4 },
  
  // Reminder Styles
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  reminderConfig: { gap: 16 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: T.white, borderRadius: 16, padding: 20 },
  title: { color: T.textPri, fontWeight: '700', fontSize: 18, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10 },
});