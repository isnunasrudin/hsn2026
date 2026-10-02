<script setup lang="ts">
import { formatIndonesiaDateTime } from '~/utils/date'

type RegistrationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CANCELLED'
type Member = { id: number; name: string; identityNumber: string | null }
type RegistrationFile = { token: string; name: string; size: number; type: string }
type Registration = {
  id: number
  code: string
  registrantName: string
  email: string
  phone: string
  institution: string | null
  teamName: string | null
  participantCount: number
  answers: Record<string, string | number | boolean | readonly string[] | RegistrationFile>
  status: RegistrationStatus
  operatorNotes: string | null
  verifiedBy: number | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  members: Member[]
}
type RegistrationResponse = { activity: { id: number; title: string; slug: string }; total: number; registrations: Registration[] }
type RegistrationDetailResponse = { activity: { id: number; title: string; slug: string }; registration: Omit<Registration, 'members'>; members: Member[] }
type ApiError = { data?: { statusMessage?: string } }

definePageMeta({ middleware: 'auth', layout: 'admin' })

const route = useRoute()
const activityId = Number(route.params.activityId)
const filters = reactive({ q: '', status: 'ALL' as RegistrationStatus | 'ALL' })
const selectedId = ref<number | null>(null)
const statusDraft = ref<RegistrationStatus>('PENDING')
const notesDraft = ref('')
const actionPending = ref(false)
const deleteId = ref<number | null>(null)
const deleteCode = ref('')
const isDeleting = ref(false)
const feedback = ref('')
const errorMessage = ref('')

const query = computed(() => ({
  ...(filters.q ? { q: filters.q } : {}),
  ...(filters.status !== 'ALL' ? { status: filters.status } : {})
}))
const { data, pending, error, refresh } = await useFetch<RegistrationResponse>(() => `/api/admin/activities/${activityId}/registrations`, { query })
const { data: detailData, pending: detailPending, error: detailError, execute: loadDetail } = await useFetch<RegistrationDetailResponse>(() => selectedId.value ? `/api/admin/registrations/${selectedId.value}` : '/api/admin/registrations/0', { immediate: false, watch: false })
const registrations = computed(() => data.value?.registrations ?? [])
const answerEntries = computed(() => Object.entries(detailData.value?.registration.answers ?? {}))

const statusLabel = (status: RegistrationStatus): string => ({ PENDING: 'Menunggu', VERIFIED: 'Terverifikasi', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan' }[status])
const errorText = (value: unknown): string => (value as ApiError).data?.statusMessage ?? 'Perubahan pendaftar tidak dapat diproses.'
const answerLabel = (value: Registration['answers'][string]): string => {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && value !== null && 'name' in value) return `${value.name} (${Math.ceil(value.size / 1024)} KB)`
  return String(value)
}

const openDetail = async (registration: Registration): Promise<void> => {
  selectedId.value = registration.id
  statusDraft.value = registration.status
  notesDraft.value = registration.operatorNotes ?? ''
  errorMessage.value = ''
  await loadDetail()
}

const closeDetail = (): void => {
  selectedId.value = null
  detailData.value = null
}

const requestDelete = (registration: Registration): void => {
  errorMessage.value = ''
  deleteId.value = registration.id
  deleteCode.value = registration.code
}

const deleteRegistration = async (): Promise<void> => {
  if (!deleteId.value) return
  isDeleting.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/registrations/${deleteId.value}`, { method: 'DELETE' })
    feedback.value = 'Pendaftar berhasil dihapus.'
    if (selectedId.value === deleteId.value) closeDetail()
    deleteId.value = null
    await refresh()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isDeleting.value = false
  }
}

const saveStatus = async (): Promise<void> => {
  if (!selectedId.value) return
  actionPending.value = true
  feedback.value = ''
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/registrations/${selectedId.value}`, { method: 'PATCH', body: { status: statusDraft.value, operatorNotes: notesDraft.value || null } })
    feedback.value = 'Status pendaftar berhasil diperbarui.'
    await refresh()
    await loadDetail()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    actionPending.value = false
  }
}
</script>

