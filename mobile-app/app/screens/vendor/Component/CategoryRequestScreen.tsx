import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetchJson } from '@/app/_utils/apiClient';
import { APP_ENDPOINTS } from '@/app/_constants/apiEndpoints';
import { Colors, Shadows, Spacing } from '@/app/_constants/theme';

export default function CategoryRequestScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please enter a category name and description.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetchJson<any>(APP_ENDPOINTS.categoryRequests, {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      Alert.alert(
        'Request Submitted',
        'Thank you! Your category request has been submitted for review.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Error submitting category request:', err);
      Alert.alert(
        'Submission Failed',
        err?.message || 'Could not submit your request at this time. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Request a Category</Text>
          <Text style={styles.subtitle}>Tell us what new service you provide</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.card, Shadows.medium]}>
          <View style={styles.banner}>
            <Sparkles size={20} color={Colors.primary} />
            <Text style={styles.bannerText}>
              Can't find your service category? Let us know and we'll add it for you.
            </Text>
          </View>

          <Text style={styles.label}>Service Category Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. DJ & Sound, Event Décor, Mehndiwala"
            placeholderTextColor={Colors.textTertiary}
            style={styles.input}
            maxLength={80}
            editable={!submitting}
          />

          <Text style={styles.label}>What services will you offer? *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the packages, pricing structure, and details of what clients can book..."
            placeholderTextColor={Colors.textTertiary}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />

          <Text style={styles.help}>
            Your request will be reviewed by the Asaan Taqreeb admin team. Once approved, the category will be made available for service creation.
          </Text>

          <Pressable
            onPress={submit}
            disabled={submitting || !name.trim() || !description.trim()}
            style={[
              styles.submit,
              (!name.trim() || !description.trim() || submitting) && styles.disabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Send size={18} color={Colors.white} />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  back: {
    padding: 10,
    borderRadius: 99,
    backgroundColor: Colors.lightGray,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  content: {
    padding: 20,
  },
  card: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}10`,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  label: {
    marginBottom: 8,
    marginTop: 14,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 14,
  },
  help: {
    marginTop: 16,
    color: Colors.textTertiary,
    lineHeight: 18,
    fontSize: 12,
  },
  submit: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
