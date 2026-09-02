import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCircle, Clock, CreditCard } from 'lucide-react-native';
import { Colors, Spacing, Shadows } from '../_constants/theme';
import { useCommission } from '../_hooks/useCommission';
import { PayCommissionModal } from './PayCommissionModal';

export const CommissionDashboard = () => {
  const {
    summary,
    monthlySummary,
    overdueCommissions,
    loading,
    error,
    refreshCommissionData,
  } = useCommission();

  const [isPayModalVisible, setIsPayModalVisible] = useState(false);

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && !summary) {
    return (
      <View className='flex-1 justify-center items-center bg-white'>
        <ActivityIndicator size='large' color={Colors.primary} />
        <Text className='mt-4 text-gray-600'>Loading commission data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className='flex-1 justify-center items-center bg-white p-4'>
        <AlertCircle size={48} color={Colors.error} />
        <Text className='mt-4 text-center text-gray-700 font-semibold'>{error}</Text>
        <Text 
          className='mt-4 px-4 py-2 rounded-lg font-semibold'
          style={{ backgroundColor: Colors.primary, color: 'white' }}
          onPress={refreshCommissionData}
        >
          Retry
        </Text>
      </View>
    );
  }

  const maxCharged = Math.max(...monthlySummary.slice(-6).map(m => Math.max(m.charged, m.paid, 1)), 1);

  return (
    <>
      <ScrollView
        className='flex-1 bg-white'
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshCommissionData} />
        }
      >
        <View className='p-4'>
          {/* Outstanding Commission Card */}
          <View
            className='rounded-2xl p-5 mb-4 border'
            style={{
              backgroundColor: Colors.lightGray,
              borderColor: Colors.border,
              ...Shadows.medium,
            }}
          >
            <View className='flex-row justify-between items-start mb-3'>
              <Text className='text-gray-600 font-medium'>Outstanding Commission</Text>
              {overdueCommissions.length > 0 && (
                <View
                  className='px-2 py-1 rounded-full'
                  style={{ backgroundColor: `${Colors.error}20` }}
                >
                  <Text className='text-xs font-semibold' style={{ color: Colors.error }}>
                    {overdueCommissions.length} Overdue
                  </Text>
                </View>
              )}
            </View>
            <Text
              className='text-3xl font-extrabold mb-2'
              style={{ color: Colors.primary }}
            >
              {formatCurrency(summary?.totalOutstanding || 0)}
            </Text>
            
            <View className='flex-row justify-between items-center mt-2 pt-3 border-t border-gray-200'>
              <Text className='text-sm text-gray-600'>
                {summary?.pendingCount || 0} pending charges
              </Text>
              <TouchableOpacity
                onPress={() => setIsPayModalVisible(true)}
                className='px-4 py-2 rounded-xl flex-row items-center gap-1.5'
                style={{ backgroundColor: Colors.vendor }}
              >
                <CreditCard size={14} color="#FFFFFF" />
                <Text className='text-white text-xs font-bold'>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overdue Alert */}
          {overdueCommissions.length > 0 && (
            <View
              className='rounded-xl p-4 mb-4 flex-row border'
              style={{
                backgroundColor: `${Colors.error}10`,
                borderColor: Colors.error,
              }}
            >
              <AlertCircle size={24} color={Colors.error} style={{ marginRight: 12 }} />
              <View className='flex-1'>
                <Text className='font-semibold text-sm mb-1' style={{ color: Colors.error }}>
                  Overdue Commission
                </Text>
                <Text className='text-xs text-gray-700'>
                  You have {overdueCommissions.length} overdue payment{overdueCommissions.length !== 1 ? 's' : ''} of {formatCurrency(summary?.overdueAmount || 0)}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsPayModalVisible(true)}
                  className='mt-2 self-start px-3 py-1.5 rounded-lg bg-red-600'
                >
                  <Text className='text-white text-xs font-bold'>Settle Overdue Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Summary Stats */}
        <View className='flex-row gap-2 mb-4'>
          <View
            className='flex-1 rounded-xl p-3 border'
            style={{
              backgroundColor: `${Colors.success}10`,
              borderColor: Colors.success,
            }}
          >
            <View className='flex-row items-center mb-1'>
              <CheckCircle size={16} color={Colors.success} style={{ marginRight: 4 }} />
              <Text className='text-xs text-gray-600'>Paid</Text>
            </View>
            <Text className='font-bold text-sm' style={{ color: Colors.success }}>
              {formatCurrency(summary?.totalPaid || 0)}
            </Text>
            <Text className='text-xs text-gray-500 mt-1'>
              {summary?.paidCount || 0} transactions
            </Text>
          </View>

          <View
            className='flex-1 rounded-xl p-3 border'
            style={{
              backgroundColor: `${Colors.warning}10`,
              borderColor: Colors.warning,
            }}
          >
            <View className='flex-row items-center mb-1'>
              <Clock size={16} color={Colors.warning} style={{ marginRight: 4 }} />
              <Text className='text-xs text-gray-600'>Pending</Text>
            </View>
            <Text className='font-bold text-sm' style={{ color: Colors.warning }}>
              {summary?.pendingCount || 0}
            </Text>
            <Text className='text-xs text-gray-500 mt-1'>
              {summary?.pendingCount === 1 ? '1 charge' : `${summary?.pendingCount || 0} charges`}
            </Text>
          </View>
        </View>

        {/* Last Payment Date */}
        <View
          className='rounded-xl p-4 mb-4 border'
          style={{
            backgroundColor: Colors.lightGray,
            borderColor: Colors.border,
          }}
        >
          <Text className='text-xs text-gray-600 mb-1'>Last Payment</Text>
          <Text className='text-sm font-semibold text-gray-800'>
            {formatDate(summary?.lastPaymentDate)}
          </Text>
        </View>

        {/* Monthly Commission Chart / Trend */}
        {monthlySummary.length > 0 && (
          <View className='mb-4'>
            <Text className='text-base font-extrabold mb-3' style={{ color: Colors.textPrimary }}>
              Commission Trend (Last 6 Months)
            </Text>
            <View
              className='rounded-xl p-4 border'
              style={{
                backgroundColor: Colors.lightGray,
                borderColor: Colors.border,
              }}
            >
              {monthlySummary.slice(-6).map((month, idx) => {
                const chargedPct = Math.min(100, Math.round((month.charged / maxCharged) * 100));
                const paidPct = Math.min(100, Math.round((month.paid / maxCharged) * 100));

                return (
                  <View key={idx} className='mb-3'>
                    <View className='flex-row justify-between mb-1'>
                      <Text className='text-xs font-semibold text-gray-700'>{month.month}</Text>
                      <Text className='text-xs text-gray-600'>
                        Charged: {formatCurrency(month.charged)} | Paid: {formatCurrency(month.paid)}
                      </Text>
                    </View>
                    <View className='h-2 bg-gray-200 rounded-full overflow-hidden flex-row'>
                      <View style={{ width: `${paidPct}%`, backgroundColor: Colors.success }} />
                      <View style={{ width: `${Math.max(0, chargedPct - paidPct)}%`, backgroundColor: Colors.warning }} />
                    </View>
                  </View>
                );
              })}
              <View className='flex-row justify-center gap-4 mt-2'>
                <View className='flex-row items-center gap-1'>
                  <View className='w-3 h-3 rounded-full' style={{ backgroundColor: Colors.success }} />
                  <Text className='text-[10px] text-gray-600 font-medium'>Paid</Text>
                </View>
                <View className='flex-row items-center gap-1'>
                  <View className='w-3 h-3 rounded-full' style={{ backgroundColor: Colors.warning }} />
                  <Text className='text-[10px] text-gray-600 font-medium'>Pending / Charged</Text>
                </View>
              </View>
            </View>

            {/* Monthly Breakdown */}
            <View className='mt-4'>
              <Text className='text-sm font-semibold mb-2' style={{ color: Colors.textPrimary }}>
                Monthly Breakdown
              </Text>
              {monthlySummary.slice(-3).reverse().map((month, idx) => (
                <View key={idx} className='flex-row justify-between p-2 mb-2 rounded-lg' style={{ backgroundColor: Colors.lightGray }}>
                  <Text className='text-xs font-medium text-gray-700'>{month.month}</Text>
                  <View className='flex-row gap-3'>
                    <View className='items-end'>
                      <Text className='text-xs text-gray-600'>Charged</Text>
                      <Text className='text-xs font-semibold text-gray-800'>
                        {formatCurrency(month.charged)}
                      </Text>
                    </View>
                    <View className='items-end'>
                      <Text className='text-xs text-gray-600'>Paid</Text>
                      <Text className='text-xs font-semibold' style={{ color: Colors.success }}>
                        {formatCurrency(month.paid)}
                      </Text>
                    </View>
                    <View className='items-end'>
                      <Text className='text-xs text-gray-600'>Pending</Text>
                      <Text className='text-xs font-semibold' style={{ color: Colors.warning }}>
                        {formatCurrency(month.pending)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Box */}
        <View
          className='rounded-2xl p-5 mb-4 border'
          style={{
            backgroundColor: Colors.lightGray,
            borderColor: Colors.border,
          }}
        >
          <Text className='text-base font-extrabold mb-2' style={{ color: Colors.primary }}>
            💡 Commission & Payout Policy
          </Text>
          <Text className='text-sm font-medium leading-relaxed' style={{ color: Colors.textSecondary }}>
            Asaan Taqreeb applies a standard 5% platform facilitation fee on confirmed event bookings. You receive 95% net payout. Settle your pending charges through direct bank transfer, JazzCash, or EasyPaisa.
          </Text>
        </View>
      </View>
    </ScrollView>

    <PayCommissionModal
      visible={isPayModalVisible}
      onClose={() => setIsPayModalVisible(false)}
      outstandingAmount={summary?.totalOutstanding || 0}
      onSuccess={refreshCommissionData}
    />
  </>
  );
};
