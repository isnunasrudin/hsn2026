<script setup lang="ts">
import { formatIndonesiaDateRange, formatIndonesiaDateTimeRange, formatIndonesiaTimeRange, groupByIndonesiaDate } from '~/utils/date'

type ActivityType = 'LOMBA' | 'EVENT'
type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'
type RegistrationMode = 'INDIVIDUAL' | 'TEAM'
type QuotaMode = 'REGISTRATION' | 'PERSON'
type RegistrationFieldType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'file'

type RegistrationField = {
  key: string
  label: string
  type: RegistrationFieldType
  required: boolean
  options?: string[]
  accept?: string
}

type ActivityRecord = {
  id: number
  type: ActivityType
  title: string | null
  organizer: string | null
  contactPerson: string | null
  contactPhone: string | null
  slug: string | null
  description: string | null
  image: string | null
  displayOrder: number
  location: string | null
  startsAt: string | null
  endsAt: string | null
  registrationOpensAt: string | null
  registrationClosesAt: string | null
  registrationMode: RegistrationMode
  quotaMode: QuotaMode
  capacity: number | null
  minTeamMembers: number | null
  maxTeamMembers: number | null
  registrationFields: RegistrationField[]
  externalRegistrationUrl: string | null
  juknis: { name: string | null; mimeType: string | null; size: number | null; url: string } | null
  status: ActivityStatus
}

type OperatorRecord = { id: number; name: string; email: string; role: 'SUPER_ADMIN' | 'OPERATOR' }
type ApiError = { data?: { statusMessage?: string } }

definePageMeta({ middleware: 'auth', layout: 'admin' })

const { user } = useUserSession()
const { data, pending, error, refresh } = await useFetch<{ activities: ActivityRecord[] }>('/api/admin/activities')
const { data: usersData } = await useFetch<{ users: OperatorRecord[] }>('/api/admin/users', { immediate: user.value?.role === 'SUPER_ADMIN' })

const isCreateOpen = ref(false)
const isSubmitting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const deleteId = ref<number | null>(null)
const deleteTitle = ref('')
const isDeleting = ref(false)
const selectedOperatorIds = ref<number[]>([])
const isSlugManuallyEdited = ref(false)
const pendingActivityImage = ref<Blob | null>(null)
const imageEditorKey = ref(0)
const filters = reactive({ q: '', type: 'ALL' as ActivityType | 'ALL', status: 'ALL' as ActivityStatus | 'ALL' })

const form = reactive({
  type: 'EVENT' as ActivityType,
  title: '',
  organizer: '',
  contactPerson: '',
  contactPhone: '',
  slug: '',
  description: '',
  image: '',
  displayOrder: 0,
  location: '',
  startsAt: '',
  endsAt: '',
  registrationOpensAt: '',
  registrationClosesAt: '',
  registrationMode: 'INDIVIDUAL' as RegistrationMode,
  quotaMode: 'REGISTRATION' as QuotaMode,
  capacity: '',
  minTeamMembers: '',
  maxTeamMembers: '',
  status: 'DRAFT' as ActivityStatus,
  registrationFields: [] as RegistrationField[],
  useExternalRegistration: false,
  externalRegistrationUrl: '',
  juknisFile: null as File | null
})

const slugFromTitle = (title: string): string => title
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

watch(() => form.title, (title) => {
  if (editingId.value === null && !isSlugManuallyEdited.value) form.slug = slugFromTitle(title)
}, { flush: 'sync' })

