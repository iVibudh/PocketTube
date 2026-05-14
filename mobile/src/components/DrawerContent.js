// src/components/DrawerContent.js
// Custom sidebar drawer — profile, navigation, plan badge, upgrade CTA, sign out.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS } from '../constants';

export default function DrawerContent(props) {
  const [plan, setPlan] = useState('free');
  const user = auth.currentUser;

  // Listen for plan changes in real time (will update instantly after Stripe
  // webhook fires in v1.6.0).
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/meta`, 'plan');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setPlan(snap.data()?.plan ?? 'free');
    });
    return unsub;
  }, [user?.uid]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(auth),
      },
    ]);
  };

  const handleUpgrade = () => {
    Alert.alert(
      '⭐ Upgrade to Pro',
      'Unlimited storage · No daily download cap.\n\nStripe payments are coming in v1.6.0 — stay tuned!',
      [{ text: 'Got it', style: 'default' }],
    );
  };

  const isPro = plan === 'pro';

  return (
    // scrollEnabled={false} + contentContainerStyle flex:1 lets us push the
    // footer to the bottom via justifyContent: 'space-between'.
    <DrawerContentScrollView
      {...props}
      scrollEnabled={false}
      contentContainerStyle={styles.container}
    >
      {/* ─── Top section ─────────────────────────────────── */}
      <View>
        {/* Profile */}
        <View style={styles.profileSection}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {user?.displayName ?? 'User'}
              </Text>
              <View style={[styles.planBadge, isPro ? styles.proBadge : styles.freeBadge]}>
                <Text style={styles.planBadgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
              </View>
            </View>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Navigation links */}
        <View style={styles.navSection}>
          <NavItem
            icon="⬇️"
            label="Download"
            onPress={() => {
              props.navigation.navigate('Main', { screen: 'Download' });
              props.navigation.closeDrawer();
            }}
          />
          <NavItem
            icon="📚"
            label="Library"
            onPress={() => {
              props.navigation.navigate('Main', { screen: 'Library' });
              props.navigation.closeDrawer();
            }}
          />
        </View>

        <View style={styles.divider} />

        {/* Upgrade CTA — only shown to Free users */}
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeIcon}>⭐</Text>
            <View style={styles.upgradeTextWrap}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSubtitle}>Unlimited storage · No daily cap</Text>
            </View>
            <Text style={styles.upgradeArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Bottom section ───────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>PocketTube v1.5.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── Reusable nav row ────────────────────────────────────────────────────────
function NavItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },

  // ── Profile ──
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  // ── Plan badge ──
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  proBadge:  { backgroundColor: COLORS.teal },
  freeBadge: { backgroundColor: COLORS.surface },
  planBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginVertical: 6,
  },

  // ── Nav links ──
  navSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navIcon:  { fontSize: 20 },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Upgrade CTA ──
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.teal + '55',
    gap: 12,
  },
  upgradeIcon: { fontSize: 22 },
  upgradeTextWrap: { flex: 1 },
  upgradeTitle: {
    color: COLORS.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  upgradeArrow: {
    color: COLORS.teal,
    fontSize: 24,
    fontWeight: '300',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  signOutBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
