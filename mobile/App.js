// App.js
// Root navigator: Login → DrawerNav (MainTabs) → Player
//
// IMPORTANT: 'react-native-gesture-handler' MUST be the very first import.
// The DrawerNavigator requires it at module load time.
import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DrawerActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

import { auth, db } from './src/firebase';
import { COLORS, PLAYLISTS } from './src/constants';

// Audio session config has moved into PlayerContextProvider so the session
// is set up in the same lifecycle as the persistent player.
import { PlayerContextProvider } from './src/context/PlayerContext';
import MiniPlayer    from './src/components/MiniPlayer';
import DrawerContent from './src/components/DrawerContent';

import LoginScreen    from './src/screens/LoginScreen';
import DownloadScreen from './src/screens/DownloadScreen';
import LibraryScreen  from './src/screens/LibraryScreen';
import PlayerScreen   from './src/screens/PlayerScreen';

const Tab    = createBottomTabNavigator();
const Stack  = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ─── MainTabs ────────────────────────────────────────────────────────────────
// The two bottom tabs (Download + Library) plus the floating MiniPlayer.
// `navigation` here is the Drawer's navigation, so we can call openDrawer().
function MainTabs({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle:         { backgroundColor: COLORS.bg },
          headerTintColor:     COLORS.textPrimary,
          headerTitleStyle:    { fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,

          // ☰ Hamburger opens the sidebar drawer
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.hamburger}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>
          ),

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

      {/* Floats above the tab bar; only visible when a track is loaded */}
      <MiniPlayer />
    </View>
  );
}

// ─── DrawerNav ───────────────────────────────────────────────────────────────
// Thin wrapper that adds the side drawer around MainTabs.
// Player is kept outside the drawer (in the root Stack) so the drawer doesn't
// render while the full-screen player is open.
function DrawerNav() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown:    false,   // Tab.Navigator provides its own headers
        drawerPosition: 'left',
        drawerType:     'front', // Slides over content, dims background
        drawerStyle: {
          backgroundColor: COLORS.bg,
          width:           300,
        },
        overlayColor: 'rgba(0,0,0,0.55)',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="Main" component={MainTabs} />
    </Drawer.Navigator>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function initUserPlaylists(userId) {
  try {
    const ref  = doc(db, `users/${userId}/meta`, 'playlists');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { lists: PLAYLISTS, created: new Date() });
    }
  } catch (_) {}
}

// Creates the stats document on first sign-in (never overwrites existing data).
async function initUserStats(userId) {
  try {
    const ref  = doc(db, `users/${userId}/meta`, 'stats');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        memberSince:          serverTimestamp(),
        totalDownloads:       0,
        audioDownloads:       0,
        videoDownloads:       0,
        totalPlaybackMinutes: 0,
        lastActiveAt:         serverTimestamp(),
        favoritePlaylists:    {},
      });
    }
  } catch (_) {}
}

// Stamps the last-active time whenever the app comes to the foreground.
async function updateLastActive(userId) {
  try {
    const ref = doc(db, `users/${userId}/meta`, 'stats');
    await updateDoc(ref, { lastActiveAt: serverTimestamp() });
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

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await initUserPlaylists(firebaseUser.uid);
        await initUserStats(firebaseUser.uid);
      }
      setUser(firebaseUser ?? null);
    });
    return unsub;
  }, []);

  // Update lastActiveAt whenever the app comes back to the foreground.
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') updateLastActive(user.uid);
    });
    return () => sub.remove();
  }, [user?.uid]);

  if (user === undefined) return <SplashScreen />;

  return (
    // GestureHandlerRootView is required by react-native-gesture-handler
    // and must wrap the entire app tree.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlayerContextProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {user ? (
                <>
                  {/* DrawerNav wraps MainTabs (Download + Library tabs) */}
                  <Stack.Screen name="Home" component={DrawerNav} />

                  {/* Player is a full-screen stack push — drawer not visible here */}
                  <Stack.Screen
                    name="Player"
                    component={PlayerScreen}
                    options={{
                      headerShown:         true,
                      title:               'Now Playing',
                      headerStyle:         { backgroundColor: COLORS.bg },
                      headerTintColor:     COLORS.textPrimary,
                      headerTitleStyle:    { fontWeight: '700' },
                      headerShadowVisible: false,
                      animation:           'slide_from_bottom',
                    }}
                  />
                </>
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PlayerContextProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hamburger: {
    paddingLeft:  16,
    paddingRight: 8,
  },
  hamburgerIcon: {
    fontSize: 22,
    color:    COLORS.textPrimary,
  },
  splash: {
    flex:            1,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  splashLogo:  { fontSize: 64, marginBottom: 12 },
  splashTitle: { fontSize: 36, color: COLORS.teal, fontWeight: 'bold', letterSpacing: 1 },
});
