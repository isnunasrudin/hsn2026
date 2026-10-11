<script setup lang="ts">
type Activity = {
  id: number
  type: 'LOMBA' | 'EVENT'
  title: string
  organizer: string | null
  slug: string
  description: string | null
  image: string | null
  location: string | null
  startsAt: string | null
  endsAt: string | null
  registrationState: string
}

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  ],
  meta: [
    { name: 'theme-color', content: '#071c1e' },
    { name: 'description', content: 'Timeline kegiatan Hari Santri Nasional 2026 PCNU Trenggalek.' }
  ],
  title: 'Timeline Kegiatan - Hari Santri 2026'
})

const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities')
</script>

<template>
  <ActivityTimeline
    :activities="data?.activities ?? []"
    :pending="pending"
    :has-error="Boolean(error)"
    eyebrow="Kalender kegiatan"
    heading="Rangkaian agenda"
    action-label="Katalog kegiatan"
    action-to="/kegiatan"
  />
</template>
