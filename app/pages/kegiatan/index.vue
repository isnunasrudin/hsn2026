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

const selectedType = ref<'ALL' | 'LOMBA' | 'EVENT'>('ALL')
const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities', {
  query: computed(() => selectedType.value === 'ALL' ? {} : { type: selectedType.value })
})

useHead({
  title: 'Katalog Kegiatan - Hari Santri 2026',
  meta: [{ name: 'description', content: 'Katalog lomba dan kegiatan Hari Santri Nasional 2026 PCNU Trenggalek.' }]
})
</script>

<template>
  <ActivityTimeline
    v-model:selected-type="selectedType"
    :activities="data?.activities ?? []"
    :pending="pending"
    :has-error="Boolean(error)"
    :show-filters="true"
    eyebrow="Katalog kegiatan"
    heading="Pilih kegiatanmu."
    action-label="Lihat timeline"
    action-to="/timeline"
  />
</template>
