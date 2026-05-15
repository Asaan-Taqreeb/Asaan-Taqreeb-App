import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp, CheckCircle, XCircle, Clock,
  ChevronRight, Calendar, Image as ImageIcon,
  ShoppingBasket, MessageCircle, Star, ArrowUpRight
} from 'lucide-react-native';
import { getVendorBookings, type VendorOrderItem } from '@/app/_utils/bookingsApi';
import OrderCard from '../Component/OrderCard';
import NotificationBell from '@/app/_components/NotificationBell';
import { useUser } from '@/app/_context/UserContext';
import { useLanguage } from '@/app/_context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Swiss Design Token System ──────────────────────────────────────
const S = {
  white:    '#FFFFFF',
  black:    '#0A0A0A',
  gray50:   '#FAFAFA',
  gray100:  '#F4F4F5',
  gray200:  '#E4E4E7',
  gray400:  '#A1A1AA',
  gray600:  '#52525B',
  gray900:  '#18181B',
  blue:     '#2563EB',   // Electric Blue accent — used sparingly
  blueMuted:'#EFF6FF',
  red:      '#DC2626',
  redMuted: '#FEF2F2',
  green:    '#16A34A',
  greenMuted:'#F0FDF4',
  amber:    '#D97706',
  amberMuted:'#FFFBEB',
  border:   '#E4E4E7',   // 1px uniform border
  radius:   4,
}

