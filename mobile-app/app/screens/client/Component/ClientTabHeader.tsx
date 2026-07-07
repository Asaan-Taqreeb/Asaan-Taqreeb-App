import React from 'react'
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { Colors } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import { router } from 'expo-router'
import Avatar from '@/app/_components/Avatar'
import NotificationBell from '@/app/_components/NotificationBell'

interface ClientTabHeaderProps {
  title: string
  subtitle?: string
}

export default function ClientTabHeader({ title, subtitle }: ClientTabHeaderProps) {
  const { user } = useUser()
  const { width } = useWindowDimensions()
  const compact = width < 380

  return (
    <View style={styles.container}>
      <View style={[styles.content, compact ? styles.contentCompact : null]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
          {/* Luxury gold accent indicator */}
          <View style={[styles.accentBar, compact ? styles.accentBarCompact : null]} />
          {subtitle ? <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.actions, compact ? styles.actionsCompact : null]}>
          <NotificationBell userId={user?.id} userRole="client" />
          <Pressable 
            style={styles.avatarPressable} 
            className="active:opacity-70"
            onPress={() => router.push("/screens/client/Component/ProfileView")}
          >
            <Avatar name={user?.name || 'U'} size="sm" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  contentCompact: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'Poppins',
    letterSpacing: -0.5,
  },
  titleCompact: {
    fontSize: 18,
  },
  accentBar: {
    width: 24,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
    marginTop: 4,
    marginBottom: 4,
  },
  accentBarCompact: {
    width: 20,
    marginTop: 3,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
    fontFamily: 'Inter',
  },
  subtitleCompact: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsCompact: {
    gap: 6,
  },
  avatarPressable: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }
})
