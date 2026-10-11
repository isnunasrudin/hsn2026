const indonesiaDateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta'
}

const indonesiaDateTimeOptions: Intl.DateTimeFormatOptions = {
  ...indonesiaDateOptions,
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short'
}

const dateKeyFormatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta' })
const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' })

export const getIndonesiaDateKey = (value: string | Date): string => {
  const parts = Object.fromEntries(dateKeyFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export const groupByIndonesiaDate = <T extends { startsAt: string }>(items: readonly T[]): Array<{ key: string; date: string; items: T[] }> => {
  const groups = new Map<string, { key: string; date: string; items: T[] }>()
  for (const item of items) {
    const key = getIndonesiaDateKey(item.startsAt)
    const group = groups.get(key)
    if (group) group.items.push(item)
    else groups.set(key, { key, date: formatIndonesiaDate(item.startsAt), items: [item] })
  }
  return [...groups.values()]
}

export const formatIndonesiaTimeRange = (startsAt: string, endsAt: string | null): string => {
  const start = timeFormatter.format(new Date(startsAt))
  if (!endsAt) return `${start} WIB`
  const end = timeFormatter.format(new Date(endsAt))
  return getIndonesiaDateKey(startsAt) === getIndonesiaDateKey(endsAt)
    ? `${start}–${end} WIB`
    : `${start} WIB – ${formatIndonesiaDate(endsAt)}, ${end} WIB`
}

export const formatIndonesiaDateTimeRange = (startsAt: string, endsAt: string | null): string =>
  `${formatIndonesiaDate(startsAt)} · ${formatIndonesiaTimeRange(startsAt, endsAt)}`

export const formatIndonesiaDate = (value: string | Date | null): string => value
  ? new Intl.DateTimeFormat('id-ID', indonesiaDateOptions).format(new Date(value))
  : ''

export const formatIndonesiaDateTime = (value: string | Date | null): string => value
  ? new Intl.DateTimeFormat('id-ID', indonesiaDateTimeOptions).format(new Date(value))
  : ''

export const formatIndonesiaDateRange = (startsAt: string, endsAt: string | null): string => {
  const start = formatIndonesiaDate(startsAt)
  if (!endsAt) return start
  const end = formatIndonesiaDate(endsAt)
  return start === end ? start : `${start} – ${end}`
}
