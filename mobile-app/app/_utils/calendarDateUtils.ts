export const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toMinutes = (value: string) => {
  const raw = String(value || '').trim().toUpperCase()

  const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (ampmMatch) {
    let hour = Number(ampmMatch[1])
    const minute = Number(ampmMatch[2] || '0')
    const period = ampmMatch[3]
    if (hour === 12) hour = 0
    if (period === 'PM') hour += 12
    return hour * 60 + minute
  }

  const h24Match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (h24Match) {
    const hour = Number(h24Match[1])
    const minute = Number(h24Match[2])
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      return hour * 60 + minute
    }
  }

  return null
}

export const formatMinutesTo12Hour = (totalMinutes: number) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hour = Math.floor(normalized / 60)
  const min = normalized % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const displayMin = String(min).padStart(2, '0')
  return `${String(displayHour).padStart(2, '0')}:${displayMin} ${period}`
}

export const parseRange = (value: string) => {
  const [fromRaw, toRaw] = String(value || '').split(/\s*(?:to|-|–|—)\s*/i)
  const from = toMinutes(fromRaw || '')
  const to = toMinutes(toRaw || '')

  if (from === null || to === null) return null

  if (to <= from) {
    return { from, to: to + 24 * 60 }
  }

  return { from, to }
}

export const rangesOverlap = (
  a: { from: number; to: number },
  b: { from: number; to: number }
) => Math.max(a.from, b.from) < Math.min(a.to, b.to)

export const generateHourlyIntervals = (fromStr: string, toStr: string) => {
  const fromMin = toMinutes(fromStr) ?? (9 * 60)
  const toMin = toMinutes(toStr) ?? (21 * 60)

  const intervals: Array<{ label: string; value: string }> = []

  for (let time = fromMin; time <= toMin - 180; time += 60) {
    const label = formatMinutesTo12Hour(time)
    const endLabel = formatMinutesTo12Hour(time + 3 * 60)

    intervals.push({
      label,
      value: `${label} to ${endLabel}`,
    })
  }

  return intervals
}

export interface QuickSlotOption {
  id: string
  label: string
  time: string
  durationText?: string
  fromMinutes: number
  toMinutes: number
}

// Generate smart 2-hour slots for Parlor
export const generateParlorSlots = (operatingHours?: { from: string; to: string } | null): QuickSlotOption[] => {
  const startMin = toMinutes(operatingHours?.from || '09:00 AM') ?? (9 * 60)
  const endMin = toMinutes(operatingHours?.to || '09:00 PM') ?? (21 * 60)
  const slotDuration = 120 // 2 hours per parlor session

  const slots: QuickSlotOption[] = []
  let current = startMin

  while (current + slotDuration <= endMin) {
    const fromStr = formatMinutesTo12Hour(current)
    const toStr = formatMinutesTo12Hour(current + slotDuration)
    const time = `${fromStr} to ${toStr}`

    let label = 'Morning'
    const hour = Math.floor(current / 60)
    if (hour >= 12 && hour < 16) label = 'Afternoon'
    else if (hour >= 16 && hour < 19) label = 'Evening'
    else if (hour >= 19) label = 'Night'

    slots.push({
      id: `parlor_slot_${current}`,
      label: `${label} (${fromStr.replace(':00', '')} - ${toStr.replace(':00', '')})`,
      time,
      durationText: '2 Hours',
      fromMinutes: current,
      toMinutes: current + slotDuration,
    })

    // Advance by 2 hours (or 2.5 hours if room for break)
    current += 120
  }

  // Fallback defaults if operating window is too narrow
  if (slots.length === 0) {
    return [
      { id: 'p1', label: 'Morning (10 AM - 12 PM)', time: '10:00 AM to 12:00 PM', durationText: '2 Hours', fromMinutes: 600, toMinutes: 720 },
      { id: 'p2', label: 'Afternoon (01 PM - 03 PM)', time: '01:00 PM to 03:00 PM', durationText: '2 Hours', fromMinutes: 780, toMinutes: 900 },
      { id: 'p3', label: 'Evening (04 PM - 06 PM)', time: '04:00 PM to 06:00 PM', durationText: '2 Hours', fromMinutes: 960, toMinutes: 1080 },
      { id: 'p4', label: 'Night (07 PM - 09 PM)', time: '07:00 PM to 09:00 PM', durationText: '2 Hours', fromMinutes: 1140, toMinutes: 1260 },
    ]
  }

  return slots
}

// Generate Photography event session presets
export const generatePhotographyPresets = (operatingHours?: { from: string; to: string } | null): QuickSlotOption[] => {
  return [
    {
      id: 'photo_morning',
      label: 'Morning Shoot',
      time: '10:00 AM to 01:00 PM',
      durationText: '3 Hours',
      fromMinutes: 600,
      toMinutes: 780,
    },
    {
      id: 'photo_afternoon',
      label: 'Afternoon Session',
      time: '02:00 PM to 06:00 PM',
      durationText: '4 Hours',
      fromMinutes: 840,
      toMinutes: 1080,
    },
    {
      id: 'photo_evening',
      label: 'Evening Main Event',
      time: '06:00 PM to 11:00 PM',
      durationText: '5 Hours',
      fromMinutes: 1080,
      toMinutes: 1380,
    },
    {
      id: 'photo_fullday',
      label: 'Full Day Coverage',
      time: '12:00 PM to 10:00 PM',
      durationText: '10 Hours',
      fromMinutes: 720,
      toMinutes: 1320,
    },
  ]
}

export const getLocalMonthRange = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  return {
    from: toLocalIsoDate(new Date(year, month, 1)),
    to: toLocalIsoDate(new Date(year, month + 1, 0)),
  }
}