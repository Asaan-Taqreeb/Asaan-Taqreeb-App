import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Save, Clock } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { useUser } from '@/app/_context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeSlot {
  id: string;
  label: string;
  from: string; // e.g. "09:00 AM"
  to: string;   // e.g. "05:00 PM"
}

const STORAGE_KEY_PREFIX = 'vendor_slots_';

export default function TimeSlotsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSlots();
    }
  }, [user?.id]);

  const loadSlots = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + user?.id);
      if (saved) {
        setSlots(JSON.parse(saved));
      } else {
        // Default slots for banquets if none exist
        setSlots([
          { id: '1', label: 'Morning', from: '10:00 AM', to: '01:00 PM' },
          { id: '2', label: 'Afternoon', from: '03:00 PM', to: '07:00 PM' },
          { id: '3', label: 'Evening', from: '09:00 PM', to: '12:00 AM' },
        ]);
      }
    } catch (error) {
      console.log('Failed to load slots:', error);
    }
  };

  const saveSlots = async () => {
    if (!user?.id) return;
    
    // Simple validation
    for (const slot of slots) {
      if (!slot.label.trim() || !slot.from.trim() || !slot.to.trim()) {
        Alert.alert('Error', 'Please fill in all fields for all slots.');
        return;
      }
    }

    try {
      setIsSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY_PREFIX + user.id, JSON.stringify(slots));
      Alert.alert('Success', 'Time slots updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save time slots.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      label: '',
      from: '09:00 AM',
      to: '05:00 PM',
    };
    setSlots([...slots, newSlot]);
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const updateSlot = (id: string, updates: Partial<TimeSlot>) => {
    setSlots(slots.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-50"
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
          Operating Times
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1 px-5 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mb-6">
            <Text className="text-lg font-bold mb-1" style={{ color: Colors.textPrimary }}>
              Manage Your Time Slots
            </Text>
            <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Define the time slots available for booking. Clients will see these options when booking your services.
            </Text>
          </View>

          {slots.map((slot, index) => (
            <View 
              key={slot.id} 
              className="bg-white rounded-3xl p-5 mb-5" 
              style={Shadows.medium}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-sm font-bold uppercase tracking-widest" style={{ color: Colors.vendor }}>
                  Slot #{index + 1}
                </Text>
                <TouchableOpacity onPress={() => removeSlot(slot.id)} className="p-2">
                  <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 mb-2">SLOT NAME (E.G. MORNING, DINNER)</Text>
                <TextInput
                  value={slot.label}
                  onChangeText={(text) => updateSlot(slot.id, { label: text })}
                  placeholder="e.g. Afternoon Session"
                  className="bg-gray-50 rounded-xl px-4 py-3 text-base"
                  style={{ color: Colors.textPrimary }}
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-400 mb-2">FROM</Text>
                  <TextInput
                    value={slot.from}
                    onChangeText={(text) => updateSlot(slot.id, { from: text })}
                    placeholder="09:00 AM"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-base"
                    style={{ color: Colors.textPrimary }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-400 mb-2">TO</Text>
                  <TextInput
                    value={slot.to}
                    onChangeText={(text) => updateSlot(slot.id, { to: text })}
                    placeholder="05:00 PM"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-base"
                    style={{ color: Colors.textPrimary }}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={addSlot}
            className="flex-row items-center justify-center py-4 rounded-2xl border-2 border-dashed mb-10"
            style={{ borderColor: Colors.vendor }}
          >
            <Plus size={20} color={Colors.vendor} />
            <Text className="ml-2 font-bold" style={{ color: Colors.vendor }}>Add New Slot</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={saveSlots}
          disabled={isSaving}
          className="rounded-2xl py-4 flex-row items-center justify-center"
          style={{ backgroundColor: Colors.vendor }}
        >
          <Save size={20} color="white" />
          <Text className="ml-2 text-white font-bold text-base">
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