export default function VendorDashboardHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { t } = useLanguage();
  const [orders, setOrders] = React.useState<VendorOrderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [recentReviews, setRecentReviews] = React.useState<any[]>([]);
  const [avgRating, setAvgRating] = React.useState(4.8);

  const loadDashboard = React.useCallback(async () => {
    try {
      const data = await getVendorBookings();
      setOrders(data);
      const savedRatings = await AsyncStorage.getItem('client_rated_bookings');
      if (savedRatings) {
        const ratings = JSON.parse(savedRatings);
        const ratingArray = Object.values(ratings);
        if (ratingArray.length > 0) {
          const sum = ratingArray.reduce((acc: number, curr: any) => acc + curr.rating, 0);
          setAvgRating(Number((sum / ratingArray.length).toFixed(1)));
          setRecentReviews(ratingArray.slice(-3).reverse());
        }
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      loadDashboard();
    }, [loadDashboard])
  );

  const sortedOrders = React.useMemo(
    () => [...orders].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [orders]
  );

  const stats = React.useMemo(() => {
    const totalOrders   = orders.length;
    const accepted      = orders.filter(o => o.status === 'accepted').length;
    const rejected      = orders.filter(o => o.status === 'rejected').length;
    const pending       = orders.filter(o => o.status === 'pending').length;
    const totalRevenue  = orders
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { totalOrders, accepted, rejected, pending, totalRevenue };
  }, [orders]);

  const pendingOrders = React.useMemo(
    () => sortedOrders.filter(o => o.status === 'pending').slice(0, 3),
    [sortedOrders]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarBrand}>ASAAN TAQREEB</Text>
          <Text style={styles.topBarSub}>VENDOR DASHBOARD</Text>
        </View>
        <NotificationBell userId={user?.id} userRole="vendor" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        {/* ── REVENUE HERO ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <View>
                <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
                <Text style={styles.revenueValue} numberOfLines={1} adjustsFontSizeToFit>
                  PKR {stats.totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.revenueBadge}>
                <TrendingUp size={14} color={S.blue} />
                <Text style={styles.revenueBadgeText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.revenueFooter}>
              {stats.accepted} confirmed booking{stats.accepted !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* ── STAT GRID ───────────────────────────────────────────── */}
        <View style={[styles.section, styles.statGrid]}>
          <StatTile label="PENDING"  value={stats.pending}   accent={S.amber}  muted={S.amberMuted}  Icon={Clock} />
          <StatTile label="ACCEPTED" value={stats.accepted}  accent={S.green}  muted={S.greenMuted}  Icon={CheckCircle} />
          <StatTile label="REJECTED" value={stats.rejected}  accent={S.red}    muted={S.redMuted}    Icon={XCircle} />
          <StatTile label="RATING"   value={`${avgRating}`}  accent={S.blue}   muted={S.blueMuted}   Icon={Star} />
        </View>

        {/* ── SECTION DIVIDER ─────────────────────────────────────── */}
        <SectionHeader
          label="PENDING BOOKINGS"
          action="SEE ALL"
          onAction={() => router.push('/screens/vendor/_tabs/OrdersScreen')}
        />

        {/* ── ORDERS LIST ─────────────────────────────────────────── */}
        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading orders…</Text>
            </View>
          ) : pendingOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending bookings</Text>
            </View>
          ) : (
            pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() =>
                  router.push({
                    pathname: '/screens/vendor/Component/OrderDetailScreen',
                    params: { orderId: order.id, order: JSON.stringify(order) },
                  })
                }
              />
            ))
          )}
        </View>

        {/* ── RECENT REVIEWS ──────────────────────────────────────── */}
        {recentReviews.length > 0 && (
          <>
            <SectionHeader label="RECENT REVIEWS" />
            <View style={styles.section}>
              {recentReviews.map((review, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={11}
                          color={s <= review.rating ? S.amber : S.gray200}
                          fill={s <= review.rating ? S.amber : 'transparent'}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewTime}>JUST NOW</Text>
                  </View>
                  <Text style={styles.reviewText}>
                    "{review.comment || 'No comment provided.'}"
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
        <SectionHeader label="QUICK ACTIONS" />
        <View style={[styles.section, styles.actionGrid]}>
          <ActionTile label="Orders"    sub={`${stats.pending} PENDING`}   Icon={ShoppingBasket} onPress={() => router.push('/screens/vendor/_tabs/OrdersScreen')} />
          <ActionTile label="Calendar"  sub="AVAILABILITY"                  Icon={Calendar}       onPress={() => router.push('/screens/vendor/Component/VendorCalendarScreen')} />
          <ActionTile label="Messages"  sub="CLIENT CHATS"                  Icon={MessageCircle}  onPress={() => router.push('/screens/vendor/_tabs/VendorMessagesScreen')} />
          <ActionTile label="Gallery"   sub="SERVICE PHOTOS"                Icon={ImageIcon}      onPress={() => router.push('/screens/vendor/Component/ServiceImageManager')} />
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function SectionHeader({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View style={sh.wrapper}>
      <View style={sh.line} />
      <View style={sh.row}>
        <Text style={sh.label}>{label}</Text>
        {action && (
          <TouchableOpacity style={sh.actionRow} onPress={onAction}>
            <Text style={sh.action}>{action}</Text>
            <ArrowUpRight size={11} color={S.blue} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StatTile({ label, value, accent, muted, Icon }: {
  label: string; value: number | string; accent: string; muted: string; Icon: any;
}) {
  return (
    <View style={[st.card, { flex: 1 }]}>
      <View style={[st.iconBox, { backgroundColor: muted }]}>
        <Icon size={16} color={accent} />
      </View>
      <Text style={[st.value, { color: accent }]}>{value}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  );
}

function ActionTile({ label, sub, Icon, onPress }: {
  label: string; sub: string; Icon: any; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[at.card, { flex: 1 }]} onPress={onPress} activeOpacity={0.75}>
      <Icon size={18} color={S.black} />
      <Text style={at.label}>{label}</Text>
      <Text style={at.sub}>{sub}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: S.gray50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: S.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: S.border,
  },
  topBarBrand: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.black,
  },
  topBarSub: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: S.gray400,
    marginTop: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  // Revenue card
  revenueCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 20,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  revenueLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: S.gray400,
    marginBottom: 6,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: '800',
    color: S.black,
    letterSpacing: -0.5,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: S.blueMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  revenueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: S.blue,
  },
  revenueFooter: {
    fontSize: 11,
    fontWeight: '500',
    color: S.gray400,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: S.border,
  },
  // Stat grid
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  // Empty state
  emptyCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: S.gray400,
  },
  // Action grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Reviews
  reviewCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 14,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTime: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: S.gray400,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '400',
    color: S.gray600,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

// Stat tile styles
const st = StyleSheet.create({
  card: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 12,
    gap: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: S.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    color: S.gray400,
  },
});

// Action tile styles
const at = StyleSheet.create({
  card: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 14,
    minWidth: '47%',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: S.black,
    marginTop: 4,
  },
  sub: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: S.gray400,
  },
});

// Section header styles
const sh = StyleSheet.create({
  wrapper: {
    marginTop: 28,
    marginHorizontal: 20,
    marginBottom: -4,
  },
  line: {
    height: 1,
    backgroundColor: S.border,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.gray400,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  action: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: S.blue,
  },
});
