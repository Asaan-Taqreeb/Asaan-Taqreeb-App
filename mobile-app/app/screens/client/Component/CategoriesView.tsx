import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import { buildClientCategoryCards } from './categoryConfig'
import { getAllServices, type ServiceListItem } from '@/app/_utils/servicesApi'
import { useLanguage } from '@/app/_context/LanguageContext'

const S = {
  white:  '#FFFFFF',
  black:  '#0A0A0A',
  gray50: '#FAFAFA',
  gray100:'#F4F4F5',
  gray400:'#A1A1AA',
  gray600:'#52525B',
  blue:   '#2563EB',
  border: '#E4E4E7',
  radius: 4,
}

const CategoriesView = () => {
  const [services, setServices] = useState<ServiceListItem[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getAllServices()
        if (mounted) setServices(data)
      } catch {
        if (mounted) setServices([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const categories = useMemo(() => buildClientCategoryCards(services), [services])

  return (
    <View style={styles.container}>
      {/* ── Section Header ──────────────────────────────────────── */}
      <View style={styles.sectionHead}>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>{t('categories').toUpperCase()}</Text>
      </View>

      {/* ── Category Chips ──────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {categories.map(data => {
          const IconComponent = data.icon
          const label = t(
            data.key === 'photo' ? 'photoShoot'
              : data.key === 'banquet' ? 'banquets'
                : data.key
          )

          return (
            <Pressable
              key={data.id}
              onPress={() => router.push({
                pathname: '/screens/client/Component/VendorListView',
                params: data.key && data.key !== 'all' ? { category: data.key } : undefined,
              })}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <View style={styles.iconBox}>
                <IconComponent size={20} color={S.black} />
              </View>
              <Text style={styles.chipLabel} numberOfLines={1}>{label}</Text>
              <Text style={styles.chipCount}>{data.count}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default CategoriesView

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 4,
  },
  sectionHead: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: S.border,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.gray400,
  },
  strip: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
  },
  chipPressed: {
    backgroundColor: S.gray50,
  },
  iconBox: {
    width: 28,
    height: 28,
    backgroundColor: S.gray100,
    borderRadius: S.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: S.black,
  },
  chipCount: {
    fontSize: 9,
    fontWeight: '800',
    color: S.gray400,
    backgroundColor: S.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: S.radius,
    overflow: 'hidden',
  },
})