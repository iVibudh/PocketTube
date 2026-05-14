import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { COLORS } from '../constants';

// Native Google Sign-In — uses the Android/iOS SDK directly, no browser or
// redirect URIs needed. Verified by package name + SHA-1 fingerprint.
GoogleSignin.configure({
  webClientId: '478381526713-hcgb0ssbl7969gdk9v96ku1n5d9dmass.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken ?? userInfo.idToken;
      if (!idToken) throw new Error('No ID token returned from Google Sign-In');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      setLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available on this device.');
      } else {
        Alert.alert('Sign-in failed', error.message);
      }
    }
  };

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
          style={styles.btn}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>For personal use only · Not affiliated with YouTube</Text>
        <Text style={styles.version}>Version 1.5.0</Text>
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
});
