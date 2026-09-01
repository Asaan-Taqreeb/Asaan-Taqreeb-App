import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Colors, Spacing } from '@/app/_constants/theme';

interface AgreementModalProps {
  visible: boolean;
  onAccept: (paymentFrequency: 'per_booking' | 'monthly') => void;
  onReject: () => void;
  loading?: boolean;
}

export default function AgreementModal({
  visible,
  onAccept,
  onReject,
  loading = false,
}: AgreementModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [paymentFrequency, setPaymentFrequency] = useState<'per_booking' | 'monthly'>('per_booking');
  const [agreedText, setAgreedText] = useState(false);

  const handleAccept = () => {
    if (!agreedText || !agreed) {
      Alert.alert('Error', 'Please read and agree to all terms');
      return;
    }
    onAccept(paymentFrequency);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (!loading) {
          onReject();
        }
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vendor Agreement</Text>
          <Text style={styles.headerSubtitle}>Commission Terms & Conditions</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          {/* Agreement Text */}
          <View style={styles.agreementTextContainer}>
            <Text style={styles.sectionTitle}>VENDOR COMMISSION AGREEMENT</Text>

            <Text style={styles.sectionText}>
              This agreement outlines the commission structure between Asaan Taqreeb and our
              vendor partners.
            </Text>

            <Text style={styles.sectionHeading}>1. COMMISSION RATE:</Text>
            <Text style={styles.sectionText}>
              • Commission Rate: 3% of every booking amount{'\n'}• Commission is calculated on the
              total amount charged to the customer
            </Text>

            <Text style={styles.sectionHeading}>2. PAYMENT FREQUENCY OPTIONS:</Text>
            <Text style={styles.sectionText}>
              You can choose one of the following payment methods:
            </Text>
            <View style={styles.frequencyOption}>
              <Text style={styles.optionLabel}>a) Per Booking:</Text>
              <Text style={styles.optionText}>
                Pay commission immediately after each booking is completed
              </Text>
            </View>
            <View style={styles.frequencyOption}>
              <Text style={styles.optionLabel}>b) Monthly:</Text>
              <Text style={styles.optionText}>
                Accumulate commissions throughout the month and pay on the 1st of the following
                month
              </Text>
            </View>

            <Text style={styles.sectionHeading}>3. PAYMENT PROCESS:</Text>
            <Text style={styles.sectionText}>
              • You will be provided with our bank details{'\n'}• Please transfer the commission
              amount and attach a screenshot as proof{'\n'}• We will verify and confirm receipt of
              payment
            </Text>

            <Text style={styles.sectionHeading}>4. OUTSTANDING COMMISSION:</Text>
            <Text style={styles.sectionText}>
              • If commission is not paid on time, you will receive a notification reminder
              {'\n'}• Failure to pay outstanding commission may result in account suspension or
              termination{'\n'}• We maintain the right to suspend your account if payments are
              consistently overdue
            </Text>

            <Text style={styles.sectionHeading}>5. COMMISSION TRACKING:</Text>
            <Text style={styles.sectionText}>
              Your commission dashboard will show:{'\n'}• Outstanding commission (unpaid)
              {'\n'}• Commission history{'\n'}• Previous payments{'\n'}• Due dates
            </Text>

            <Text style={styles.sectionHeading}>6. TERMINATION:</Text>
            <Text style={styles.sectionText}>
              • Non-payment of commissions may lead to immediate account deactivation
              {'\n'}• We will attempt to contact you before taking any action
            </Text>

            <View style={styles.acknowledgment}>
              <Text style={styles.acknowledgmentText}>
                By accepting this agreement, you acknowledge and agree to all terms outlined
                above.
              </Text>
            </View>
          </View>

          {/* Read Checkbox */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={styles.checkbox}
              onPress={() => setAgreedText(!agreedText)}
            >
              <View
                style={[
                  styles.checkboxInner,
                  agreedText && styles.checkboxInnerChecked,
                ]}
              >
                {agreedText && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
            <Text style={styles.checkboxLabel}>
              I have read and understand the agreement above
            </Text>
          </View>

          {/* Payment Frequency Selection */}
          <View style={styles.frequencySelection}>
            <Text style={styles.frequencyTitle}>Choose Your Payment Frequency:</Text>

            <Pressable
              style={[
                styles.frequencyButton,
                paymentFrequency === 'per_booking' && styles.frequencyButtonActive,
              ]}
              onPress={() => setPaymentFrequency('per_booking')}
            >
              <View
                style={[
                  styles.radioButton,
                  paymentFrequency === 'per_booking' && styles.radioButtonActive,
                ]}
              >
                {paymentFrequency === 'per_booking' && (
                  <View style={styles.radioButtonDot} />
                )}
              </View>
              <View style={styles.frequencyContent}>
                <Text style={styles.frequencyButtonLabel}>Per Booking</Text>
                <Text style={styles.frequencyButtonDesc}>
                  Pay 3% commission after each booking
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.frequencyButton,
                paymentFrequency === 'monthly' && styles.frequencyButtonActive,
              ]}
              onPress={() => setPaymentFrequency('monthly')}
            >
              <View
                style={[
                  styles.radioButton,
                  paymentFrequency === 'monthly' && styles.radioButtonActive,
                ]}
              >
                {paymentFrequency === 'monthly' && (
                  <View style={styles.radioButtonDot} />
                )}
              </View>
              <View style={styles.frequencyContent}>
                <Text style={styles.frequencyButtonLabel}>Monthly</Text>
                <Text style={styles.frequencyButtonDesc}>
                  Pay accumulated commission on 1st of next month
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Agree Checkbox */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={styles.checkbox}
              onPress={() => setAgreed(!agreed)}
            >
              <View
                style={[
                  styles.checkboxInner,
                  agreed && styles.checkboxInnerChecked,
                ]}
              >
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
            <Text style={styles.checkboxLabel}>
              I agree to this Vendor Agreement and Commission Terms
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <Text style={styles.rejectButtonText}>Decline</Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.acceptButton,
              (!agreedText || !agreed) && styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={loading || !agreedText || !agreed}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept & Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  agreementTextContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  frequencyOption: {
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  acknowledgment: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: 4,
  },
  acknowledgmentText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInnerChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  frequencySelection: {
    marginVertical: Spacing.lg,
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  frequencyButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioButtonActive: {
    borderColor: Colors.primary,
  },
  radioButtonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  frequencyButtonDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: Colors.background,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  rejectButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
