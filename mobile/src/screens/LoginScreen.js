import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { COLORS } from '../constants';

WebBrowser.maybeCompleteAuthSession();

const EXPO_CLIENT_ID    = '478381526713-hcgb0ssbl7969gdk9v96ku1n5d9dmass.apps.googleusercontent.com'; // Web
const IOS_CLIENT_ID     = '478381526713-ukth1iml454cjst6rta1t7m52rot5ec7.apps.googleusercontent.com';  // iOS
const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com'; // Phase 6 — add when needed

// Redirect URI for Expo Go development — must match what's registered in Google Cloud Console
// If your local IP changes, update this and re-register it in Google Console
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'exp' });

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:        EXPO_CLIENT_ID,
    iosClientId:     IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .catch((err) => { Alert.alert('Sign-in failed', err.message); setLoading(false); });
    } else if (response?.type === 'error') {
      Alert.alert('Sign-in error', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎵</Text>
      <Text style={styles.title}>PocketTube</Text>
      <Text style={styles.sub}>Your personal media library</Text>
      <View style={styles.divider} />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.teal} />
      ) : (
        <TouchableOpacity
          style={[styles.btn, !request && styles.btnDisabled]}
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}
      {/* DEV ONLY — remove before TestFlight */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => {
            setLoading(true);
            signInAnonymously(auth).catch((err) => {
              Alert.alert('Dev login failed', err.message);
              setLoading(false);
            });
          }}
        >
          <Text style={styles.devBtnText}>⚠️ Dev Login (anonymous)</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>For personal use only · Not affiliated with YouTube</Text>
        <Text style={styles.version}>Version 1.1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:        { fontSize: 72, marginBottom: 12 },
  title:       { fontSize: 42, color: COLORS.teal, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  sub:         { fontSize: 16, color: COLORS.textSecondary, marginBottom: 48 },
  divider:     { width: 60, height: 2, backgroundColor: COLORS.surface, marginBottom: 48 },
  btn:         { backgroundColor: COLORS.teal, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnDisabled: { backgroundColor: COLORS.surface },
  btnText:     { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  footer:      { position: 'absolute', bottom: 40, alignItems: 'center', gap: 4 },
  disclaimer:  { fontSize: 12, color: COLORS.textMuted },
  version:     { fontSize: 11, color: COLORS.border },
  devBtn:      { marginTop: 24, borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  devBtnText:  { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
});
