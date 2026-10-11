<script setup lang="ts">
import { formatIndonesiaDateRange, formatIndonesiaDateTimeRange } from '~/utils/date'

type Field = { key: string; label: string; type: string; required: boolean; options?: string[] }
type Activity = { title: string; type: string; description: string | null; image: string | null; location: string | null; startsAt: string; endsAt: string | null; registrationOpensAt: string; registrationClosesAt: string; registrationMode: string; capacity: number | null; quotaRemaining: number | null; registrationState: string; registrationFields: Field[]; externalRegistrationUrl: string | null; minTeamMembers: number | null; maxTeamMembers: number | null; juknis: { name: string | null; mimeType: string | null; size: number | null; url: string } | null }

const route = useRoute()
const { data, pending, error } = await useFetch<{ activity: Activity }>(() => `/api/public/activities/${route.params.slug}`)
const activity = computed(() => data.value?.activity)
const canRegister = computed(() => activity.value?.type === 'LOMBA' && activity.value.registrationState === 'OPEN')
const needsRegistration = computed(() => activity.value?.type === 'LOMBA')
const isDetailRoute = computed(() => route.path === `/kegiatan/${route.params.slug}`)
const stateMessage = (state: string): string => ({ NOT_REQUIRED: 'Event ini tidak memerlukan pendaftaran peserta.', NOT_OPEN: 'Pendaftaran belum dibuka.', FULL: 'Kuota kegiatan sudah penuh.', CLOSED: 'Pendaftaran kegiatan sudah ditutup.', CANCELLED: 'Kegiatan ini dibatalkan.' }[state] ?? 'Pendaftaran saat ini belum tersedia.')
const fileSize = (size: number | null): string => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'Dokumen'
</script>

<template>
  <NuxtPage />
  <main v-if="isDetailRoute" class="admin-shell min-h-[100dvh] px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
    <div class="mx-auto max-w-[960px]">
      <NuxtLink class="admin-link text-sm text-[var(--hsn-text-muted)]" to="/kegiatan">← Semua kegiatan</NuxtLink>
      <div v-if="pending" class="admin-panel mt-8 p-8 text-center text-sm text-[var(--hsn-text-muted)]">Memuat detail...</div>
      <div v-else-if="error || !activity" class="admin-alert-error mt-8 rounded-lg px-4 py-3 text-sm" role="alert">Kegiatan tidak ditemukan.</div>
      <article v-else class="mt-8 grid gap-6">
        <div v-if="activity.image" class="admin-panel overflow-hidden"><img class="max-h-[420px] w-full object-cover" :src="activity.image" :alt="activity.title" width="1280" height="720"></div>
        <section class="admin-panel p-6 sm:p-8">
          <div class="flex flex-wrap items-center gap-3"><span class="admin-badge-accent rounded-full px-2.5 py-1 text-xs font-semibold">{{ activity.type }}</span><span class="text-sm text-[var(--hsn-text-muted)]">{{ activity.registrationState }}</span></div>
          <h1 class="mt-5 text-4xl font-semibold tracking-[-.04em] text-[var(--hsn-text-primary)]">{{ activity.title }}</h1>
          <p class="mt-4 whitespace-pre-line text-base leading-7 text-[var(--hsn-text-secondary)]">{{ activity.description }}</p>
          <dl class="mt-8 grid gap-4 border-t border-[var(--hsn-border-subtle)] pt-6 sm:grid-cols-2">
            <div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Pelaksanaan</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ formatIndonesiaDateTimeRange(activity.startsAt, activity.endsAt) }}</dd></div>
            <div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Lokasi</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ activity.location || 'Menyusul' }}</dd></div>
            <div v-if="needsRegistration"><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Periode pendaftaran</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ formatIndonesiaDateRange(activity.registrationOpensAt, activity.registrationClosesAt) }}</dd></div>
            <div v-if="needsRegistration && !activity.externalRegistrationUrl"><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Kuota tersisa</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ activity.quotaRemaining === null ? 'Tanpa batas' : activity.quotaRemaining }}</dd></div>
          </dl>
          <div v-if="activity.juknis" class="mt-8 flex flex-col gap-3 rounded-lg border border-[var(--hsn-border-subtle)] bg-[var(--hsn-surface-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-semibold text-[var(--hsn-text-primary)]">Petunjuk teknis</p><p class="mt-1 text-xs text-[var(--hsn-text-muted)]">{{ activity.juknis.name }} · {{ fileSize(activity.juknis.size) }}</p></div><a class="admin-button admin-button-secondary inline-flex" :href="activity.juknis.url" target="_blank" rel="noopener">Unduh juknis</a></div>
          <a v-if="canRegister && activity.externalRegistrationUrl" class="admin-button admin-button-primary mt-8 inline-flex" :href="activity.externalRegistrationUrl" target="_blank" rel="noopener noreferrer">Daftar sekarang</a>
          <NuxtLink v-else-if="canRegister" class="admin-button admin-button-primary mt-8 inline-flex" :to="`/kegiatan/${route.params.slug}/daftar`">Daftar sekarang</NuxtLink>
          <p v-else class="admin-status-active mt-8 rounded-lg px-4 py-3 text-sm">{{ stateMessage(activity.registrationState) }}</p>
        </section>
      </article>
    </div>
  </main>
</template>
