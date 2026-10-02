<script setup lang="ts">
import { formatIndonesiaDateTime } from '~/utils/date'

type UserRole = 'SUPER_ADMIN' | 'OPERATOR'

type UserRecord = {
  id: number
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type ApiError = { data?: { statusMessage?: string } }

definePageMeta({ middleware: 'auth', layout: 'admin' })

const { data, pending, error, refresh } = await useFetch<{ users: UserRecord[] }>('/api/admin/users')
const search = ref('')
const isCreateOpen = ref(false)
const isSubmitting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const resetId = ref<number | null>(null)
const deleteId = ref<number | null>(null)
const deleteName = ref('')
const isDeleting = ref(false)

const createForm = reactive({ name: '', email: '', password: '', role: 'OPERATOR' as UserRole })
const editForm = reactive({ name: '', email: '', role: 'OPERATOR' as UserRole, isActive: true })
const resetForm = reactive({ password: '' })

const users = computed(() => {
  const records = data.value?.users ?? []
  const query = search.value.trim().toLowerCase()
  return query ? records.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query)) : records
})

const selectedUser = computed(() => data.value?.users.find(user => user.id === editingId.value) ?? null)
const resetUser = computed(() => data.value?.users.find(user => user.id === resetId.value) ?? null)

const clearMessages = (): void => {
  feedback.value = ''
  errorMessage.value = ''
}

const errorText = (error: unknown): string => {
  const apiError = error as ApiError
  return apiError.data?.statusMessage ?? 'Perubahan tidak dapat disimpan.'
}

const reload = async (): Promise<void> => {
  await refresh()
  editingId.value = null
  resetId.value = null
  deleteId.value = null
}

const closeEditor = (): void => {
  editingId.value = null
}

const closeReset = (): void => {
  resetId.value = null
  resetForm.password = ''
}

const requestDelete = (user: UserRecord): void => {
  clearMessages()
  deleteId.value = user.id
  deleteName.value = user.name
}

const deleteUser = async (): Promise<void> => {
  if (!deleteId.value) return
  isDeleting.value = true
  clearMessages()

  try {
    await $fetch(`/api/admin/users/${deleteId.value}`, { method: 'DELETE' })
    feedback.value = 'Pengguna berhasil dihapus.'
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isDeleting.value = false
  }
}

