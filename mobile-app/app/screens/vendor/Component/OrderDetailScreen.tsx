import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Plus,
} from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { updateBookingStatus, recordRemainingPayment } from '@/app/_utils/bookingsApi';
import { useUser } from '@/app/_context/UserContext';
import { useNotifications } from '@/app/_context/NotificationContext';
import { showAlert } from '@/app/_utils/alert';

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { refresh: refreshNotifications } = useNotifications();
  const { order: orderParam } = useLocalSearchParams();

  const buildChatId = (firstUserId: string | number, secondUserId: string | number) => {
    const first = String(firstUserId)
    const second = String(secondUserId)
    return first.localeCompare(second) <= 0 ? `chat_${first}_${second}` : `chat_${second}_${first}`
  }

  const parsedOrder = typeof orderParam === 'string' ? (() => {
    try {
      return JSON.parse(orderParam)
    } catch {
      return null
    }
  })() : null
  const order = parsedOrder;
  const [orderStatus, setOrderStatus] = useState(order?.status || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showApproveInput, setShowApproveInput] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [orderPaidAmount, setOrderPaidAmount] = useState(order?.paidAmount || 0);

  if (!order) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#F9FAFB' }} className="items-center justify-center">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );
  }

  const handleApprove = () => {
    if (!showApproveInput) {
      setShowApproveInput(true);
      setShowRejectInput(false);
      setPaidAmountInput(String(order.advancePayment || ''));
      return;
    }

    const enteredAmount = Number(paidAmountInput);
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a token payment amount greater than 0.');
      return;
    }

    if (enteredAmount > order.totalAmount) {
      showAlert('Invalid Amount', 'Advance payment cannot exceed total amount.');
      return;
    }

    showAlert(
      'Approve Order',
      `Accept this order and record payment of PKR ${enteredAmount.toLocaleString()} received so far?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setIsUpdating(true)
              await updateBookingStatus(order.id, 'accepted', undefined, enteredAmount)
              setOrderStatus('accepted')
              setOrderPaidAmount(enteredAmount)
              setShowApproveInput(false)
              showAlert('Success', 'Order has been approved and payment recorded!')
            } catch (error: any) {
              showAlert('Error', error?.message || 'Failed to approve order')
            } finally {
              setIsUpdating(false)
            }
          },
        },
      ]
    );
  };

  const handleReceiveRemainingPayment = () => {
    showAlert(
      'Mark Remaining as Paid',
      `Are you sure you have received the remaining balance of PKR ${(order.totalAmount - orderPaidAmount).toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Received',
          style: 'default',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await recordRemainingPayment(order.id);
              setOrderStatus('confirmed');
              setOrderPaidAmount(order.totalAmount);
              showAlert('Success', 'Remaining payment recorded successfully!');
            } catch (error: any) {
              showAlert('Error', error?.message || 'Failed to update payment status');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    showAlert(
      'Reject Order',
      'Are you sure you want to reject this order with the provided reason?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true)
              await updateBookingStatus(order.id, 'rejected', rejectionReason)
              setOrderStatus('rejected')
              setShowRejectInput(false)
              showAlert('Order Rejected', 'The customer will be notified.')
              refreshNotifications()
            } catch (error: any) {
              showAlert('Error', error?.message || 'Failed to reject order')
            } finally {
              setIsUpdating(false)
            }
          },
        },
      ]
    );
  };

  const handleChat = () => {
    const clientId = order.clientId;
    if (!clientId) {
      showAlert('Error', 'Cannot open chat: Client ID is missing.');
      return;
    }

    const chatId = buildChatId(clientId, user?.id || '');

    router.push({
      pathname: '/screens/vendor/Component/ClientChatScreen',
      params: { 
        clientId, 
        clientName: order.customerName,
        chatId
      }
    });
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case 'accepted':
        return '#10B981';
      case 'confirmed':
        return '#059669';
      case 'rejected':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case 'accepted':
        return 'Approved (Deposit Paid)';
      case 'confirmed':
        return 'Confirmed (Fully Paid)';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled by Client';
      case 'pending':
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.vendor + '15' }}
          >
            <ArrowLeft size={22} color={Colors.vendor} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>Order Details</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: orderStatus === 'pending' ? 260 : orderStatus === 'accepted' ? 190 : 120 
        }}
      >
        {/* Status Banner */}
        <View
          className="mx-5 mt-5 rounded-2xl p-4"
          style={{ backgroundColor: getStatusColor() + '20' }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: getStatusColor() + '40' }}
              >
                {orderStatus === 'accepted' ? (
                  <CheckCircle size={24} color={getStatusColor()} />
                ) : orderStatus === 'rejected' ? (
                  <XCircle size={24} color={getStatusColor()} />
                ) : (
                  <Clock size={24} color={getStatusColor()} />
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold" style={{ color: getStatusColor() }}>
                  {getStatusText()}
                </Text>
                <Text className="text-sm text-gray-600 mt-0.5">
                  Order #{order.id}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            CUSTOMER
          </Text>
          <View className="flex-row items-center">
            <Image
              source={{ uri: order.customerPhoto }}
              className="w-14 h-14 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
                {order.customerName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Ordered on {(() => {
                  const d = order.orderDate ? new Date(order.orderDate) : new Date(order.eventDate || Date.now());
                  return isNaN(d.getTime()) 
                    ? 'Recent' 
                    : d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Details */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            EVENT DETAILS
          </Text>
          
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <Calendar size={20} color={Colors.vendor} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Date</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.eventDate} • {order.eventDay}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#F59E0B20' }}
            >
              <Clock size={20} color="#F59E0B" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Time</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.eventTime}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Users size={20} color="#10B981" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Guest Count</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.guestCount} guests
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            PACKAGE SELECTED
          </Text>
          
          <View className="flex-row items-start mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <Package size={20} color={Colors.vendor} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.packageName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {order.serviceType}
              </Text>
              <Text className="text-sm font-medium mt-2 text-gray-500">
                Booking total
              </Text>
              <Text className="text-lg font-bold mt-1" style={{ color: Colors.vendor }}>
                PKR {order.totalAmount ? order.totalAmount.toLocaleString() : '0'}
              </Text>
              <Text className="text-xs text-gray-500 mt-2 leading-4">
                Token or advance payment is handled in chat. Confirm payment from the screenshot before accepting.
              </Text>
            </View>
          </View>

          {/* Optional Items */}
          {order.optionalItems && order.optionalItems.length > 0 && (
            <>
              <View className="h-px bg-gray-200 my-3" />
              <Text className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">
                OPTIONAL ADD-ONS
              </Text>
              {order.optionalItems.map((item: { name: string; price: number }, index: number) => (
                <View key={index} className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <Plus size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-700 ml-2">{item.name}</Text>
                  </View>
                  <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                    PKR {item.price ? item.price.toLocaleString() : '0'}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Special Requests */}
        {order.specialRequests && (
          <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
            <Text className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">
              SPECIAL REQUESTS
            </Text>
            <Text className="text-sm text-gray-700 leading-5">
              {order.specialRequests}
            </Text>
          </View>
        )}

        {/* Total Amount */}
        <View
          className="mx-5 mt-4 rounded-2xl p-4"
          style={{ backgroundColor: Colors.vendor }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <DollarSign size={24} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">
                Total Amount
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              PKR {order.totalAmount ? order.totalAmount.toLocaleString() : '0'}
            </Text>
          </View>
          <Text className="text-white text-xs mt-2 opacity-90">
            This is the service value. The token is confirmed separately in chat.
          </Text>
        </View>

        {/* Payment Progress */}
        {(orderStatus === 'accepted' || orderStatus === 'confirmed') && (
          <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
            <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
              PAYMENT STATUS
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Total Price</Text>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                PKR {order.totalAmount?.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Paid So Far (Token)</Text>
              <Text className="text-sm font-bold text-emerald-600">
                PKR {orderPaidAmount.toLocaleString()}
              </Text>
            </View>
            <View className="h-px bg-gray-100 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                Remaining Balance
              </Text>
              <Text className="text-sm font-bold" style={{ color: orderStatus === 'confirmed' ? Colors.success : Colors.warning }}>
                PKR {(order.totalAmount - orderPaidAmount).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      {orderStatus === 'pending' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 border-t border-gray-200"
          style={[Shadows.medium, { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          {showApproveInput && (
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
                Token / Advance Amount Paid (PKR)
              </Text>
              <View className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <TextInput
                  placeholder="Enter token amount received..."
                  value={paidAmountInput}
                  onChangeText={setPaidAmountInput}
                  keyboardType="numeric"
                  style={{ height: 40 }}
                />
              </View>
              <TouchableOpacity 
                onPress={() => setShowApproveInput(false)}
                className="mt-2 self-end"
              >
                <Text className="text-xs font-bold" style={{ color: Colors.textTertiary }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {showRejectInput && (
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
                Reason for Rejection
              </Text>
              <View className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <TextInput
                  placeholder="Enter reason here..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: 'top', height: 60 }}
                />
              </View>
              <TouchableOpacity 
                onPress={() => setShowRejectInput(false)}
                className="mt-2 self-end"
              >
                <Text className="text-xs font-bold" style={{ color: Colors.textTertiary }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={handleReject}
              disabled={isUpdating}
              className="flex-1 bg-red-500 rounded-2xl py-4 items-center justify-center"
              activeOpacity={isUpdating ? 1 : 0.8}
              style={[Shadows.small, isUpdating && { opacity: 0.5 }]}
            >
              <View className="flex-row items-center">
                <XCircle size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  {isUpdating ? 'Updating...' : 'Reject'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApprove}
              disabled={isUpdating}
              className="flex-1 bg-green-500 rounded-2xl py-4 items-center justify-center"
              activeOpacity={isUpdating ? 1 : 0.8}
              style={[Shadows.small, isUpdating && { opacity: 0.5 }]}
            >
              <View className="flex-row items-center">
                <CheckCircle size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  {isUpdating ? 'Updating...' : 'Approve'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleChat}
            className="rounded-2xl py-4 items-center justify-center border-2"
            activeOpacity={0.8}
            style={{ borderColor: Colors.vendor }}
          >
            <View className="flex-row items-center">
              <MessageCircle size={20} color={Colors.vendor} />
              <Text className="text-base font-semibold ml-2" style={{ color: Colors.vendor }}>
                Chat with Customer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* If already accepted/rejected, show chat option only */}
      {orderStatus !== 'pending' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 border-t border-gray-200"
          style={[Shadows.medium, { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          {orderStatus === 'accepted' && (
            <TouchableOpacity
              onPress={handleReceiveRemainingPayment}
              disabled={isUpdating}
              className="rounded-2xl py-4 items-center justify-center bg-emerald-500 mb-3"
              activeOpacity={0.8}
              style={[Shadows.small, isUpdating && { opacity: 0.5 }]}
            >
              <View className="flex-row items-center">
                <CheckCircle size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  {isUpdating ? 'Updating...' : 'Mark Balance as Received'}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleChat}
            className="rounded-2xl py-4 items-center justify-center border-2"
            activeOpacity={0.8}
            style={{ 
              borderColor: Colors.vendor, 
              backgroundColor: orderStatus === 'accepted' ? '#FFFFFF' : Colors.vendor 
            }}
          >
            <View className="flex-row items-center">
              <MessageCircle size={20} color={orderStatus === 'accepted' ? Colors.vendor : '#FFFFFF'} />
              <Text className="text-base font-semibold ml-2" style={{ color: orderStatus === 'accepted' ? Colors.vendor : '#FFFFFF' }}>
                Chat with Customer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
