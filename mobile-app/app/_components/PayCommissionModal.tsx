import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, CheckCircle, Copy, CreditCard, ShieldCheck, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '../_constants/theme';
import { payCommission } from '../_utils/commissionApi';
import { showAlert } from '../_utils/alert';

interface PayCommissionModalProps {
  visible: boolean;
  onClose: () => void;
  outstandingAmount: number;
  onSuccess?: () => void;
}

export const PayCommissionModal: React.FC<PayCommissionModalProps> = ({
  visible,
  onClose,
  outstandingAmount,
  onSuccess,
}) => {
  const [amount, setAmount] = useState(String(outstandingAmount || ''));
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  React.useEffect(() => {
    if (outstandingAmount > 0) {
      setAmount(String(outstandingAmount));
    }
  }, [outstandingAmount]);

  const copyToClipboard = (text: string, label: string) => {
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePay = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount to pay.');
      return;
    }

    if (!transactionId.trim()) {
      showAlert('Transaction ID Required', 'Please enter your bank transfer / JazzCash / EasyPaisa transaction ID or reference number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await payCommission({
        amount: numAmount,
        transactionId: transactionId.trim(),
        notes: notes.trim(),
      });

      showAlert('Payment Submitted', 'Your commission payment of PKR ' + numAmount.toLocaleString() + ' has been recorded and your balance is updated.', [
        {
          text: 'OK',
          onPress: () => {
            onClose();
            if (onSuccess) onSuccess();
          },
        },
      ]);
    } catch (error: any) {
      showAlert('Payment Failed', error?.message || 'Unable to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-[32px] max-h-[88%] p-6" style={Shadows.large}>
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center border border-amber-100">
                <CreditCard size={20} color={Colors.vendor} />
              </View>
              <View>
                <Text className="text-lg font-black text-gray-900">Pay Commission</Text>
                <Text className="text-xs text-gray-500">5% Platform Facilitation Fee</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-4 space-y-4">
            {/* Amount Summary */}
            <View className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <Text className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Outstanding</Text>
              <Text className="text-2xl font-black text-amber-950 mt-0.5">
                PKR {Number(outstandingAmount || 0).toLocaleString()}
              </Text>
            </View>

            {/* Bank Account Transfer Details */}
            <View className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={16} color="#059669" />
                <Text className="text-xs font-bold text-gray-800">Official Company Account Details</Text>
              </View>

              <View className="space-y-2 pt-1">
                <View className="flex-row justify-between items-center py-1 border-b border-gray-200">
                  <Text className="text-xs text-gray-500">Bank Name</Text>
                  <Text className="text-xs font-bold text-gray-800">Meezan Bank Ltd</Text>
                </View>

                <View className="flex-row justify-between items-center py-1 border-b border-gray-200">
                  <Text className="text-xs text-gray-500">Account Title</Text>
                  <Text className="text-xs font-bold text-gray-800">Asaan Taqreeb (Pvt) Ltd</Text>
                </View>

                <View className="flex-row justify-between items-center py-1 border-b border-gray-200">
                  <Text className="text-xs text-gray-500">IBAN / Account #</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard('PK65MEZN0001020304050607', 'IBAN')}
                    className="flex-row items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200"
                  >
                    <Text className="text-xs font-mono font-bold text-amber-950">PK65MEZN0001020304050607</Text>
                    <Copy size={12} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-xs text-gray-500">JazzCash / EasyPaisa</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard('03001234567', 'Mobile')}
                    className="flex-row items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200"
                  >
                    <Text className="text-xs font-mono font-bold text-amber-950">0300-1234567</Text>
                    <Copy size={12} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {copiedField && (
                <Text className="text-[11px] font-bold text-emerald-600 text-center">
                  ✓ {copiedField} copied to clipboard!
                </Text>
              )}
            </View>

            {/* Payment Inputs */}
            <View className="space-y-3">
              <View>
                <Text className="text-xs font-bold text-gray-700 mb-1">Amount to Pay (PKR)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Transaction Reference / TRX ID <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholder="e.g. TRX-982341 or Bank Ref #"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-900"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-gray-700 mb-1">Notes / Description (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Paid via Meezan mobile app"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handlePay}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl items-center justify-center mt-4"
              style={{ backgroundColor: Colors.vendor }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text className="text-white text-base font-black">Submit & Confirm Payment</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
