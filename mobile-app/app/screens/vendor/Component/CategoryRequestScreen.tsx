import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetchJson } from '@/app/_utils/apiClient';
import { Colors, Shadows } from '@/app/_constants/theme';

export default function CategoryRequestScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiFetchJson<{ success: boolean }>('/api/v1/app/category-requests', {
        method: 'POST', auth: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!response.success) throw new Error('Request could not be submitted');
      router.back();
    } finally { setSubmitting(false); }
  };

  return <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityLabel="Go back"><ArrowLeft size={22} color={Colors.textPrimary} /></Pressable>
      <View><Text style={styles.title}>Request a category</Text><Text style={styles.subtitle}>Tell us what service you provide.</Text></View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.card, Shadows.medium]}>
        <Text style={styles.label}>Service category name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Event décor" placeholderTextColor={Colors.textTertiary} style={styles.input} maxLength={80} />
        <Text style={styles.label}>What will you offer?</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe your services, packages, and what clients can book." placeholderTextColor={Colors.textTertiary} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" maxLength={1000} />
        <Text style={styles.help}>Your request is reviewed by the Asaan Taqreeb team. We will add approved categories before you can create a listing in them.</Text>
        <Pressable onPress={submit} disabled={submitting || !name.trim() || !description.trim()} style={[styles.submit, (!name.trim() || !description.trim() || submitting) && styles.disabled]}>
          {submitting ? <ActivityIndicator color={Colors.white} /> : <><Send size={17} color={Colors.white} /><Text style={styles.submitText}>Submit request</Text></>}
        </Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white }, back: { padding: 10, borderRadius: 99, backgroundColor: Colors.lightGray }, title: { fontSize: 21, fontWeight: '800', color: Colors.textPrimary }, subtitle: { marginTop: 2, color: Colors.textSecondary }, content: { padding: 20 }, card: { padding: 20, borderRadius: 20, backgroundColor: Colors.white }, label: { marginBottom: 8, marginTop: 12, fontSize: 14, fontWeight: '700', color: Colors.textPrimary }, input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.textPrimary }, textarea: { minHeight: 130 }, help: { marginTop: 18, color: Colors.textSecondary, lineHeight: 20, fontSize: 13 }, submit: { marginTop: 22, minHeight: 52, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, disabled: { opacity: .55 }, submitText: { color: Colors.white, fontWeight: '800', fontSize: 16 } });
