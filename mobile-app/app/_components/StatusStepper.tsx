import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Clock, PackageCheck, Truck } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

interface StatusStepperProps {
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';
}

export default function StatusStepper({ status }: StatusStepperProps) {
  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'accepted', label: 'Accepted', icon: PackageCheck },
    { key: 'completed', label: 'Event Ready', icon: Check },
  ];

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <View className="bg-red-50 p-4 rounded-2xl flex-row items-center border border-red-100 mb-6">
        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
          <Text className="text-red-600 font-bold text-lg">!</Text>
        </View>
        <View>
          <Text className="text-red-800 font-bold capitalize">Booking {status}</Text>
          <Text className="text-red-600/70 text-xs font-medium">This booking is no longer active.</Text>
        </View>
      </View>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.key === status);
  const activeIndex = currentStepIndex === -1 ? (status === 'completed' ? 2 : 0) : currentStepIndex;

  return (
    <View className="mb-8 px-2">
      <View className="flex-row items-center justify-between px-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeIndex || status === 'completed';
          const isActive = index === activeIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Connector Line */}
              {index > 0 && (
                <View 
                  className="flex-1 h-[2px] mx-2" 
                  style={{ backgroundColor: index <= activeIndex ? Colors.primary : Colors.border }} 
                />
              )}
              
              <View className="items-center">
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center border-2"
                  style={{ 
                    backgroundColor: isCompleted ? Colors.primary : isActive ? Colors.white : Colors.white,
                    borderColor: (isCompleted || isActive) ? Colors.primary : Colors.border
                  }}
                >
                  <Icon 
                    size={20} 
                    color={isCompleted ? Colors.white : isActive ? Colors.primary : Colors.textTertiary} 
                  />
                </View>
                <Text 
                  className="text-[10px] font-bold mt-2 text-center absolute -bottom-5 w-20"
                  style={{ color: (isCompleted || isActive) ? Colors.textPrimary : Colors.textTertiary }}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <View className="h-4" /> 
    </View>
  );
}
