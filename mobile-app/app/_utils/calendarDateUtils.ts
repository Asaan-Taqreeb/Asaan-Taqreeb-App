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
    const hour = Math.floor(time / 60) % 24
    const min = time % 60
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const displayMin = String(min).padStart(2, '0')

    const label = `${displayHour}:${displayMin} ${period}`
    const endTimeMin = time + 3 * 60
    const endHour = Math.floor(endTimeMin / 60) % 24
    const endMin = endTimeMin % 60
    const endPeriod = endHour >= 12 ? 'PM' : 'AM'
    const endDisplayHour = endHour % 12 === 0 ? 12 : endHour % 12
    const endDisplayMin = String(endMin).padStart(2, '0')

    intervals.push({
      label,
      value: `${label} to ${endDisplayHour}:${endDisplayMin} ${endPeriod}`,
    })
  }

  return intervals
}

export const getLocalMonthRange = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  return {
    from: toLocalIsoDate(new Date(year, month, 1)),
    to: toLocalIsoDate(new Date(year, month + 1, 0)),
  }
}