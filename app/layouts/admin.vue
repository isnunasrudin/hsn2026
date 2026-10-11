<script setup lang="ts">
const { user, fetch: refreshSession } = useUserSession()
const isLoggingOut = ref(false)

const logout = async (): Promise<void> => {
  isLoggingOut.value = true

  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/admin/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="admin-shell">
    <div class="mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside class="border-b border-[var(--hsn-border-subtle)] px-5 py-5 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <div class="flex items-center justify-between gap-4 lg:block">
          <NuxtLink class="admin-link inline-flex items-center gap-3" to="/admin">
            <span class="admin-mark grid size-10 place-items-center rounded-full text-sm font-bold">HS</span>
            <span>
              <span class="block text-sm font-semibold tracking-wide">HSN 2026</span>
              <span class="block text-xs text-[var(--hsn-text-muted)]">Panel pengelola</span>
            </span>
          </NuxtLink>
          <div class="hidden pt-12 lg:block">
            <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Navigasi</p>
            <nav class="mt-4 grid gap-2" aria-label="Navigasi admin">
              <NuxtLink class="admin-nav-link admin-link rounded-lg px-3 py-2 text-sm text-[var(--hsn-text-secondary)] transition" to="/admin">Ringkasan</NuxtLink>
              <NuxtLink class="admin-nav-link admin-link rounded-lg px-3 py-2 text-sm text-[var(--hsn-text-secondary)] transition" to="/admin/users">Pengguna</NuxtLink>
              <NuxtLink class="admin-nav-link admin-link rounded-lg px-3 py-2 text-sm text-[var(--hsn-text-secondary)] transition" to="/admin/activities">Kegiatan</NuxtLink>
              <NuxtLink class="admin-nav-link admin-link rounded-lg px-3 py-2 text-sm text-[var(--hsn-text-secondary)] transition" to="/timeline">Timeline publik</NuxtLink>
            </nav>
          </div>
          <button class="admin-button admin-button-secondary hidden w-full lg:mt-12 lg:block" type="button" :disabled="isLoggingOut" @click="logout">
            {{ isLoggingOut ? 'Keluar...' : 'Keluar' }}
          </button>
        </div>
      </aside>
      <main class="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div class="mx-auto max-w-[1120px]">
          <header class="mb-8 flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">PCNU Trenggalek</p>
              <p class="mt-2 text-sm text-[var(--hsn-text-muted)]">{{ user?.name }} · {{ user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator' }}</p>
            </div>
            <button class="admin-button admin-button-secondary lg:hidden" type="button" :disabled="isLoggingOut" @click="logout">
              {{ isLoggingOut ? 'Keluar...' : 'Keluar' }}
            </button>
          </header>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
