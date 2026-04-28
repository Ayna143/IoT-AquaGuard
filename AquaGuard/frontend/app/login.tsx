import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../firebaseConfig'; 

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- GOOGLE AUTH SETUP ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(() => {
          router.replace('/(tabs)/dashboard');
        })
        .catch((error) => {
          Alert.alert('Google Sign-In Failed', error.message);
          setLoading(false);
        });
    }
  }, [response]);

  // --- EMAIL/PASSWORD LOGIN LOGIC ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/dashboard'); 
    } catch (error: any) {
      const errorMessage = error.message ? error.message.replace('Firebase: ', '') : 'An unknown error occurred';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.headerTitle}>AquaGuard</Text>
        <Text style={styles.subHeader}>Welcome back to your dashboard</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* --- DIVIDER --- */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* --- LINK TO SEPARATE SIGN UP PAGE --- */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.toggleLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#ffffff', padding: 32, borderRadius: 24, borderWidth: 1,
    borderColor: '#e2e8f0', shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 5
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#065f46', marginBottom: 8, textAlign: 'center' },
  subHeader: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, paddingHorizontal: 10 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0'
  },
  primaryButton: {
    backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center',
    marginTop: 12, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', paddingHorizontal: 16, fontSize: 12, fontWeight: '600' },
  googleButton: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#10b981',
    borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12
  },
  googleButtonText: { color: '#10b981', fontSize: 16, fontWeight: '700' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  toggleText: { color: '#64748b', fontSize: 14 },
  toggleLink: { color: '#10b981', fontSize: 14, fontWeight: '700' }
});