const createUser = async (): Promise<void> => {
  clearMessages()
  isSubmitting.value = true

  try {
    await $fetch('/api/admin/users', { method: 'POST', body: { ...createForm } })
    createForm.name = ''
    createForm.email = ''
    createForm.password = ''
    createForm.role = 'OPERATOR'
    isCreateOpen.value = false
    feedback.value = 'Pengguna berhasil ditambahkan.'
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (user: UserRecord): void => {
  clearMessages()
  editingId.value = user.id
  editForm.name = user.name
  editForm.email = user.email
  editForm.role = user.role
  editForm.isActive = user.isActive
}

const updateUser = async (): Promise<void> => {
  if (!selectedUser.value) return

  clearMessages()
  isSubmitting.value = true

  try {
    await $fetch(`/api/admin/users/${selectedUser.value.id}`, { method: 'PATCH', body: { ...editForm } })
    feedback.value = 'Data pengguna berhasil diperbarui.'
    await reload()
  } catch (error: unknown) {
    errorMessage.value = errorText(error)
  } finally {
    isSubmitting.value = false
  }
}

const resetPassword = async (): Promise<void> => {
  if (!resetUser.value) return

  clearMessages()
  isSubmitting.value = true

  try {
    await $fetch(`/api/admin/users/${resetUser.value.id}/reset-password`, { method: 'POST', body: { password: resetForm.password } })
    resetForm.password = ''
    feedback.value = 'Password pengguna berhasil direset.'
    resetId.value = null
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
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Akses internal</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-4xl">Manajemen pengguna.</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--hsn-text-secondary)]">Kelola akun super admin dan operator yang dapat mengakses panel kegiatan.</p>
      </div>
      <button class="admin-button admin-button-primary shrink-0" type="button" @click="isCreateOpen = true">Tambah pengguna</button>
    </header>

    <p v-if="feedback" class="admin-status-active rounded-lg px-4 py-3 text-sm" role="status">{{ feedback }}</p>
    <p v-if="errorMessage || error" class="admin-alert-error rounded-lg px-4 py-3 text-sm" role="alert">{{ errorMessage || 'Data pengguna tidak dapat dimuat.' }}</p>

    <AdminModal :open="isCreateOpen" title="Pengguna baru" description="Password minimal 12 karakter." @close="isCreateOpen = false">
    <form class="grid gap-5 sm:grid-cols-2" @submit.prevent="createUser">
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Nama<input v-model="createForm.name" class="admin-input" required type="text"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Email<input v-model="createForm.email" class="admin-input" required type="email"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Password<input v-model="createForm.password" class="admin-input" minlength="12" required type="password"></label>
      <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Role<select v-model="createForm.role" class="admin-input"><option value="OPERATOR">Operator</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
      <div class="sm:col-span-2 flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="isCreateOpen = false">Batal</button><button class="admin-button admin-button-primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Menyimpan...' : 'Simpan pengguna' }}</button></div>
    </form>
    </AdminModal>

    <section class="admin-panel overflow-hidden" aria-labelledby="user-list-title">
      <div class="flex flex-col gap-4 border-b border-[var(--hsn-border-subtle)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 id="user-list-title" class="text-lg font-semibold text-[var(--hsn-text-primary)]">Daftar pengguna</h2><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ users.length }} akun ditampilkan</p></div>
        <label class="sr-only" for="search-users">Cari pengguna</label><input id="search-users" v-model="search" class="admin-input sm:max-w-[280px]" type="search" placeholder="Cari nama atau email">
      </div>
      <div class="overflow-x-auto">
        <table class="admin-table w-full min-w-[680px] border-collapse">
          <thead><tr><th>Pengguna</th><th>Role</th><th>Status</th><th>Login terakhir</th><th><span class="sr-only">Aksi</span></th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td><p class="font-medium text-[var(--hsn-text-primary)]">{{ user.name }}</p><p class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ user.email }}</p></td>
              <td><span class="text-sm text-[var(--hsn-text-secondary)]">{{ user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator' }}</span></td>
              <td><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="user.isActive ? 'admin-status-active' : 'admin-status-inactive'">{{ user.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
              <td class="text-sm text-[var(--hsn-text-muted)]">{{ user.lastLoginAt ? formatIndonesiaDateTime(user.lastLoginAt) : 'Belum pernah' }}</td>
              <td><div class="flex justify-end gap-2"><button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="startEditing(user)">Edit</button><button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" @click="resetId = user.id">Reset password</button><button class="admin-button admin-button-danger px-3 py-2 text-xs" type="button" @click="requestDelete(user)">Hapus</button></div></td>
            </tr>
            <tr v-if="!pending && users.length === 0"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="5">Belum ada pengguna yang cocok.</td></tr>
            <tr v-if="pending"><td class="py-12 text-center text-sm text-[var(--hsn-text-muted)]" colspan="5">Memuat pengguna...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <AdminModal :open="selectedUser !== null" :title="`Edit ${selectedUser?.name ?? 'pengguna'}`" description="Perubahan berlaku pada login berikutnya." @close="closeEditor">
      <form class="grid gap-5 sm:grid-cols-2" @submit.prevent="updateUser">
        <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Nama<input v-model="editForm.name" class="admin-input" required type="text"></label>
        <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Email<input v-model="editForm.email" class="admin-input" required type="email"></label>
        <label class="grid gap-2 text-sm text-[var(--hsn-text-secondary)]">Role<select v-model="editForm.role" class="admin-input"><option value="OPERATOR">Operator</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
        <label class="flex items-center gap-3 self-end pb-3 text-sm text-[var(--hsn-text-secondary)]"><input v-model="editForm.isActive" type="checkbox"> Akun aktif</label>
        <div class="sm:col-span-2 flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="closeEditor">Batal</button><button class="admin-button admin-button-primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Menyimpan...' : 'Simpan perubahan' }}</button></div>
      </form>
    </AdminModal>

    <AdminModal :open="resetUser !== null" title="Reset password" :description="`Password baru untuk ${resetUser?.name ?? 'pengguna'}.`" @close="closeReset">
      <form class="flex flex-col gap-4 sm:flex-row sm:items-end" @submit.prevent="resetPassword"><label class="grid flex-1 gap-2 text-sm text-[var(--hsn-text-secondary)]">Password baru<input v-model="resetForm.password" class="admin-input" minlength="12" required type="password"></label><div class="flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="closeReset">Batal</button><button class="admin-button admin-button-primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Menyimpan...' : 'Reset password' }}</button></div></form>
    </AdminModal>

    <AdminModal :open="deleteId !== null" title="Hapus pengguna" description="Akun akan dihapus permanen." @close="deleteId = null">
      <div class="grid gap-5"><p class="text-sm leading-6 text-[var(--hsn-text-secondary)]">Anda akan menghapus <strong class="text-[var(--hsn-text-primary)]">{{ deleteName }}</strong>. Tindakan ini tidak dapat dibatalkan.</p><div class="flex justify-end gap-3"><button class="admin-button admin-button-secondary" type="button" @click="deleteId = null">Batal</button><button class="admin-button admin-button-danger" type="button" :disabled="isDeleting" @click="deleteUser">{{ isDeleting ? 'Menghapus...' : 'Hapus pengguna' }}</button></div></div>
    </AdminModal>
  </section>
</template>
