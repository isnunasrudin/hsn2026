<script setup lang="ts">
type Field = { key: string; label: string; type: string; required: boolean; options?: string[]; accept?: string }
type Activity = { title: string; registrationMode: 'INDIVIDUAL' | 'TEAM'; registrationState: string; registrationFields: Field[]; minTeamMembers: number | null; maxTeamMembers: number | null }
const route = useRoute()
const { data, error: loadError } = await useFetch<{ activity: Activity }>(() => `/api/public/activities/${route.params.slug}`)
const activity = computed(() => data.value?.activity)
const systemFieldKeys = ['registrant_name', 'email', 'phone', 'institution', 'team_name', 'participant_count', 'member_name', 'member_identity_number']
const fieldFor = (key: string): Field | undefined => activity.value?.registrationFields.find(field => field.key === key)
const fieldLabel = (key: string, fallback: string): string => fieldFor(key)?.label ?? fallback
const customFields = computed(() => (activity.value?.registrationFields ?? []).filter(field => !systemFieldKeys.includes(field.key)))
const form = reactive({ registrantName: '', email: '', phone: '', institution: '', teamName: '', participantCount: 1 })
const answers = reactive<Record<string, unknown>>({})
const files = reactive<Record<string, File | null>>({})
const members = ref([{ name: '', identityNumber: '' }])
const errorMessage = ref('')
const isSubmitting = ref(false)
const stateMessage = (state: string): string => ({ NOT_REQUIRED: 'Event ini tidak memerlukan pendaftaran peserta.', NOT_OPEN: 'Pendaftaran belum dibuka.', FULL: 'Kuota kegiatan sudah penuh.', CLOSED: 'Pendaftaran kegiatan sudah ditutup.', CANCELLED: 'Kegiatan ini dibatalkan.' }[state] ?? 'Pendaftaran saat ini belum tersedia.')

const setFile = (key: string, event: Event): void => {
  const input = event.target
  if (input instanceof HTMLInputElement) files[key] = input.files?.[0] ?? null
}

watch(() => form.participantCount, (count) => { if (activity.value?.registrationMode === 'TEAM') members.value = Array.from({ length: count }, (_, index) => members.value[index] ?? ({ name: '', identityNumber: '' })) })
const submit = async (): Promise<void> => { errorMessage.value = ''; isSubmitting.value = true; try { const body = new FormData(); body.set('registrantName', form.registrantName); body.set('email', form.email); body.set('phone', form.phone); body.set('institution', form.institution); body.set('teamName', form.teamName); body.set('participantCount', String(form.participantCount)); body.set('answers', JSON.stringify(answers)); body.set('members', JSON.stringify(activity.value?.registrationMode === 'TEAM' ? members.value : [])); for (const [key, file] of Object.entries(files)) if (file) body.append(`file_${key}`, file, file.name); const result = await $fetch<{ code: string }>(`/api/public/activities/${route.params.slug}/register`, { method: 'POST', body }); await navigateTo(`/kegiatan/pendaftaran/${result.code}`) } catch (error: unknown) { const apiError = error as { data?: { statusMessage?: string } }; errorMessage.value = apiError.data?.statusMessage ?? 'Pendaftaran gagal diproses.' } finally { isSubmitting.value = false } }
</script>

