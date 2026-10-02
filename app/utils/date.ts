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
