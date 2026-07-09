import React, { useState, useEffect, useRef } from 'react'
import { Modal, Pressable, Text, View, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Colors } from '@/app/_constants/theme'

interface ScrollWheelProps {
  items: string[]
  selectedValue: string;
  onValueChange: (value: string) => void
  categoryColor: string
}

const ScrollWheel: React.FC<ScrollWheelProps> = ({ items, selectedValue, onValueChange, categoryColor }) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const itemHeight = 45
  const selectedIndex = items.indexOf(selectedValue)
  const currentYRef = useRef(0)

  // Scroll to selected item on mount or external value changes
  useEffect(() => {
    if (selectedIndex !== -1 && scrollViewRef.current) {
      const targetY = selectedIndex * itemHeight
      if (Math.abs(currentYRef.current - targetY) > 2) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: targetY, animated: true })
        }, 50)
      }
    }
  }, [selectedIndex])

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    currentYRef.current = y
    const index = Math.round(y / itemHeight)
    if (index >= 0 && index < items.length) {
      const newValue = items[index]
      if (newValue !== selectedValue) {
        onValueChange(newValue)
      }
    }
  }

  const handleTap = (index: number) => {
    const targetY = index * itemHeight
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true })
    onValueChange(items[index])
  }

  return (
    <View style={styles.wheelContainer}>
      {/* Selection indicator bars */}
      <View style={[styles.wheelHighlight, { borderColor: `${categoryColor}30` }]} pointerEvents="none" />
      
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: itemHeight, // Offset so first and last items sit in the center
        }}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex
          return (
            <Pressable
              key={item}
              onPress={() => handleTap(index)}
              style={[styles.wheelItem, { height: itemHeight }]}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  {
                    color: isSelected ? categoryColor : Colors.textSecondary,
                    fontWeight: isSelected ? '800' : '500',
                    fontSize: isSelected ? 18 : 14,
                    opacity: isSelected ? 1 : 0.45,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

type Props = {
  visible: boolean
  title: string
  initialHour: string
  initialMinute: string
  initialPeriod: 'AM' | 'PM'
  onConfirm: (hour: string, minute: string, period: 'AM' | 'PM') => void
  onClose: () => void
  categoryColor: string
}

export default function TimePickerModal({
  visible,
  title,
  initialHour,
  initialMinute,
  initialPeriod,
  onConfirm,
  onClose,
  categoryColor
}: Props) {
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM')

  const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  // Reset values when modal is displayed
  useEffect(() => {
    if (visible) {
      setHour(initialHour || '12')
      setMinute(initialMinute || '00')
      setPeriod(initialPeriod || 'PM')
    }
  }, [visible, initialHour, initialMinute, initialPeriod])

  const handleConfirm = () => {
    onConfirm(hour, minute, period)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>
              {title}
            </Text>
          </View>

          {/* Time Picker Columns */}
          <View style={styles.pickerBody}>
            {/* Hours Column */}
            <View style={styles.columnWrapper}>
              <Text style={styles.columnLabel}>Hour</Text>
              <ScrollWheel
                items={HOURS}
                selectedValue={hour}
                onValueChange={setHour}
                categoryColor={categoryColor}
              />
            </View>

            {/* Separator */}
            <Text style={styles.separator}>:</Text>

            {/* Minutes Column */}
            <View style={styles.columnWrapper}>
              <Text style={styles.columnLabel}>Minute</Text>
              <ScrollWheel
                items={MINUTES}
                selectedValue={minute}
                onValueChange={setMinute}
                categoryColor={categoryColor}
              />
            </View>

            {/* AM / PM Toggle column */}
            <View style={[styles.columnWrapper, { marginLeft: 16 }]}>
              <Text style={styles.columnLabel}>Period</Text>
              <View style={styles.periodContainer}>
                <Pressable
                  onPress={() => setPeriod('AM')}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: period === 'AM' ? categoryColor : 'transparent',
                      borderColor: period === 'AM' ? categoryColor : Colors.border,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      { color: period === 'AM' ? Colors.white : Colors.textSecondary }
                    ]}
                  >
                    AM
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPeriod('PM')}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: period === 'PM' ? categoryColor : 'transparent',
                      borderColor: period === 'PM' ? categoryColor : Colors.border,
                      marginTop: 8,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      { color: period === 'PM' ? Colors.white : Colors.textSecondary }
                    ]}
                  >
                    PM
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={[styles.footerButton, { backgroundColor: Colors.lightGray }]}
            >
              <Text style={[styles.buttonText, { color: Colors.textPrimary }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={[styles.footerButton, { backgroundColor: categoryColor, marginLeft: 12 }]}
            >
              <Text style={[styles.buttonText, { color: Colors.white }]}>Set Time</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  pickerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  columnWrapper: {
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  wheelContainer: {
    height: 135,
    width: 65,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  wheelHighlight: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    height: 45,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  wheelItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    textAlign: 'center',
  },
  separator: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginHorizontal: 12,
    marginTop: 18,
  },
  periodContainer: {
    height: 135,
    justifyContent: 'center',
  },
  periodButton: {
    width: 65,
    height: 45,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
})