<template>
  <main class="admin-shell min-h-[100dvh] px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
    <div class="mx-auto max-w-[760px]">
      <NuxtLink class="admin-link text-sm text-[var(--hsn-text-muted)]" :to="`/kegiatan/${route.params.slug}`">← Detail kegiatan</NuxtLink>
      <section class="admin-panel mt-8 p-6 sm:p-8">
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Formulir pendaftaran</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)]">{{ activity?.title }}</h1>
        <p v-if="loadError" class="admin-alert-error mt-6 rounded-lg px-4 py-3 text-sm">Kegiatan tidak ditemukan.</p>
        <p v-else-if="activity && activity.registrationState !== 'OPEN'" class="admin-alert-error mt-6 rounded-lg px-4 py-3 text-sm">{{ stateMessage(activity.registrationState) }}</p>
        <form v-else class="mt-8 grid gap-5" @submit.prevent="submit">
          <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('registrant_name', 'Nama peserta / penanggung jawab') }}<input v-model="form.registrantName" class="admin-input" required type="text"></label>
          <div class="grid gap-5 sm:grid-cols-2">
            <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('email', 'Email aktif') }}<input v-model="form.email" class="admin-input" required type="email"></label>
            <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('phone', 'Nomor telepon') }}<input v-model="form.phone" class="admin-input" required type="tel"></label>
          </div>
          <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('institution', 'Instansi / pesantren') }}<input v-model="form.institution" class="admin-input" :required="fieldFor('institution')?.required ?? false" type="text"></label>
          <template v-if="activity?.registrationMode === 'TEAM'">
            <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('team_name', 'Nama tim') }}<input v-model="form.teamName" class="admin-input" required type="text"></label>
            <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('participant_count', 'Jumlah anggota tim') }}<input v-model.number="form.participantCount" class="admin-input" :max="activity.maxTeamMembers ?? 100" :min="activity.minTeamMembers ?? 1" required type="number"></label>
            <div class="grid gap-4 rounded-lg border border-[var(--hsn-border-subtle)] p-4">
              <p class="text-sm font-medium text-[var(--hsn-text-secondary)]">Data anggota tim</p>
              <div v-for="(member, index) in members" :key="index" class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('member_name', 'Nama anggota') }} {{ index + 1 }}<input v-model="member.name" class="admin-input" required type="text"></label>
                <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">{{ fieldLabel('member_identity_number', 'Nomor identitas anggota') }}<input v-model="member.identityNumber" class="admin-input" :required="fieldFor('member_identity_number')?.required ?? false" type="text"></label>
              </div>
            </div>
          </template>
          <div v-for="field in customFields" :key="field.key" class="grid gap-2">
            <label class="text-sm text-[var(--hsn-text-secondary)]" :for="field.key">{{ field.label }}<span v-if="field.required"> *</span></label>
            <textarea v-if="field.type === 'textarea'" :id="field.key" v-model="answers[field.key]" class="admin-input min-h-24" :required="field.required"></textarea>
            <input v-else-if="field.type === 'number'" :id="field.key" v-model.number="answers[field.key]" class="admin-input" type="number" :required="field.required">
            <select v-else-if="field.type === 'select'" :id="field.key" v-model="answers[field.key]" class="admin-input" :required="field.required"><option value="">Pilih</option><option v-for="option in field.options ?? []" :key="option" :value="option">{{ option }}</option></select>
            <div v-else-if="field.type === 'radio'" class="flex flex-wrap gap-4"><label v-for="option in field.options ?? []" :key="option" class="flex items-center gap-2 text-sm text-[var(--hsn-text-secondary)]"><input v-model="answers[field.key]" type="radio" :name="field.key" :value="option" :required="field.required">{{ option }}</label></div>
            <label v-else-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm text-[var(--hsn-text-secondary)]"><input v-model="answers[field.key]" :required="field.required" type="checkbox"> {{ field.label }}</label>
            <input v-else-if="field.type === 'file'" :id="field.key" class="admin-input" :accept="field.accept" :required="field.required" type="file" @change="setFile(field.key, $event)">
            <input v-else :id="field.key" v-model="answers[field.key]" class="admin-input" :type="field.type === 'email' || field.type === 'tel' ? field.type : 'text'" :required="field.required">
          </div>
          <p v-if="errorMessage" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">{{ errorMessage }}</p>
          <button class="admin-button admin-button-primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Mengirim...' : 'Kirim pendaftaran' }}</button>
        </form>
      </section>
    </div>
  </main>
</template>
