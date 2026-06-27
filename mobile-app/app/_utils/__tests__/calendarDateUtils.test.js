const {
  generateHourlyIntervals,
  getLocalMonthRange,
  parseRange,
  rangesOverlap,
  toLocalIsoDate,
  toMinutes,
} = require('../calendarDateUtils')

describe('calendarDateUtils', () => {
  test('formats dates using local calendar fields', () => {
    const fakeDate = {
      getFullYear: () => 2026,
      getMonth: () => 5,
      getDate: () => 28,
    }

    expect(toLocalIsoDate(fakeDate)).toBe('2026-06-28')
  })

  test('builds the current month range with local dates', () => {
    const range = getLocalMonthRange(new Date(2026, 0, 15))

    expect(range).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
    })
  })

  test('parses 12-hour and 24-hour times', () => {
    expect(toMinutes('12:00 AM')).toBe(0)
    expect(toMinutes('12 PM')).toBe(12 * 60)
    expect(toMinutes('09:30 PM')).toBe(21 * 60 + 30)
    expect(toMinutes('14:30')).toBe(14 * 60 + 30)
    expect(toMinutes('invalid')).toBeNull()
  })

  test('normalizes ranges that cross midnight', () => {
    expect(parseRange('9:00 PM to 1:00 AM')).toEqual({
      from: 21 * 60,
      to: 25 * 60,
    })
  })

  test('detects overlapping ranges', () => {
    expect(rangesOverlap({ from: 60, to: 180 }, { from: 120, to: 240 })).toBe(true)
    expect(rangesOverlap({ from: 60, to: 120 }, { from: 120, to: 240 })).toBe(false)
  })

  test('creates hourly intervals from configured hours', () => {
    const intervals = generateHourlyIntervals('09:00 AM', '11:00 AM')

    expect(intervals).toHaveLength(2)
    expect(intervals[0]).toEqual({
      label: '9:00 AM',
      value: '9:00 AM to 12:00 PM',
    })
  })
})