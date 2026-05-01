// App.js — Step 4.7
// Root navigator: Login → Main (Download + Library tabs) → Player

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from './src/firebase';
import { COLORS, PLAYLISTS } from './src/constants';

import LoginScreen    from './src/screens/LoginScreen';
import DownloadScreen from './src/screens/DownloadScreen';
import LibraryScreen  from './src/screens/LibraryScreen';
import PlayerScreen   from './src/screens/PlayerScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle:            { backgroundColor: COLORS.bg },
        headerTintColor:        COLORS.textPrimary,
        headerTitleStyle:       { fontWeight: '700', fontSize: 18 },
        headerShadowVisible:    false,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor:  COLORS.surface,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
        },
        tabBarActiveTintColor:   COLORS.teal,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>
            {route.name === 'Download' ? '⬇️' : '📚'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Download" component={DownloadScreen} />
      <Tab.Screen name="Library"  component={LibraryScreen} />
    </Tab.Navigator>
  );
}

async function initUserPlaylists(userId) {
  try {
    const ref  = doc(db, `users/${userId}/meta`, 'playlists');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { lists: PLAYLISTS, created: new Date() });
    }
  } catch (_) {}
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashLogo}>🎵</Text>
      <Text style={styles.splashTitle}>PocketTube</Text>
      <ActivityIndicator color={COLORS.teal} style={{ marginTop: 40 }} />
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) await initUserPlaylists(firebaseUser.uid);
      setUser(firebaseUser ?? null);
    });
    return unsub;
  }, []);

  if (user === undefined) return <SplashScreen />;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="Player"
                component={PlayerScreen}
                options={{
                  headerShown:          true,
                  title:                'Now Playing',
                  headerStyle:          { backgroundColor: COLORS.bg },
                  headerTintColor:      COLORS.textPrimary,
                  headerTitleStyle:     { fontWeight: '700' },
                  headerShadowVisible:  false,
                  animation:            'slide_from_bottom',
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo:  { fontSize: 64, marginBottom: 12 },
  splashTitle: { fontSize: 36, color: COLORS.teal, fontWeight: 'bold', letterSpacing: 1 },
});
