import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FileText, ShieldCheck, Check, X } from 'lucide-react-native';
import { Colors, Shadows, Spacing } from '@/app/_constants/theme';

interface AgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export default function AgreementModal({
  visible,
  onAccept,
  onReject,
  loading = false,
}: AgreementModalProps) {
  const [agreedText, setAgreedText] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleAccept = () => {
    if (!agreedText || !agreedTerms) {
      Alert.alert('Agreement Required', 'Please confirm both check boxes to proceed.');
      return;
    }
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        if (!loading) {
          onReject();
        }
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!loading) onReject();
          }}
          accessibilityLabel="Close modal"
        />

        <View style={[styles.modalCard, Shadows.large]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <ShieldCheck size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Vendor Partnership Agreement</Text>
              <Text style={styles.headerSubtitle}>Commission terms & partner obligations</Text>
            </View>
          </View>

          {/* Document Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={styles.termsBox}>
              <View style={styles.badgeRow}>
                <View style={styles.rateBadge}>
                  <Text style={styles.rateBadgeText}>5% Flat Commission</Text>
                </View>
                <Text style={styles.versionText}>Standard Partner V1.2</Text>
              </View>

              <Text style={styles.sectionHeading}>1. Commission Structure</Text>
              <Text style={styles.sectionText}>
                Asaan Taqreeb charges a standard 5% platform fee on all confirmed customer bookings. The fee is calculated from the total finalized invoice amount.
              </Text>

              <Text style={styles.sectionHeading}>2. Payment & Settlement</Text>
              <Text style={styles.sectionText}>
                Commission is payable within 7 calendar days of event completion or booking payout. Proof of payment (bank transfer screenshot or transaction ID) must be uploaded via your vendor dashboard.
              </Text>

              <Text style={styles.sectionHeading}>3. Account Standing</Text>
              <Text style={styles.sectionText}>
                Maintaining an active and verified listing requires timely commission clearing. Repeated overdue balances may result in listing de-ranking or temporary booking holds.
              </Text>

              <Text style={styles.sectionHeading}>4. Quality & Commitment</Text>
              <Text style={styles.sectionText}>
                Vendors commit to honoring confirmed booking slots, transparent customer pricing, and maintaining professional quality standards.
              </Text>
            </View>

            {/* Checkbox 1 */}
            <Pressable
              style={[styles.checkboxRow, agreedText && styles.checkboxRowActive]}
              onPress={() => setAgreedText(!agreedText)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedText }}
            >
              <View style={[styles.checkbox, agreedText && styles.checkboxChecked]}>
                {agreedText && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and thoroughly reviewed the partnership terms above.
              </Text>
            </Pressable>

            {/* Checkbox 2 */}
            <Pressable
              style={[styles.checkboxRow, agreedTerms && styles.checkboxRowActive]}
              onPress={() => setAgreedTerms(!agreedTerms)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedTerms }}
            >
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>
                I accept the 5% platform commission and partner conditions.
              </Text>
            </Pressable>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.rejectButton, loading && styles.buttonDisabled]}
              onPress={onReject}
              disabled={loading}
            >
              <Text style={styles.rejectButtonText}>Decline</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.acceptButton,
                (loading || !agreedText || !agreedTerms) && styles.buttonDisabled,
              ]}
              onPress={handleAccept}
              disabled={loading || !agreedText || !agreedTerms}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 22,
  },
  scrollContainer: {
    paddingVertical: 18,
  },
  termsBox: {
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rateBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  checkboxRowActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.lightGray,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
