import { View, Text, StyleSheet, Image, Pressable, FlatList } from 'react-native'
import { Star, MapPin, Users } from 'lucide-react-native'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { getAllServices, ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi'
import { useLanguage } from '@/app/_context/LanguageContext'

const S = {
  white:  '#FFFFFF',
  black:  '#0A0A0A',
  gray50: '#FAFAFA',
  gray100:'#F4F4F5',
  gray400:'#A1A1AA',
  gray600:'#52525B',
  blue:   '#2563EB',
  amber:  '#D97706',
  border: '#E4E4E7',
  red:    '#DC2626',
  radius: 4,
}

const CATEGORY_COLOR: Record<string, string> = {
  banquet:  S.black,
  catering: S.blue,
  photo:    S.gray600,
  parlor:   '#16A34A',
}

export default function FeaturedVendors() {
  const [vendors, setVendors]   = useState<ServiceListItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const { t }                   = useLanguage()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const services = await getAllServices()
        if (mounted) setVendors(services)
      } catch (e: any) {
        if (mounted) setError(e?.message || t('loadingVendors'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const topRated = useMemo(
    () => [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
    [vendors]
  )

  return (
    <View style={styles.container}>
      {/* ── Section Header ─────────────────────────────────────── */}
      <View style={styles.sectionHead}>
        <View style={styles.divider} />
        <View style={styles.headRow}>
          <Text style={styles.sectionLabel}>TOP RATED</Text>
          <Pressable onPress={() => router.push('/screens/client/Component/VendorListView')}>
            <Text style={styles.seeAll}>{t('seeAll')} →</Text>
          </Pressable>
        </View>
      </View>

      {loading && (
        <Text style={styles.stateText}>Loading vendors…</Text>
      )}
      {error && !loading && (
        <Text style={[styles.stateText, { color: S.red }]}>{error}</Text>
      )}

      <FlatList
        data={topRated}
        keyExtractor={item => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const accent = CATEGORY_COLOR[item.key] ?? S.blue
          const price  = item.category === 'banquet'
            ? item.price ?? 0
            : item.packages?.[0]?.price ?? 0

          return (
            <Pressable
              onPress={() => router.push({
                pathname: '/screens/client/Component/DetailScreenPage',
                params: { vendor: JSON.stringify(item), category: item.key },
              })}
              style={styles.card}
            >
              {/* Left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: accent }]} />

              <Image
                source={{ uri: item.images[0] }}
                style={styles.thumbnail}
                resizeMode="cover"
              />

              <View style={styles.info}>
                {/* Category tag */}
                <Text style={[styles.categoryTag, { color: accent }]}>
                  {item.category.toUpperCase()}
                </Text>

                {/* Name */}
                <Text style={styles.vendorName} numberOfLines={1}>{item.name}</Text>

                {/* Location */}
                <View style={styles.metaRow}>
                  <MapPin size={10} color={S.gray400} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {getConciseAddress(item.location)}
                  </Text>
                </View>

                {/* Banquet capacity */}
                {item.category === 'banquet' && item.minGuests && (
                  <View style={styles.metaRow}>
                    <Users size={10} color={S.gray400} />
                    <Text style={styles.metaText}>
                      {item.minGuests}–{item.maxGuests} {t('guests')}
                    </Text>
                  </View>
                )}

                {/* Price + Rating */}
                <View style={styles.bottom}>
                  <Text style={styles.price}>
                    PKR {price.toLocaleString()}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Star size={9} fill={S.amber} color={S.amber} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
  },
  sectionHead: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: S.border,
    marginBottom: 10,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.gray400,
  },
  seeAll: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: S.blue,
  },
  stateText: {
    fontSize: 12,
    color: S.gray400,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    backgroundColor: S.white,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: S.radius,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: S.black,
  },
  thumbnail: {
    width: 88,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 3,
  },
  categoryTag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: S.gray400,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '800',
    color: S.black,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '500',
    color: S.gray400,
    flex: 1,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: S.black,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: S.radius,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: S.amber,
  },
})
