<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest'
})

const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const getRedirectPath = (): string => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }

  return '/admin'
}

const submit = async (): Promise<void> => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    await refreshSession()
    await navigateTo(getRedirectPath())
  } catch (error: unknown) {
    const responseError = error as { data?: { statusMessage?: string } }
    errorMessage.value = responseError.data?.statusMessage ?? 'Login gagal. Periksa email dan password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="admin-shell grid min-h-[100dvh] place-items-center px-5 py-8">
    <section class="admin-panel w-full max-w-[440px] p-6 sm:p-8" aria-labelledby="login-title">
      <div class="mb-8">
        <div class="mb-6 flex items-center gap-3">
          <span class="admin-mark grid size-11 place-items-center rounded-full text-sm font-bold">HS</span>
          <div>
            <p class="text-sm font-semibold tracking-wide text-[var(--hsn-text-primary)]">HSN 2026</p>
            <p class="text-xs text-[var(--hsn-text-muted)]">PCNU Trenggalek</p>
          </div>
        </div>
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Akses pengelola</p>
        <h1 id="login-title" class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)]">Selamat datang kembali.</h1>
        <p class="mt-3 text-sm leading-6 text-[var(--hsn-text-secondary)]">Masuk untuk mengelola kegiatan Hari Santri Nasional 2026.</p>
      </div>

      <form class="grid gap-5" @submit.prevent="submit">
        <div class="grid gap-2">
          <label class="text-sm font-medium text-[var(--hsn-text-secondary)]" for="email">Email</label>
          <input id="email" v-model="email" class="admin-input" autocomplete="email" inputmode="email" type="email" required placeholder="nama@contoh.id">
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-[var(--hsn-text-secondary)]" for="password">Password</label>
          <input id="password" v-model="password" class="admin-input" autocomplete="current-password" type="password" required placeholder="Masukkan password">
        </div>
        <p v-if="errorMessage" class="admin-alert-error rounded-lg px-3 py-2 text-sm leading-5" role="alert">{{ errorMessage }}</p>
        <button class="admin-button admin-button-primary w-full" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Memeriksa...' : 'Masuk ke panel' }}
        </button>
      </form>
    </section>
  </main>
</template>