const activities = computed(() => data.value?.activities ?? [])
const filteredActivities = computed(() => {
  const query = filters.q.trim().toLowerCase()
  return activities.value.filter((activity) => {
    const matchesQuery = !query || `${activity.title ?? ''} ${activity.slug ?? ''} ${activity.organizer ?? ''} ${activity.location ?? ''}`.toLowerCase().includes(query)
    const matchesType = filters.type === 'ALL' || activity.type === filters.type
    const matchesStatus = filters.status === 'ALL' || activity.status === filters.status
    return matchesQuery && matchesType && matchesStatus
  })
})
const filteredActivityGroups = computed(() => groupByIndonesiaDate(filteredActivities.value))
const operators = computed(() => (usersData.value?.users ?? []).filter(operator => operator.role === 'OPERATOR'))
const selectedActivity = computed(() => activities.value.find(activity => activity.id === editingId.value) ?? null)
const isRegistrationActivity = computed(() => form.type === 'LOMBA')
const systemFieldKeys = ['registrant_name', 'email', 'phone', 'institution', 'team_name', 'participant_count', 'member_name', 'member_identity_number']
const inactiveSystemFields = new Map<string, RegistrationField>()

const defaultFields = (mode: RegistrationMode): RegistrationField[] => [
  { key: 'registrant_name', label: 'Nama peserta / penanggung jawab', type: 'text', required: true },
  { key: 'email', label: 'Email aktif', type: 'email', required: true },
  { key: 'phone', label: 'Nomor telepon', type: 'tel', required: true },
  { key: 'institution', label: 'Instansi / pesantren', type: 'text', required: false },
  ...(mode === 'TEAM' ? [
    { key: 'team_name', label: 'Nama tim', type: 'text' as const, required: true },
    { key: 'participant_count', label: 'Jumlah anggota tim', type: 'number' as const, required: true },
    { key: 'member_name', label: 'Nama anggota', type: 'text' as const, required: true },
    { key: 'member_identity_number', label: 'Nomor identitas anggota', type: 'text' as const, required: false }
  ] : [])
]

const syncSystemFields = (): void => {
  if (!isRegistrationActivity.value) return
  const existing = new Map(form.registrationFields.map(field => [field.key, field]))
  for (const field of form.registrationFields) {
    if (systemFieldKeys.includes(field.key)) inactiveSystemFields.set(field.key, { ...field })
  }
  const defaults = defaultFields(form.registrationMode)
  const systemKeysForMode = defaults.map(field => field.key)
  const customFields = form.registrationFields.filter(field => !systemFieldKeys.includes(field.key))
  form.registrationFields = [
    ...defaults.map(field => ({ ...field, ...(inactiveSystemFields.get(field.key) ?? {}), ...(existing.get(field.key) ?? {}) })),
    ...customFields.filter(field => !systemKeysForMode.includes(field.key))
  ]
}

watch(() => form.type, () => syncSystemFields())
watch(() => form.registrationMode, () => syncSystemFields())

const clearMessages = (): void => {
  feedback.value = ''
  errorMessage.value = ''
}

const errorText = (error: unknown): string => {
  const apiError = error as ApiError
  return apiError.data?.statusMessage ?? 'Perubahan kegiatan tidak dapat disimpan.'
}

