import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings, HelpCircle, LogOut, ChevronRight, User,
  Calendar, Package, Clock, Mail, MapPin, Phone,
} from 'lucide-react-native';
import { useUser } from '@/app/_context/UserContext';
import Avatar from '@/app/_components/Avatar';
import { logoutUser, deleteUserAccount } from '@/app/_utils/authApi';

const S = {
  white:  '#FFFFFF',
  black:  '#0A0A0A',
  gray50: '#FAFAFA',
  gray100:'#F4F4F5',
  gray400:'#A1A1AA',
  gray600:'#52525B',
  red:    '#DC2626',
  redMuted:'#FEF2F2',
  border: '#E4E4E7',
  radius: 4,
}

function ProfileRow({ Icon, label, onPress, danger = false }: {
  Icon: any; label: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowLeft}>
        <Icon size={17} color={danger ? S.red : S.black} />
        <Text style={[styles.rowLabel, danger && { color: S.red }]}>{label}</Text>
      </View>
      <ChevronRight size={14} color={S.gray400} />
    </TouchableOpacity>
  )
}

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const handleLogout = async () => {
    try { await logoutUser() } catch {}
    finally {
      setUser(null)
      router.replace('/screens/WelcomeScreen')
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Close Vendor Account',
      'Permanently delete your vendor account, services, and all bookings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount()
              setUser(null)
              router.replace('/screens/WelcomeScreen')
            } catch {
              Alert.alert('Error', 'Failed to delete account')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>ASAAN TAQREEB</Text>
        <Text style={styles.topBarSub}>VENDOR PROFILE</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Identity card ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.identityCard}>
            <Avatar name={user?.name || 'V'} size="lg" />
            <View style={styles.identityInfo}>
              <Text style={styles.vendorName}>{user?.name || 'Vendor Partner'}</Text>
              <View style={styles.metaRow}>
                <Mail size={11} color={S.gray400} />
                <Text style={styles.metaText} numberOfLines={1}>{user?.email || '—'}</Text>
              </View>
              <View style={styles.metaRow}>
                <MapPin size={11} color={S.gray400} />
                <Text style={styles.metaText}>Location not set</Text>
              </View>
              <View style={styles.metaRow}>
                <Phone size={11} color={S.gray400} />
                <Text style={styles.metaText}>No phone added</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Business Account ─────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>BUSINESS ACCOUNT</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.menu}>
            <ProfileRow Icon={Package}  label="Manage My Services"     onPress={() => router.push('/screens/vendor/Component/ManageServicesScreen')} />
            <ProfileRow Icon={Calendar} label="Calendar Management"    onPress={() => router.push('/screens/vendor/Component/VendorCalendarScreen')} />
            <ProfileRow Icon={Clock}    label="Operating Times"        onPress={() => router.push('/screens/vendor/Component/TimeSlotsScreen')} />
            <ProfileRow Icon={User}     label="Business Profile"       onPress={() => router.push('/screens/vendor/Component/AboutMeScreen')} />
            <ProfileRow Icon={Settings} label="Settings & Privacy"     onPress={() => router.push('/screens/vendor/Component/VendorSettingsScreen')} />
          </View>
        </View>

        {/* ── Support ──────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>SUPPORT</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.menu}>
            <ProfileRow
              Icon={HelpCircle}
              label="Partner Support"
              onPress={() => Alert.alert('Help & Support', 'Contact us at support@asaantaqreeb.com')}
            />
          </View>
        </View>

        {/* ── Danger zone ──────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
        </View>
        <View style={[styles.section, { gap: 8 }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color={S.red} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteBtn} activeOpacity={0.7}>
            <Text style={styles.deleteText}>CLOSE VENDOR ACCOUNT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>ASAAN TAQREEB VENDOR V1.0.4</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: S.gray50,
  },
  topBar: {
    backgroundColor: S.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: S.border,
    gap: 2,
  },
  topBarTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.black,
  },
  topBarSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: S.gray400,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionHead: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 0,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: S.border,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.gray400,
  },
  // Identity card
  identityCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  identityInfo: {
    flex: 1,
    gap: 6,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '800',
    color: S.black,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: S.gray400,
    flex: 1,
  },
  // Menu
  menu: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: S.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: S.black,
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: S.radius,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: S.red,
  },
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: S.gray400,
  },
  version: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: S.gray400,
    textAlign: 'center',
    marginTop: 24,
  },
})
