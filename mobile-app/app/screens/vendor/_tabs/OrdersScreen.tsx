import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw } from 'lucide-react-native';
import OrderCard from '../Component/OrderCard';
import { getVendorBookings, VendorOrderItem } from '@/app/_utils/bookingsApi';

// ─── Swiss Design Token System ──────────────────────────────────────
const S = {
  white:     '#FFFFFF',
  black:     '#0A0A0A',
  gray50:    '#FAFAFA',
  gray100:   '#F4F4F5',
  gray200:   '#E4E4E7',
  gray400:   '#A1A1AA',
  gray600:   '#52525B',
  gray900:   '#18181B',
  blue:      '#2563EB',
  blueMuted: '#EFF6FF',
  red:       '#DC2626',
  redMuted:  '#FEF2F2',
  border:    '#E4E4E7',
  radius:    4,
};

type FilterKey = 'all' | 'pending' | 'accepted' | 'rejected';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'ALL'      },
  { key: 'pending',  label: 'PENDING'  },
  { key: 'accepted', label: 'ACCEPTED' },
  { key: 'rejected', label: 'REJECTED' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [orders, setOrders]         = useState<VendorOrderItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const response = await getVendorBookings();
      setOrders(response);
    } catch (apiError: any) {
      setError(apiError?.message || 'Failed to load orders');
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = selectedFilter === 'all'
    ? orders
    : orders.filter(o => o.status === selectedFilter);

  const countFor = (key: FilterKey) =>
    key === 'all' ? orders.length : orders.filter(o => o.status === key).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>MANAGE ORDERS</Text>
          <Text style={styles.topBarSub}>TRACK & UPDATE BOOKINGS</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => loadOrders(true)}
          disabled={isRefreshing}
        >
          <RotateCw size={16} color={S.black} />
        </TouchableOpacity>
      </View>

      {/* ── FILTER STRIP ─────────────────────────────────────────── */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(f => {
            const active = selectedFilter === f.key;
            const count  = countFor(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── ORDERS LIST ──────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={S.blue}
          />
        }
      >
        {/* Error */}
        {error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders()}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Fetching orders…</Text>
          </View>
        )}

        {/* Orders */}
        {!isLoading && filteredOrders.length > 0 && (
          filteredOrders.map(order => (
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

        {/* Empty state */}
        {!isLoading && filteredOrders.length === 0 && !error && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyLabel}>NO ORDERS</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? "You don't have any bookings yet"
                : `No ${selectedFilter} orders found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: S.gray50,
  },
  // Top Bar
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
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: S.border,
    backgroundColor: S.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filter Strip
  filterStrip: {
    backgroundColor: S.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: S.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    marginRight: 8,
    backgroundColor: S.white,
  },
  filterChipActive: {
    backgroundColor: S.black,
    borderColor: S.black,
  },
  filterChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: S.gray400,
  },
  filterChipTextActive: {
    color: S.white,
  },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: S.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: S.blue,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: S.gray600,
  },
  filterBadgeTextActive: {
    color: S.white,
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  // Empty / Error
  emptyCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 6,
  },
  emptyLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.gray400,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: S.gray400,
  },
  errorCard: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: S.radius,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: S.red,
    flex: 1,
    marginRight: 12,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: S.radius,
    backgroundColor: S.black,
  },
  retryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: S.white,
  },
});
