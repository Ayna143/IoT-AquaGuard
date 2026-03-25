import React, { useState, useEffect, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ref, onValue, push, set, update, remove } from 'firebase/database';import { database } from '../../firebaseConfig'; 
import { Card, GhostButton, PrimaryButton, ScreenHeader, StatusBadge, T, FormInput } from './shared';

export default function DashboardTab() {
  const [editOpen, setEditOpen] = useState(false);
  const [waterChangeOpen, setWaterChangeOpen] = useState(false);
  const [feedingOpen, setFeedingOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  
  const lastAlarmTime = useRef<number>(0); 
  
  const [now, setNow] = useState(Date.now());
  const [raw, setRaw] = useState({ ph: 7.0, temp: 25.0, tds: 0 });
  const [info, setInfo] = useState({ name: 'Fish Tank 1', description: '', nextWaterChange: null });
  const [status, setStatus] = useState('GOOD');
  
  const [limits, setLimits] = useState({ phMin: 6.5, phMax: 7.5, tempMin: 24, tempMax: 28, clarityMin: 80 });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(database, 'settings/thresholds'), snap => {
      if(snap.exists()) {
        const val = snap.val();
        setLimits({
          phMin: parseFloat(val.phMin) || 6.5,
          phMax: parseFloat(val.phMax) || 7.5,
          tempMin: parseFloat(val.tempMin) || 24,
          tempMax: parseFloat(val.tempMax) || 28,
          clarityMin: parseFloat(val.clarityMin) || 80
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(database, 'aquarium/'), snap => {
      if (snap.exists()) {
        const data = snap.val();
        setRaw({ ph: data.ph || 7.0, temp: data.temp || 25.0, tds: data.tds || 0 });
        if (data.info) {
          setInfo({ 
            name: data.info.name || "Fish Tank 1", 
            description: data.info.description || "",
            nextWaterChange: data.info.nextWaterChange || null 
          });
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
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
    } else {
      const phBuffer = (limits.phMax - limits.phMin) * 0.15;
      if (raw.ph >= limits.phMax - phBuffer || raw.ph <= limits.phMin + phBuffer) {
        currentStatus = 'CAUTION';
      }
    }

    setStatus(currentStatus);

    if (currentStatus === 'CRITICAL' && alertMessage !== '') {
      const currentMs = Date.now();
      if (currentMs - lastAlarmTime.current > 300000) { 
        lastAlarmTime.current = currentMs; 
        const newLogRef = push(ref(database, 'activity_logs/'));
        set(newLogRef, { id: currentMs.toString(), tank: info.name, event: alertMessage, time: new Date().toLocaleString(), status: "CRITICAL" });
      }
    }
  }, [raw, limits, info.name]);

 const confirmAction = (event: string) => {
    if (event === "Water Changed") {
      setInfo(prev => ({ ...prev, nextWaterChange: null }));
      
      remove(ref(database, 'aquarium/info/nextWaterChange'));
    }

    const newLogRef = push(ref(database, 'activity_logs/'));
    set(newLogRef, { 
      id: Date.now().toString(), 
      tank: info.name, 
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

  return (
    <View style={styles.root}>
      <ScreenHeader title={info.name} subtitle={`Sensor ID #001 · Live`} right={<StatusBadge status={status} small />} />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Dynamic Water Change Banner */}
        {showWaterBanner && (
          <View style={styles.bannerCard}>
            <Text style={styles.bannerText}>⚠️ Time to change water</Text>
          </View>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoDesc}>{info.description || "No description set."}</Text>
            <TouchableOpacity onPress={() => setEditOpen(true)}><Text style={styles.editLink}>Edit Info</Text></TouchableOpacity>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: T.blue, borderWidth: 1 }]} onPress={() => setWaterChangeOpen(true)}>
            <Text style={[styles.actionBtnText, { color: T.blue }]}>💧 Water</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: T.blue, borderWidth: 1 }]} onPress={() => setFeedingOpen(true)}>
            <Text style={[styles.actionBtnText, { color: T.blue }]}>🐟 Feed</Text>
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
          <Text style={styles.metricRange}>Min Acceptable: {limits.clarityMin}%</Text>
        </Card>

      </ScrollView>

      <EditInfoModal visible={editOpen} onClose={() => setEditOpen(false)} currentName={info.name} currentDesc={info.description} />
      <ConfirmModal visible={waterChangeOpen} title="Water Change" onConfirm={() => confirmAction("Water Changed")} onClose={() => setWaterChangeOpen(false)} />
      <ConfirmModal visible={feedingOpen} title="Feeding" onConfirm={() => confirmAction("Feeding Completed")} onClose={() => setFeedingOpen(false)} />
      <ReminderModal visible={reminderOpen} onClose={() => setReminderOpen(false)} tankName={info.name} />
    </View>
  );
}

function EditInfoModal({ visible, onClose, currentName, currentDesc }: any) {
  const [name, setName] = React.useState(currentName);
  const [desc, setDesc] = React.useState(currentDesc);

  React.useEffect(() => { if (visible) { setName(currentName); setDesc(currentDesc); } }, [visible, currentName, currentDesc]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Edit Tank Info</Text>
          <FormInput label="Name" value={name} onChangeText={setName} />
          <FormInput label="Description" value={desc} onChangeText={setDesc} />
          <View style={modal.actions}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={() => { update(ref(database, 'aquarium/info'), { name, description: desc }); onClose(); }} style={{ flex: 1 }} />
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

function ReminderModal({ visible, onClose, tankName }: any) {
  const [mode, setMode] = useState<'days' | 'date'>('days');
  const [days, setDays] = useState('45');
  const [date, setDate] = useState('2026-03-30');
  const [time, setTime] = useState('09:00');

  const handleSave = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Error', 'Enable notifications in settings.'); return; }

    let trigger: Notifications.NotificationTriggerInput;
    let logText = '';
    let targetTimeMs = 0;

    if (mode === 'days') {
      trigger = { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: parseInt(days) * 86400, repeats: true };
      logText = `Reminder set every ${days} days`;
      targetTimeMs = Date.now() + (parseInt(days) * 86400 * 1000);
    } else {
      const targetDate = new Date(`${date}T${time}:00`);
      if (isNaN(targetDate.getTime()) || targetDate <= new Date()) { Alert.alert('Error', 'Pick a future date.'); return; }
      trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: targetDate }; 
      logText = `Reminder set for ${targetDate.toLocaleString()}`;
      targetTimeMs = targetDate.getTime();
    }

    await Notifications.scheduleNotificationAsync({ 
      content: { title: "🔔 AquaGuard", body: "Reminding you to Change Aquarium Water" }, 
      trigger 
    });
    
    await update(ref(database, 'aquarium/info'), { nextWaterChange: targetTimeMs });

    const newLogRef = push(ref(database, 'activity_logs/'));
    set(newLogRef, { tank: tankName, event: logText, time: new Date().toLocaleString(), status: "GOOD" });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Set Reminder</Text>
          <View style={modal.toggleRow}>
            <TouchableOpacity style={[modal.toggleBtn, mode==='days' && modal.active]} onPress={()=>setMode('days')}><Text style={{fontWeight:'700'}}>Interval</Text></TouchableOpacity>
            <TouchableOpacity style={[modal.toggleBtn, mode==='date' && modal.active]} onPress={()=>setMode('date')}><Text style={{fontWeight:'700'}}>Date</Text></TouchableOpacity>
          </View>
          {mode === 'days' ? (
            <FormInput label="Interval (Days)" value={days} onChangeText={setDays} keyboardType="numeric" />
          ) : (
            <View>
              <FormInput label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
              <FormInput label="Time (HH:MM)" value={time} onChangeText={setTime} />
            </View>
          )}
          <View style={modal.actions}>
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
  
  bannerCard: { backgroundColor: '#FEF3C7', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B', alignItems: 'center', marginBottom: 4 },
  bannerText: { color: '#B45309', fontWeight: '800', fontSize: 14 },
  
  infoCard: { padding: 12 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoDesc: { color: T.textSec, fontSize: 13, flex: 1 },
  editLink: { color: T.blue, fontWeight: '700', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', fontSize: 13 },
  metricCard: { gap: 4, backgroundColor: T.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: T.border },
  metricLabel: { color: T.textSec, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: T.blue, fontSize: 40, fontWeight: '800' },
  metricUnit: { fontSize: 20 },
  metricRange: { color: T.textMuted, fontSize: 12, marginTop: 4 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: T.white, borderRadius: 16, padding: 20 },
  title: { color: T.textPri, fontWeight: '700', fontSize: 18, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', backgroundColor: T.bg, borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  active: { backgroundColor: T.white, elevation: 2 },
});