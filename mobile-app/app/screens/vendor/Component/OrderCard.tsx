import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock, Users } from 'lucide-react-native';
import Avatar from '@/app/_components/Avatar';

// ── Swiss Design tokens ───────────────────────────────────────────
const S = {
  white:    '#FFFFFF',
  black:    '#0A0A0A',
  gray50:   '#FAFAFA',
  gray100:  '#F4F4F5',
  gray200:  '#E4E4E7',
  gray400:  '#A1A1AA',
  gray600:  '#52525B',
  blue:     '#2563EB',
  blueMuted:'#EFF6FF',
  red:      '#DC2626',
  redMuted: '#FEF2F2',
  green:    '#16A34A',
  amber:    '#D97706',
  border:   '#E4E4E7',
  radius:   4,
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  accepted: { label: 'ACCEPTED', color: S.green,  bg: '#F0FDF4', border: '#86EFAC' },
  pending:  { label: 'PENDING',  color: S.amber,  bg: '#FFFBEB', border: '#FCD34D' },
  rejected: { label: 'REJECTED', color: S.red,    bg: S.redMuted, border: '#FECACA' },
}

interface Order {
  id: string;
  customerName: string;
  customerPhoto: string;
  serviceType: string;
  packageName: string;
  totalAmount: number;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  guestCount: number;
  status: string;
}

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.card}>
      {/* ── Row 1: customer + status ─────────────────────────────── */}
      <View style={styles.row}>
        <View style={styles.customerInfo}>
          <Avatar name={order.customerName} size="md" />
          <View style={styles.customerText}>
            <Text style={styles.customerName} numberOfLines={1}>{order.customerName}</Text>
            <Text style={styles.serviceType}>{order.serviceType.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Row 2: package info block ────────────────────────────── */}
      <View style={styles.packageBlock}>
        <Text style={styles.packageName} numberOfLines={1}>{order.packageName}</Text>
        <View style={styles.metaRow}>
          <Calendar size={11} color={S.gray400} />
          <Text style={styles.metaText}>{order.eventDate} · {order.eventDay}</Text>
        </View>
        <View style={styles.metaRow}>
          <Clock size={11} color={S.gray400} />
          <Text style={styles.metaText}>{order.eventTime}</Text>
        </View>
      </View>

      {/* ── Row 3: guests + amount ───────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Users size={11} color={S.gray400} />
          <Text style={styles.metaText}>{order.guestCount} guests</Text>
        </View>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          PKR {order.totalAmount.toLocaleString()}
        </Text>
      </View>

      {/* ── Order ID ─────────────────────────────────────────────── */}
      <Text style={styles.orderId}>ORDER #{order.id.slice(-8).toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  customerText: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: S.black,
  },
  serviceType: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: S.gray400,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: S.radius,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  packageBlock: {
    backgroundColor: S.gray50,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    padding: 10,
    marginBottom: 12,
    gap: 5,
  },
  packageName: {
    fontSize: 12,
    fontWeight: '700',
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
    color: S.gray600,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: S.border,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    color: S.black,
  },
  orderId: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: S.gray400,
    marginTop: 8,
  },
});
