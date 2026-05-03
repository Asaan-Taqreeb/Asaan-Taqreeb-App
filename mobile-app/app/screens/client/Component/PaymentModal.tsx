import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { CreditCard, X, ShieldCheck, CheckCircle2, Wallet, Building2 } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

interface PaymentModalProps {
  isVisible: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: () => void;
  categoryColor: string;
}

const { height } = Dimensions.get('window');

export default function PaymentModal({ isVisible, onClose, amount, onPaymentSuccess, categoryColor }: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'easypaisa' | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = () => {
    setStep('processing');
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
        resetAndClose();
      }, 2000);
    }, 2500);
  };

  const resetAndClose = () => {
    setStep('method');
    setPaymentMethod(null);
    setCardNumber('');
    setExpiry('');
    setCvv('');
    onClose();
  };

  const renderMethod = () => (
    <View className="gap-4">
      <Text className="text-lg font-extrabold mb-2" style={{ color: Colors.textPrimary }}>Choose Payment Method</Text>
      
      <Pressable 
        onPress={() => { setPaymentMethod('card'); setStep('details'); }}
        className="flex-row items-center p-4 rounded-2xl border-2" 
        style={{ borderColor: paymentMethod === 'card' ? categoryColor : Colors.border, backgroundColor: Colors.white }}
      >
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: '#EEF2FF' }}>
          <CreditCard color="#4F46E5" size={24} />
        </View>
        <View className="flex-1">
          <Text className="font-bold" style={{ color: Colors.textPrimary }}>Credit / Debit Card</Text>
          <Text className="text-xs text-gray-500">Visa, Mastercard, PayPak</Text>
        </View>
      </Pressable>

      <Pressable 
        onPress={() => { setPaymentMethod('jazzcash'); setStep('details'); }}
        className="flex-row items-center p-4 rounded-2xl border-2" 
        style={{ borderColor: paymentMethod === 'jazzcash' ? categoryColor : Colors.border, backgroundColor: Colors.white }}
      >
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: '#FFF7ED' }}>
          <Wallet color="#EA580C" size={24} />
        </View>
        <View className="flex-1">
          <Text className="font-bold" style={{ color: Colors.textPrimary }}>JazzCash</Text>
          <Text className="text-xs text-gray-500">Instant mobile wallet payment</Text>
        </View>
      </Pressable>

      <Pressable 
        onPress={() => { setPaymentMethod('easypaisa'); setStep('details'); }}
        className="flex-row items-center p-4 rounded-2xl border-2" 
        style={{ borderColor: paymentMethod === 'easypaisa' ? categoryColor : Colors.border, backgroundColor: Colors.white }}
      >
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: '#F0FDF4' }}>
          <Building2 color="#16A34A" size={24} />
        </View>
        <View className="flex-1">
          <Text className="font-bold" style={{ color: Colors.textPrimary }}>EasyPaisa</Text>
          <Text className="text-xs text-gray-500">Secure digital payment</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderDetails = () => (
    <View className="gap-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-extrabold" style={{ color: Colors.textPrimary }}>Enter Details</Text>
        <Pressable onPress={() => setStep('method')}>
          <Text className="text-xs font-bold" style={{ color: categoryColor }}>Change Method</Text>
        </Pressable>
      </View>

      {paymentMethod === 'card' ? (
        <>
          <View>
            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Card Number</Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="0000 0000 0000 0000"
              keyboardType="number-pad"
              className="p-4 rounded-xl border"
              style={{ borderColor: Colors.border, backgroundColor: Colors.lightGray }}
            />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Expiry</Text>
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="MM/YY"
                keyboardType="number-pad"
                className="p-4 rounded-xl border"
                style={{ borderColor: Colors.border, backgroundColor: Colors.lightGray }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">CVV</Text>
              <TextInput
                value={cvv}
                onChangeText={setCv}
                placeholder="000"
                keyboardType="number-pad"
                secureTextEntry
                className="p-4 rounded-xl border"
                style={{ borderColor: Colors.border, backgroundColor: Colors.lightGray }}
              />
            </View>
          </View>
        </>
      ) : (
        <View>
          <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Mobile Number</Text>
          <TextInput
            placeholder="03XX XXXXXXX"
            keyboardType="number-pad"
            className="p-4 rounded-xl border"
            style={{ borderColor: Colors.border, backgroundColor: Colors.lightGray }}
          />
          <Text className="text-[10px] mt-2 text-gray-400">A prompt will be sent to your mobile phone to authorize the transaction.</Text>
        </View>
      )}

      <Pressable 
        onPress={handlePayment}
        className="py-4 rounded-2xl items-center mt-4"
        style={{ backgroundColor: categoryColor }}
      >
        <Text className="text-white font-extrabold">Pay PKR {amount.toLocaleString()}</Text>
      </Pressable>
    </View>
  );

  const renderProcessing = () => (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color={categoryColor} />
      <Text className="text-lg font-bold mt-6" style={{ color: Colors.textPrimary }}>Securing Transaction...</Text>
      <Text className="text-sm text-gray-500 mt-2">Please do not close the app</Text>
      <View className="flex-row items-center mt-8 gap-2 bg-gray-50 px-4 py-2 rounded-full">
        <ShieldCheck size={16} color={Colors.success} />
        <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bank-grade encryption</Text>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View className="items-center py-12">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: '#DCFCE7' }}>
        <CheckCircle2 color={Colors.success} size={48} />
      </View>
      <Text className="text-2xl font-extrabold" style={{ color: Colors.textPrimary }}>Payment Successful!</Text>
      <Text className="text-sm text-gray-500 mt-2 text-center">Your advance payment has been received. Redirecting to booking confirmation...</Text>
    </View>
  );

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, Shadows.large]}>
          {step !== 'processing' && step !== 'success' && (
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secure Checkout</Text>
                <Text className="text-xl font-extrabold" style={{ color: categoryColor }}>PKR {amount.toLocaleString()}</Text>
              </View>
              <Pressable onPress={resetAndClose} className="p-2 rounded-full bg-gray-100">
                <X size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>
          )}

          {step === 'method' && renderMethod()}
          {step === 'details' && renderDetails()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 32,
    padding: 24,
    minHeight: height * 0.45,
  },
});