const toLocalInput = (value: string | null): string => {
  if (!value) return ''
  const date = new Date(value)
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

const toIso = (value: string): string => new Date(value).toISOString()

const syncEndOfDay = (event: Event, endField: 'endsAt' | 'registrationClosesAt'): void => {
  if (editingId.value !== null && endField === 'endsAt') return
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  const [date] = event.currentTarget.value.split('T')
  if (!date) return
  form[endField] = `${date}T23:59`
}

const eventRegistrationWindow = (): { opensAt: string | null; closesAt: string | null } => {
  if (!form.startsAt) return { opensAt: null, closesAt: null }
  const startsAt = new Date(form.startsAt)
  const endsAt = form.endsAt ? new Date(form.endsAt) : new Date(startsAt.getTime() + 60 * 60 * 1000)
  const closesAt = endsAt.getTime() > startsAt.getTime() ? endsAt : new Date(startsAt.getTime() + 60 * 60 * 1000)
  return { opensAt: startsAt.toISOString(), closesAt: closesAt.toISOString() }
}

const resetForm = (): void => {
  inactiveSystemFields.clear()
  isSlugManuallyEdited.value = false
  pendingActivityImage.value = null
  imageEditorKey.value += 1
  form.type = 'EVENT'
  form.title = ''
  form.organizer = ''
  form.contactPerson = ''
  form.contactPhone = ''
  form.slug = ''
  form.description = ''
  form.image = ''
  form.displayOrder = 0
  form.location = ''
  form.startsAt = ''
  form.endsAt = ''
  form.registrationOpensAt = ''
  form.registrationClosesAt = ''
  form.registrationMode = 'INDIVIDUAL'
  form.quotaMode = 'REGISTRATION'
  form.capacity = ''
  form.minTeamMembers = ''
  form.maxTeamMembers = ''
  form.status = 'DRAFT'
  form.registrationFields = []
  form.useExternalRegistration = false
  form.externalRegistrationUrl = ''
  form.juknisFile = null
  selectedOperatorIds.value = []
}

const addRegistrationField = (): void => {
  let index = form.registrationFields.length + 1
  while (form.registrationFields.some(field => field.key === `field_${index}`)) index += 1
  form.registrationFields.push({ key: `field_${index}`, label: 'Field baru', type: 'text', required: false, options: [], accept: '' })
}

const removeRegistrationField = (index: number): void => {
  if (form.status !== 'PUBLISHED') {
    form.registrationFields.splice(index, 1)
    return
  }
  if (systemFieldKeys.includes(form.registrationFields[index]?.key ?? '')) return
  form.registrationFields.splice(index, 1)
}

const updateFieldOptions = (field: RegistrationField, event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  field.options = input.value.split(',').map(option => option.trim()).filter(Boolean)
}

const selectJuknis = (event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  form.juknisFile = input.files?.[0] ?? null
}

const uploadJuknis = async (activityId: number): Promise<void> => {
  if (!form.juknisFile) return
  const body = new FormData()
  body.append('file', form.juknisFile)
  await $fetch(`/api/admin/activities/${activityId}/juknis`, { method: 'POST', body })
}

const uploadActivityImage = async (activityId: number): Promise<void> => {
  if (!pendingActivityImage.value) return
  const body = new FormData()
  body.append('file', pendingActivityImage.value, 'kegiatan.jpg')
  await $fetch(`/api/admin/activities/${activityId}/image`, { method: 'POST', body })
}

const currentImageUrl = computed(() => {
  const activity = selectedActivity.value
  if (!activity || !form.image) return null
  return form.image.startsWith('storage:')
    ? `/api/admin/activities/${activity.id}/image`
    : form.image
})

const clearActivityImage = (): void => {
  form.image = ''
  pendingActivityImage.value = null
}

const deleteJuknis = async (): Promise<void> => {
  if (!selectedActivity.value?.juknis) return
  clearMessages()
  try {
    await $fetch(`/api/admin/activities/${selectedActivity.value.id}/juknis`, { method: 'DELETE' })
    feedback.value = 'Juknis berhasil dihapus.'
    await refresh()
    form.juknisFile = null
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  }
}

const payload = () => ({
  type: form.type,
  title: form.title.trim() || null,
  organizer: form.organizer || null,
  contactPerson: form.contactPerson.trim() || null,
  contactPhone: form.contactPhone.trim() || null,
  slug: form.slug.trim() || null,
  description: form.description || null,
  image: form.image || null,
  displayOrder: Number(form.displayOrder),
  location: form.location || null,
  startsAt: form.startsAt ? toIso(form.startsAt) : null,
  endsAt: form.endsAt ? toIso(form.endsAt) : null,
  registrationOpensAt: isRegistrationActivity.value ? (form.registrationOpensAt ? toIso(form.registrationOpensAt) : null) : eventRegistrationWindow().opensAt,
  registrationClosesAt: isRegistrationActivity.value ? (form.registrationClosesAt ? toIso(form.registrationClosesAt) : null) : eventRegistrationWindow().closesAt,
  registrationMode: isRegistrationActivity.value ? form.registrationMode : 'INDIVIDUAL',
  quotaMode: isRegistrationActivity.value ? form.quotaMode : 'REGISTRATION',
  capacity: isRegistrationActivity.value && form.capacity ? Number(form.capacity) : null,
  minTeamMembers: isRegistrationActivity.value && form.registrationMode === 'TEAM' && form.minTeamMembers ? Number(form.minTeamMembers) : null,
  maxTeamMembers: isRegistrationActivity.value && form.registrationMode === 'TEAM' && form.maxTeamMembers ? Number(form.maxTeamMembers) : null,
  registrationFields: isRegistrationActivity.value ? form.registrationFields : [],
  externalRegistrationUrl: isRegistrationActivity.value && form.useExternalRegistration && form.externalRegistrationUrl.trim() ? form.externalRegistrationUrl.trim() : null,
  status: form.status
})

const reload = async (): Promise<void> => {
  await refresh()
  editingId.value = null
  isCreateOpen.value = false
  deleteId.value = null
}

const closeEditor = (): void => {
  editingId.value = null
  isCreateOpen.value = false
}

const requestDelete = (activity: ActivityRecord): void => {
  clearMessages()
  deleteId.value = activity.id
  deleteTitle.value = activity.title || 'Draf tanpa judul'
}

const deleteActivity = async (): Promise<void> => {
  if (!deleteId.value) return
  isDeleting.value = true
  clearMessages()

  try {
    await $fetch(`/api/admin/activities/${deleteId.value}`, { method: 'DELETE' })
    feedback.value = 'Kegiatan berhasil dihapus.'
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isDeleting.value = false
  }
}

const createActivity = async (): Promise<void> => {
  clearMessages()
  isSubmitting.value = true

  try {
    const response = await $fetch<{ activity: ActivityRecord }>('/api/admin/activities', { method: 'POST', body: payload() })
    await uploadJuknis(response.activity.id)
    await uploadActivityImage(response.activity.id)
    feedback.value = 'Kegiatan berhasil dibuat.'
    resetForm()
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isSubmitting.value = false
  }
}

const editActivity = async (activity: ActivityRecord): Promise<void> => {
  clearMessages()
  inactiveSystemFields.clear()
  pendingActivityImage.value = null
  imageEditorKey.value += 1
  editingId.value = activity.id
  isCreateOpen.value = false
  form.type = activity.type
  form.title = activity.title ?? ''
  form.organizer = activity.organizer ?? ''
  form.contactPerson = activity.contactPerson ?? ''
  form.contactPhone = activity.contactPhone ?? ''
  form.slug = activity.slug ?? ''
  isSlugManuallyEdited.value = false
  form.description = activity.description ?? ''
  form.image = activity.image ?? ''
  form.displayOrder = activity.displayOrder
  form.location = activity.location ?? ''
  form.startsAt = toLocalInput(activity.startsAt)
  form.endsAt = toLocalInput(activity.endsAt)
  form.registrationOpensAt = toLocalInput(activity.registrationOpensAt)
  form.registrationClosesAt = toLocalInput(activity.registrationClosesAt)
  form.registrationMode = activity.registrationMode
  form.quotaMode = activity.quotaMode
  form.capacity = activity.capacity?.toString() ?? ''
  form.minTeamMembers = activity.minTeamMembers?.toString() ?? ''
  form.maxTeamMembers = activity.maxTeamMembers?.toString() ?? ''
  form.status = activity.status
  form.registrationFields = activity.registrationFields.map(field => ({ ...field, options: field.options ? [...field.options] : [] }))
  form.externalRegistrationUrl = activity.externalRegistrationUrl ?? ''
  form.useExternalRegistration = Boolean(activity.externalRegistrationUrl)
  for (const field of form.registrationFields) {
    if (systemFieldKeys.includes(field.key)) inactiveSystemFields.set(field.key, { ...field })
  }
  form.juknisFile = null

  if (user.value?.role === 'SUPER_ADMIN') {
    try {
      const detail = await $fetch<{ operators: OperatorRecord[] }>(`/api/admin/activities/${activity.id}`)
      selectedOperatorIds.value = detail.operators.map(operator => operator.id)
    } catch (error: unknown) {
      errorMessage.value = errorText(error)
    }
  }
}

const updateActivity = async (): Promise<void> => {
  if (!selectedActivity.value) return

  clearMessages()
  isSubmitting.value = true

  try {
    await $fetch(`/api/admin/activities/${selectedActivity.value.id}`, { method: 'PATCH', body: payload() })
    await uploadJuknis(selectedActivity.value.id)
    await uploadActivityImage(selectedActivity.value.id)
    if (user.value?.role === 'SUPER_ADMIN') {
      await $fetch(`/api/admin/activities/${selectedActivity.value.id}/operators`, { method: 'PUT', body: { userIds: selectedOperatorIds.value } })
    }
    feedback.value = 'Kegiatan berhasil diperbarui.'
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="grid gap-6">
    <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Program HSN 2026</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-4xl">Manajemen kegiatan.</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--hsn-text-secondary)]">Atur jadwal, periode pendaftaran, kuota, dan status publikasi kegiatan.</p>
      </div>
      <button class="admin-button admin-button-primary shrink-0" type="button" @click="isCreateOpen = true; editingId = null; resetForm()">Tambah kegiatan</button>
    </header>

    <p v-if="feedback" class="admin-status-active rounded-lg px-4 py-3 text-sm" role="status">{{ feedback }}</p>
    <p v-if="errorMessage || error" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">{{ errorMessage || 'Data kegiatan tidak dapat dimuat.' }}</p>

    <AdminModal :open="isCreateOpen || editingId !== null" :title="editingId ? `Edit ${selectedActivity?.title}` : 'Kegiatan baru'" description="Tanggal menggunakan zona waktu perangkat pengelola." @close="closeEditor">
    <form class="grid gap-5 sm:grid-cols-2" @submit.prevent="editingId ? updateActivity() : createActivity()">
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Jenis<select v-model="form.type" class="admin-input"><option value="EVENT">Event</option><option value="LOMBA">Lomba</option></select></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Status<select v-model="form.status" class="admin-input"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option><option value="CANCELLED">Cancelled</option></select></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)] sm:col-span-2">Judul<input v-model="form.title" class="admin-input" :required="form.status === 'PUBLISHED'" type="text"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Penyelenggara / PJ<input v-model="form.organizer" class="admin-input" type="text" placeholder="PCNU Trenggalek"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Nama CP<input v-model="form.contactPerson" class="admin-input" type="text" placeholder="Nama contact person"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Nomor WhatsApp CP<input v-model="form.contactPhone" class="admin-input" type="tel" placeholder="08xxxxxxxxxx"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Slug<input v-model="form.slug" class="admin-input" :required="form.status === 'PUBLISHED'" type="text" placeholder="otomatis-dari-judul" @input="isSlugManuallyEdited = true"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Lokasi<input v-model="form.location" class="admin-input" type="text" placeholder="Gedung PCNU Trenggalek"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Urutan tampil<input v-model="form.displayOrder" class="admin-input" min="0" type="number"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)] sm:col-span-2">Deskripsi<textarea v-model="form.description" class="admin-input min-h-24" rows="3"></textarea></label>
      <AdminActivityImageCropper :key="imageEditorKey" :image-url="currentImageUrl" @cropped="pendingActivityImage = $event" @clear="clearActivityImage" />
      <div class="grid gap-3 rounded-lg border border-[var(--hsn-border-subtle)] p-4 sm:col-span-2"><div><p class="text-sm font-medium text-[var(--hsn-text-secondary)]">Juknis kegiatan</p><p class="mt-1 text-xs leading-5 text-[var(--hsn-text-muted)]">PDF, DOC, atau DOCX maksimal 10 MB. File baru akan menggantikan juknis lama setelah disimpan.</p></div><div v-if="selectedActivity?.juknis" class="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--hsn-surface-secondary)] px-3 py-2 text-sm"><a class="admin-link truncate" :href="selectedActivity.juknis.url" target="_blank" rel="noopener">{{ selectedActivity.juknis.name }}</a><button class="admin-button admin-button-danger px-3 py-2 text-xs" type="button" @click="deleteJuknis">Hapus juknis</button></div><input class="admin-input file:mr-3 file:rounded-md file:border-0 file:bg-[var(--hsn-accent-primary)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#071c1e]" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="selectJuknis"></div>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Mulai kegiatan (opsional)<input v-model="form.startsAt" class="admin-input" type="datetime-local" @input="syncEndOfDay($event, 'endsAt')"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Selesai kegiatan<input v-model="form.endsAt" class="admin-input" type="datetime-local"></label>
      <label v-if="isRegistrationActivity" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Pendaftaran dibuka<input v-model="form.registrationOpensAt" class="admin-input" :required="form.status === 'PUBLISHED'" type="datetime-local" @input="syncEndOfDay($event, 'registrationClosesAt')"></label>
      <label v-if="isRegistrationActivity" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Pendaftaran ditutup<input v-model="form.registrationClosesAt" class="admin-input" :required="form.status === 'PUBLISHED'" type="datetime-local"></label>
      <div v-if="isRegistrationActivity" class="grid gap-3 sm:col-span-2">
        <label class="flex items-center gap-3 text-sm text-[var(--hsn-text-secondary)]"><input v-model="form.useExternalRegistration" class="size-4 accent-[var(--hsn-accent-primary)]" type="checkbox"><span>Gunakan tautan pendaftaran eksternal</span></label>
        <p class="text-xs leading-5 text-[var(--hsn-text-muted)]">Aktifkan untuk Google Forms atau situs pendaftaran lain. Jika dimatikan, peserta memakai formulir internal.</p>
        <label v-if="form.useExternalRegistration" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">URL formulir eksternal<input v-model="form.externalRegistrationUrl" class="admin-input" type="url" inputmode="url" placeholder="https://forms.gle/..." autocomplete="url" :required="form.status === 'PUBLISHED'"><span class="text-xs leading-5 text-[var(--hsn-text-muted)]">Gunakan alamat lengkap yang diawali http:// atau https://.</span></label>
      </div>
      <label v-if="isRegistrationActivity && !form.useExternalRegistration" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Mode peserta<select v-model="form.registrationMode" class="admin-input"><option value="INDIVIDUAL">Individu</option><option value="TEAM">Tim</option></select></label>
      <label v-if="isRegistrationActivity && !form.useExternalRegistration" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Mode kuota<select v-model="form.quotaMode" class="admin-input"><option value="REGISTRATION">Per pendaftaran</option><option value="PERSON">Per orang</option></select></label>
      <label v-if="isRegistrationActivity && !form.useExternalRegistration" class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Kapasitas<input v-model="form.capacity" class="admin-input" min="1" type="number"></label>
      <template v-if="isRegistrationActivity && !form.useExternalRegistration && form.registrationMode === 'TEAM'"><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Minimal anggota<input v-model="form.minTeamMembers" class="admin-input" min="1" :required="form.status === 'PUBLISHED'" type="number"></label><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Maksimal anggota<input v-model="form.maxTeamMembers" class="admin-input" min="1" :required="form.status === 'PUBLISHED'" type="number"></label></template>
      <div v-if="isRegistrationActivity && !form.useExternalRegistration" class="grid gap-3 sm:col-span-2">
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium text-[var(--hsn-text-secondary)]">Formulir pendaftaran</p><p class="mt-1 text-xs leading-5 text-[var(--hsn-text-muted)]">Field bawaan sudah disiapkan. Ubah labelnya, lalu tambahkan field sesuai kebutuhan lomba. Sebelum dipublikasikan, semua field boleh dihapus.</p></div>
          <button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="addRegistrationField">Tambah field</button>
        </div>
        <div v-for="(field, index) in form.registrationFields" :key="`${field.key}-${index}`" class="grid gap-3 rounded-lg border border-[var(--hsn-border-subtle)] p-4 sm:grid-cols-[1fr_1fr_160px_auto]">
          <label class="grid gap-2 text-xs text-[var(--hsn-text-muted)]">Key<input v-model="field.key" class="admin-input text-sm" :readonly="systemFieldKeys.includes(field.key)" :required="form.status === 'PUBLISHED'" type="text" placeholder="asal_sekolah"></label>
          <label class="grid gap-2 text-xs text-[var(--hsn-text-muted)]">Label<input v-model="field.label" class="admin-input text-sm" :required="form.status === 'PUBLISHED'" type="text" placeholder="Asal sekolah"></label>
          <label class="grid gap-2 text-xs text-[var(--hsn-text-muted)]">Tipe<select v-model="field.type" class="admin-input text-sm" :disabled="systemFieldKeys.includes(field.key)"><option value="text">Teks</option><option value="textarea">Paragraf</option><option value="number">Angka</option><option value="email">Email</option><option value="tel">Nomor telepon</option><option value="select">Pilihan</option><option value="radio">Radio</option><option value="checkbox">Checkbox</option><option value="file">File</option></select></label>
          <div class="flex items-end gap-2">
            <label class="flex items-center gap-2 pb-3 text-xs text-[var(--hsn-text-secondary)]"><input v-model="field.required" :disabled="['registrant_name', 'email', 'phone', 'team_name', 'participant_count', 'member_name'].includes(field.key)" type="checkbox"> Wajib</label>
            <button v-if="form.status !== 'PUBLISHED' || !systemFieldKeys.includes(field.key)" class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="removeRegistrationField(index)">Hapus</button>
            <span v-else class="pb-3 text-[11px] text-[var(--hsn-text-muted)]">Field sistem</span>
          </div>
          <label v-if="['select', 'radio'].includes(field.type)" class="grid gap-2 text-xs text-[var(--hsn-text-muted)] sm:col-span-4">Pilihan, pisahkan dengan koma<input :value="field.options?.join(', ')" class="admin-input text-sm" type="text" @input="updateFieldOptions(field, $event)"></label>
          <label v-if="field.type === 'file'" class="grid gap-2 text-xs text-[var(--hsn-text-muted)] sm:col-span-4">Format file<input v-model="field.accept" class="admin-input text-sm" type="text" placeholder=".pdf,image/*"></label>
        </div>
      </div>
      <template v-if="user?.role === 'SUPER_ADMIN' && editingId"><div class="grid gap-2 sm:col-span-2"><p class="text-sm text-[var(--hsn-text-secondary)]">Operator kegiatan</p><div class="grid gap-2 rounded-lg border border-[var(--hsn-border-subtle)] p-4 sm:grid-cols-2"><label v-for="operator in operators" :key="operator.id" class="flex items-center gap-3 text-sm text-[var(--hsn-text-secondary)]"><input v-model="selectedOperatorIds" :value="operator.id" type="checkbox"><span>{{ operator.name }}<small class="ml-2 text-[var(--hsn-text-muted)]">{{ operator.email }}</small></span></label><p v-if="operators.length === 0" class="text-sm text-[var(--hsn-text-muted)]">Belum ada operator aktif.</p></div></div></template>
      <div class="sm:col-span-2 flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="closeEditor">Batal</button><button class="admin-button admin-button-primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan perubahan' : 'Simpan kegiatan') }}</button></div>
    </form>
    </AdminModal>

    <AdminModal :open="deleteId !== null" title="Hapus kegiatan" description="Kegiatan, pendaftar, dan relasi operator akan dihapus permanen." @close="deleteId = null">
      <div class="grid gap-5"><p class="text-sm leading-6 text-[var(--hsn-text-secondary)]">Anda akan menghapus <strong class="text-[var(--hsn-text-primary)]">{{ deleteTitle }}</strong>. Tindakan ini tidak dapat dibatalkan.</p><div class="flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="deleteId = null">Batal</button><button class="admin-button admin-button-danger" type="button" :disabled="isDeleting" @click="deleteActivity">{{ isDeleting ? 'Menghapus...' : 'Hapus kegiatan' }}</button></div></div>
    </AdminModal>

    <section class="admin-panel overflow-hidden" aria-labelledby="activity-list-title">
      <div class="grid gap-4 border-b border-[var(--hsn-border-subtle)] p-5 sm:grid-cols-[minmax(0,1fr)_160px_180px_auto] sm:items-end sm:p-6"><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Cari kegiatan<input v-model="filters.q" class="admin-input" type="search" placeholder="Judul, slug, penyelenggara..."></label><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Jenis<select v-model="filters.type" class="admin-input"><option value="ALL">Semua jenis</option><option value="EVENT">Event</option><option value="LOMBA">Lomba</option></select></label><label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Status<select v-model="filters.status" class="admin-input"><option value="ALL">Semua status</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option><option value="CANCELLED">Cancelled</option></select></label><button class="admin-button admin-button-secondary" type="button" @click="filters.q = ''; filters.type = 'ALL'; filters.status = 'ALL'">Reset</button></div>
      <div class="border-b border-[var(--hsn-border-subtle)] px-5 py-4 sm:px-6"><h2 id="activity-list-title" class="text-lg font-semibold text-[var(--hsn-text-primary)]">Daftar kegiatan</h2><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ filteredActivities.length }} dari {{ activities.length }} kegiatan</p></div>
      <div class="overflow-x-auto">
        <table class="admin-table w-full min-w-[960px] border-collapse">
          <thead><tr><th>Kegiatan</th><th>Jadwal</th><th>Pendaftaran</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead>
          <tbody>
            <template v-for="group in filteredActivityGroups" :key="group.key">
              <tr><td colspan="5" class="bg-[var(--hsn-surface-secondary)] font-semibold text-[var(--hsn-text-primary)]">{{ group.date || 'Tanpa tanggal' }}</td></tr>
              <tr v-for="activity in group.items" :key="activity.id">
                <td><p class="font-medium text-[var(--hsn-text-primary)]">{{ activity.title || 'Draf belum berjudul' }}</p><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ activity.type }}<span v-if="activity.slug"> · /{{ activity.slug }}</span></p></td>
                <td class="text-sm text-[var(--hsn-text-secondary)]">{{ activity.startsAt ? formatIndonesiaTimeRange(activity.startsAt, activity.endsAt) : '' }}</td>
                <td class="text-sm text-[var(--hsn-text-secondary)]"><span v-if="activity.type === 'LOMBA' && (activity.registrationOpensAt || activity.registrationClosesAt)">{{ formatIndonesiaDateRange(activity.registrationOpensAt, activity.registrationClosesAt) }}</span></td>
                <td><span class="admin-badge-accent rounded-full px-2.5 py-1 text-xs font-semibold">{{ activity.status }}</span></td>
                <td><div class="flex justify-end gap-2"><NuxtLink v-if="activity.type === 'LOMBA'" class="admin-button admin-button-secondary px-3 py-2 text-xs" :to="`/admin/registrations/${activity.id}`">Pendaftar</NuxtLink><button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="editActivity(activity)">Edit</button><button class="admin-button admin-button-danger px-3 py-2 text-xs" type="button" @click="requestDelete(activity)">Hapus</button></div></td>
              </tr>
            </template>
            <tr v-if="!pending && filteredActivities.length === 0"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="5">Tidak ada kegiatan yang cocok.</td></tr>
            <tr v-if="pending"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="5">Memuat kegiatan...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
