<script setup lang="ts">
import { formatIndonesiaDateTimeRange, formatIndonesiaTimeRange, groupByIndonesiaDate } from '~/utils/date'

type Activity = { id: number; type: 'LOMBA' | 'EVENT'; title: string; slug: string; description: string | null; image: string | null; location: string | null; startsAt: string; endsAt: string | null; registrationOpensAt: string; registrationClosesAt: string; registrationState: string; quotaRemaining: number | null }

const selectedType = ref<'ALL' | 'LOMBA' | 'EVENT'>('ALL')
const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities', { query: computed(() => selectedType.value === 'ALL' ? {} : { type: selectedType.value }) })
const activities = computed(() => data.value?.activities ?? [])
const activityGroups = computed(() => groupByIndonesiaDate(activities.value))
const stateLabel = (state: string): string => ({ OPEN: 'Pendaftaran dibuka', NOT_REQUIRED: 'Tanpa pendaftaran', NOT_OPEN: 'Segera dibuka', FULL: 'Kuota penuh', CLOSED: 'Pendaftaran ditutup' }[state] ?? state)
const setType = (type: string): void => {
  if (type === 'LOMBA' || type === 'EVENT') selectedType.value = type
  else selectedType.value = 'ALL'
}
</script>

<template>
  <main class="admin-shell min-h-[100dvh] px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
    <div class="mx-auto max-w-[1120px]">
      <header class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><NuxtLink class="admin-link text-sm text-[var(--hsn-text-muted)]" to="/">← Kembali ke beranda</NuxtLink><p class="mt-8 text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Kegiatan HSN 2026</p><h1 class="mt-3 text-4xl font-semibold tracking-[-.04em] text-[var(--hsn-text-primary)]">Pilih kegiatanmu.</h1><p class="mt-3 max-w-2xl text-base leading-7 text-[var(--hsn-text-secondary)]">Temukan lomba dan event Hari Santri Nasional 2026 di Trenggalek.</p></div><div class="flex gap-2" aria-label="Filter jenis kegiatan"><button v-for="type in ['ALL', 'LOMBA', 'EVENT']" :key="type" class="admin-button px-3 py-2 text-xs" :class="selectedType === type ? 'admin-button-primary' : 'admin-button-secondary'" type="button" @click="setType(type)">{{ type === 'ALL' ? 'Semua' : type }}</button></div></header>
      <p v-if="error" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">Kegiatan belum dapat dimuat.</p>
      <div v-else-if="pending" class="admin-panel p-8 text-center text-sm text-[var(--hsn-text-muted)]">Memuat kegiatan...</div>
      <div v-else-if="activities.length === 0" class="admin-panel p-8 text-center text-sm text-[var(--hsn-text-muted)]">Belum ada kegiatan yang dipublikasikan.</div>
      <div v-else class="grid gap-8">
        <section v-for="group in activityGroups" :key="group.key" class="grid gap-4">
          <h2 v-if="group.items.length > 1" class="border-b border-[var(--hsn-border-subtle)] pb-3 text-lg font-semibold text-[var(--hsn-text-primary)]">{{ group.date }}</h2>
          <div class="grid gap-5 md:grid-cols-2">
            <article v-for="activity in group.items" :key="activity.id" class="admin-panel overflow-hidden">
              <div v-if="activity.image" class="h-48 overflow-hidden bg-[var(--hsn-surface-secondary)]"><img class="h-full w-full object-cover" :src="activity.image" :alt="activity.title" loading="lazy" width="960" height="540"></div>
              <div class="p-6">
                <div class="flex items-center justify-between gap-3"><span class="admin-badge-accent rounded-full px-2.5 py-1 text-xs font-semibold">{{ activity.type }}</span><span class="text-xs text-[var(--hsn-text-muted)]">{{ stateLabel(activity.registrationState) }}</span></div>
                <h2 class="mt-5 text-xl font-semibold text-[var(--hsn-text-primary)]">{{ activity.title }}</h2>
                <p class="mt-2 line-clamp-3 text-sm leading-6 text-[var(--hsn-text-secondary)]">{{ activity.description || 'Detail kegiatan dan persyaratan tersedia di halaman kegiatan.' }}</p>
                <p class="mt-5 text-sm text-[var(--hsn-text-muted)]">{{ activity.location || 'Lokasi menyusul' }} · {{ group.items.length === 1 ? formatIndonesiaDateTimeRange(activity.startsAt, activity.endsAt) : formatIndonesiaTimeRange(activity.startsAt, activity.endsAt) }}</p>
                <NuxtLink class="admin-button admin-button-secondary mt-5 inline-flex" :to="`/kegiatan/${activity.slug}`">Lihat detail</NuxtLink>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
