import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { ref, onValue, update, push } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons'; 
import { auth, database } from '../../firebaseConfig'; 
import { Card, FormInput, ScreenHeader, T, PrimaryButton, GhostButton } from './shared'; 

interface ThresholdSettings {
  phMin: string; phMax: string; tempMin: string; tempMax: string; clarityMin: string;
}

export default function ProfileScreen() {
  const [view, setView] = useState<'main' | 'sensors'>('main');
  const [tank, setTank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [profileName, setProfileName] = useState('Aqua User');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [tankModalOpen, setTankModalOpen] = useState(false);

  // Default fallback limits
  const [limits, setLimits] = useState<ThresholdSettings>({ 
    phMin: '6.5', phMax: '7.5', tempMin: '24.0', tempMax: '28.0', clarityMin: '80' 
  });

  const user = auth.currentUser;
  
  // CRITICAL FIX: Since login is removed, we provide a default uid so Firebase saves still work!
  const uid = user?.uid || 'guest_user';

  const getInitial = () => {
    return profileName.charAt(0).toUpperCase();
  };

  useEffect(() => {
    // 1. Fetch the tank info and thresholds
    const tankRef = ref(database, `users/${uid}/tanks/mainTank`);
    const unsubTank = onValue(tankRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setTank(data);
        if (data.thresholds) setLimits(data.thresholds);
      }
      setLoading(false);
    });

    // 2. Fetch the custom profile name
    const profileRef = ref(database, `users/${uid}/profile`);
    const unsubProfile = onValue(profileRef, (snap) => {
      if (snap.exists() && snap.val().username) {
        setProfileName(snap.val().username);
      } else if (user?.displayName) {
        setProfileName(user.displayName);
      }
    });

    return () => {
      unsubTank();
      unsubProfile();
    };
  }, [uid]);

  // SETTINGS BUTTON LOGIC
  const saveSensorSettings = () => {
    update(ref(database, `users/${uid}/tanks/mainTank/thresholds`), limits)
      .then(() => {
        push(ref(database, `users/${uid}/tanks/mainTank/logs`), {
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

  // SETTINGS VIEW
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.userName}>{profileName}</Text>
          <TouchableOpacity onPress={() => setProfileEditOpen(true)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <MaterialIcons name="edit" size={20} color={T.textSec} />
          </TouchableOpacity>
        </View>
        {/* Email display completely removed */}
      </View>

      <Text style={styles.sectionTitle}>My Aquarium</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setTankModalOpen(true)}>
        <Card style={styles.tankCard}>
          <MaterialIcons name="waves" size={24} color={T.blue} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.tankName}>{tank?.name || "Main Tank"}</Text>
            <Text style={styles.tankDetails} numberOfLines={1}>{tank?.description || "Click to view details"}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={T.textMuted} />
        </Card>
      </TouchableOpacity>

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

      {/* Modals */}
      <ProfileEditModal 
        visible={profileEditOpen} 
        onClose={() => setProfileEditOpen(false)} 
        currentName={profileName} 
        uid={uid} 
      />

      <TankDetailsModal 
        visible={tankModalOpen} 
        onClose={() => setTankModalOpen(false)} 
        tank={tank} 
        uid={uid} 
      />
    </ScrollView>
  );
}

// ==========================================
// SUB-COMPONENTS & MODALS
// ==========================================

function ProfileEditModal({ visible, onClose, currentName, uid }: any) {
  const [name, setName] = React.useState(currentName);

  React.useEffect(() => { 
    if (visible) setName(currentName); 
  }, [visible, currentName]);

  const handleSave = () => {
    update(ref(database, `users/${uid}/profile`), { username: name });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>Edit Profile</Text>
          <FormInput label="Username" value={name} onChangeText={setName} />
          <View style={modal.actions}>
            <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TankDetailsModal({ visible, onClose, tank, uid }: any) {
  const [isEditing, setIsEditing] = React.useState(false);
  
  const [name, setName] = React.useState(tank?.name || 'Main Tank');
  const [desc, setDesc] = React.useState(tank?.description || '');
  const [numFish, setNumFish] = React.useState(tank?.numberOfFish || '');
  const [typeFish, setTypeFish] = React.useState(tank?.typeOfFish || '');

  React.useEffect(() => {
    if (visible) {
      setName(tank?.name || 'Main Tank');
      setDesc(tank?.description || '');
      setNumFish(tank?.numberOfFish?.toString() || '');
      setTypeFish(tank?.typeOfFish || '');
      setIsEditing(false); 
    }
  }, [visible, tank]);

  const handleSave = () => {
    update(ref(database, `users/${uid}/tanks/mainTank`), {
      name,
      description: desc,
      numberOfFish: numFish,
      typeOfFish: typeFish
    }).then(() => setIsEditing(false));
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.box}>
          
          <View style={styles.modalHeader}>
             <Text style={modal.title}>Aquarium Details</Text>
             {!isEditing && (
               <TouchableOpacity onPress={() => setIsEditing(true)}>
                 <MaterialIcons name="edit" size={22} color={T.blue} />
               </TouchableOpacity>
             )}
          </View>

          {isEditing ? (
            <View style={{ gap: 10, marginBottom: 20 }}>
              <FormInput label="Tank Name" value={name} onChangeText={setName} />
              <FormInput label="Description" value={desc} onChangeText={setDesc} />
              <FormInput label="Number of Fish" value={numFish} onChangeText={setNumFish} keyboardType="numeric" />
              <FormInput label="Type of Fish" value={typeFish} onChangeText={setTypeFish} />
            </View>
          ) : (
            <View style={{ gap: 14, marginBottom: 24 }}>
              <View>
                <Text style={styles.detailLabel}>Tank Name</Text>
                <Text style={styles.detailValue}>{name}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{desc || 'No description set.'}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Number of Fish</Text>
                <Text style={styles.detailValue}>{numFish || 'Not specified'}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Type of Fish</Text>
                <Text style={styles.detailValue}>{typeFish || 'Not specified'}</Text>
              </View>
            </View>
          )}

          <View style={modal.actions}>
            <GhostButton 
              label={isEditing ? "Cancel" : "Close"} 
              onPress={() => isEditing ? setIsEditing(false) : onClose()} 
              style={{ flex: 1 }} 
            />
            {isEditing && <PrimaryButton label="Save" onPress={handleSave} style={{ flex: 1 }} />}
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { paddingBottom: 20 },
  
  // Profile Header
  profileCard: { alignItems: 'center', marginBottom: 32, paddingTop: 40 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.blue, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: T.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  
  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 20, marginBottom: 12 },
  sectionLabel: { color: T.textPri, fontWeight: '700', fontSize: 15, marginTop: 15, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  
  // Cards
  tankCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tankName: { fontSize: 16, fontWeight: '700', color: T.blue },
  tankDetails: { fontSize: 12, color: '#64748b' },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  settingIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: T.textPri, fontWeight: '700', fontSize: 15 },
  settingSub: { color: T.textSec, fontSize: 12, marginTop: 1 },

  // Detail Modal specifics
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#0f172a', fontWeight: '500' }
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 18, marginBottom: 0 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});