// app/(tabs)/index.tsx  — Home / Auth entry
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormInput, PrimaryButton, T } from './shared';

// Simple fish SVG-style logo using View shapes
function FishLogo() {
  return (
    <View style={logo.wrap}>
      <View style={logo.body} />
      <View style={logo.tail} />
      <View style={logo.eye} />
    </View>
  );
}

const logo = StyleSheet.create({
  wrap: { width: 64, height: 40, position: 'relative', marginBottom: 20 },
  body: {
    position: 'absolute', left: 12, top: 4,
    width: 48, height: 32, borderRadius: 16,
    backgroundColor: T.blue,
  },
  tail: {
    position: 'absolute', left: 0, top: 8,
    width: 0, height: 0,
    borderTopWidth: 12, borderBottomWidth: 12, borderRightWidth: 16,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: T.blueMid,
  },
  eye: {
    position: 'absolute', right: 14, top: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.white,
  },
});

function CreateAccountScreen({ onSwitch }: { onSwitch: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.logoRow}>
        <FishLogo />
        <Text style={styles.logoTitle}>Smart Care for{'\n'}Silent Friends.</Text>
        <Text style={styles.logoSub}>Monitor your aquariums, anytime.</Text>
      </View>
      <FormInput placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      <FormInput placeholder="Username" autoCapitalize="none" />
      <FormInput placeholder="Password" secureTextEntry />
      <FormInput placeholder="Confirm Password" secureTextEntry />
      <PrimaryButton label="Create Account" onPress={onSwitch} style={{ marginTop: 4 }} />
      <TouchableOpacity onPress={onSwitch} style={styles.switchWrap}>
        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Text style={{ color: T.blue, fontWeight: '700' }}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function LoginScreen({ onLogin, onSwitch }: { onLogin: () => void; onSwitch: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.logoRow}>
        <FishLogo />
        <Text style={styles.logoTitle}>Welcome back.</Text>
        <Text style={styles.logoSub}>Sign in to your AquaWatch account.</Text>
      </View>
      <FormInput placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      <FormInput placeholder="Password" secureTextEntry />
      <PrimaryButton label="Sign In" onPress={onLogin} style={{ marginTop: 4 }} />
      <TouchableOpacity onPress={onSwitch} style={styles.switchWrap}>
        <Text style={styles.switchText}>
          Don't have an account?{' '}
          <Text style={{ color: T.blue, fontWeight: '700' }}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const [view, setView] = useState<'login' | 'create'>('login');
  const router = useRouter();

  function handleLogin() {
    // Navigate to the Tanks tab after login
    router.replace('/dashboard');
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      {view === 'login' ? (
        <LoginScreen onLogin={handleLogin} onSwitch={() => setView('create')} />
      ) : (
        <CreateAccountScreen onSwitch={() => setView('login')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  authScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: T.bg,
  },
  logoRow: { alignItems: 'center', marginBottom: 40 },
  logoTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: T.textPri,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  logoSub: {
    fontSize: 14,
    color: T.textSec,
    textAlign: 'center',
  },
  switchWrap: { marginTop: 20, alignItems: 'center' },
  switchText: { color: T.textSec, fontSize: 14 },
});