<template>
  <section class="grid gap-6">
    <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <NuxtLink class="admin-link text-sm text-[var(--hsn-text-muted)]" to="/admin/activities">← Manajemen kegiatan</NuxtLink>
        <p class="mt-8 text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Pendaftar kegiatan</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-4xl">{{ data?.activity.title || 'Pendaftar' }}</h1>
        <p class="mt-3 text-base leading-7 text-[var(--hsn-text-secondary)]">{{ data?.total ?? 0 }} pendaftaran dalam cakupan akses Anda.</p>
      </div>
    </header>

    <p v-if="feedback" class="admin-status-active rounded-lg px-4 py-3 text-sm" role="status">{{ feedback }}</p>
    <p v-if="errorMessage || error" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">{{ errorMessage || 'Data pendaftar tidak dapat dimuat.' }}</p>

    <section class="admin-panel grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end" aria-label="Filter pendaftar">
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Cari pendaftar<input v-model="filters.q" class="admin-input" type="search" placeholder="Nama, email, telepon, atau kode"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Status<select v-model="filters.status" class="admin-input"><option value="ALL">Semua status</option><option value="PENDING">Menunggu</option><option value="VERIFIED">Terverifikasi</option><option value="REJECTED">Ditolak</option><option value="CANCELLED">Dibatalkan</option></select></label>
      <button class="admin-button admin-button-secondary" type="button" @click="filters.q = ''; filters.status = 'ALL'">Reset filter</button>
    </section>

    <section class="admin-panel overflow-hidden" aria-labelledby="registration-list-title">
      <div class="border-b border-[var(--hsn-border-subtle)] p-5 sm:p-6"><h2 id="registration-list-title" class="text-lg font-semibold text-[var(--hsn-text-primary)]">Daftar pendaftar</h2><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">Pendaftar aktif tetap dihitung dalam kuota.</p></div>
      <div class="overflow-x-auto"><table class="admin-table w-full min-w-[980px] border-collapse"><thead><tr><th>Kode</th><th>Pendaftar</th><th>Peserta</th><th>Status</th><th>Dibuat</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody><tr v-for="registration in registrations" :key="registration.id"><td class="font-mono text-sm text-[var(--hsn-accent-soft)]">{{ registration.code }}</td><td><p class="font-medium text-[var(--hsn-text-primary)]">{{ registration.registrantName }}</p><p class="mt-1 text-xs text-[var(--hsn-text-muted)]">{{ registration.email }} · {{ registration.phone }}</p></td><td class="text-sm text-[var(--hsn-text-secondary)]">{{ registration.participantCount }}{{ registration.teamName ? ` · ${registration.teamName}` : '' }}</td><td><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="registration.status === 'VERIFIED' ? 'admin-status-active' : registration.status === 'PENDING' ? 'admin-badge-accent' : 'admin-status-inactive'">{{ statusLabel(registration.status) }}</span></td><td class="text-sm text-[var(--hsn-text-muted)]">{{ formatIndonesiaDateTime(registration.createdAt) }}</td><td><div class="flex justify-end gap-2"><button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="openDetail(registration)">Lihat detail</button><button class="admin-button admin-button-danger px-3 py-2 text-xs" type="button" @click="requestDelete(registration)">Hapus</button></div></td></tr><tr v-if="!pending && registrations.length === 0"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="6">Tidak ada pendaftar yang cocok.</td></tr><tr v-if="pending"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="6">Memuat pendaftar...</td></tr></tbody></table></div>
    </section>

    <AdminModal :open="selectedId !== null" :title="detailData ? `Pendaftar ${detailData.registration.code}` : 'Detail pendaftar'" :description="detailData?.activity.title" @close="closeDetail">
      <div v-if="detailPending" class="py-8 text-center text-sm text-[var(--hsn-text-muted)]">Memuat detail pendaftar...</div>
      <div v-else-if="detailError || !detailData" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">Detail pendaftar tidak dapat dimuat.</div>
      <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div class="flex flex-wrap items-start justify-between gap-4"><div><h2 id="registration-detail-title" class="text-2xl font-semibold text-[var(--hsn-text-primary)]">{{ detailData.registration.registrantName }}</h2><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ detailData.activity.title }}</p></div></div>
          <dl class="mt-6 grid gap-4 border-t border-[var(--hsn-border-subtle)] pt-5 sm:grid-cols-2"><div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Kontak</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ detailData.registration.email }}<br>{{ detailData.registration.phone }}</dd></div><div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Instansi</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ detailData.registration.institution || 'Tidak diisi' }}</dd></div><div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Peserta</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ detailData.registration.participantCount }}{{ detailData.registration.teamName ? ` · ${detailData.registration.teamName}` : '' }}</dd></div><div><dt class="text-xs uppercase tracking-[.12em] text-[var(--hsn-text-muted)]">Dibuat</dt><dd class="mt-2 text-sm text-[var(--hsn-text-primary)]">{{ formatIndonesiaDateTime(detailData.registration.createdAt) }}</dd></div></dl>
          <div v-if="detailData.members.length" class="mt-6"><h3 class="text-sm font-semibold text-[var(--hsn-text-primary)]">Anggota tim</h3><ul class="mt-3 grid gap-2 sm:grid-cols-2"><li v-for="member in detailData.members" :key="member.id" class="rounded-lg bg-[var(--hsn-surface-secondary)] px-3 py-3 text-sm text-[var(--hsn-text-secondary)]"><span class="block text-[var(--hsn-text-primary)]">{{ member.name }}</span><span class="mt-1 block text-xs text-[var(--hsn-text-muted)]">{{ member.identityNumber || 'Nomor identitas tidak diisi' }}</span></li></ul></div>
          <div v-if="answerEntries.length" class="mt-6"><h3 class="text-sm font-semibold text-[var(--hsn-text-primary)]">Jawaban tambahan</h3><dl class="mt-3 grid gap-3"> <div v-for="[key, value] in answerEntries" :key="key" class="flex flex-col gap-1 rounded-lg bg-[var(--hsn-surface-secondary)] px-3 py-3 text-sm sm:flex-row sm:justify-between sm:gap-4"><dt class="text-[var(--hsn-text-muted)]">{{ key }}</dt><dd class="break-words text-[var(--hsn-text-primary)]">{{ answerLabel(value) }}</dd></div></dl></div>
        </div>
        <form class="grid content-start gap-4 border-t border-[var(--hsn-border-subtle)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" @submit.prevent="saveStatus"><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Status<select v-model="statusDraft" class="admin-input"><option value="PENDING">Menunggu</option><option value="VERIFIED">Terverifikasi</option><option value="REJECTED">Ditolak</option><option value="CANCELLED">Dibatalkan</option></select></label><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Catatan operator<textarea v-model="notesDraft" class="admin-input min-h-28" maxlength="2000"></textarea></label><p v-if="detailData.registration.verifiedAt" class="text-xs leading-5 text-[var(--hsn-text-muted)]">Diverifikasi pada {{ formatIndonesiaDateTime(detailData.registration.verifiedAt) }}.</p><button class="admin-button admin-button-primary" type="submit" :disabled="actionPending">{{ actionPending ? 'Menyimpan...' : 'Simpan status' }}</button></form>
      </div>
    </AdminModal>

    <AdminModal :open="deleteId !== null" title="Hapus pendaftar" description="Data pendaftar dan anggota tim akan dihapus permanen." @close="deleteId = null">
      <div class="grid gap-5"><p class="text-sm leading-6 text-[var(--hsn-text-secondary)]">Anda akan menghapus pendaftar <strong class="text-[var(--hsn-text-primary)]">{{ deleteCode }}</strong>. Tindakan ini tidak dapat dibatalkan.</p><div class="flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="deleteId = null">Batal</button><button class="admin-button admin-button-danger" type="button" :disabled="isDeleting" @click="deleteRegistration">{{ isDeleting ? 'Menghapus...' : 'Hapus pendaftar' }}</button></div></div>
    </AdminModal>
  </section>
</template>
