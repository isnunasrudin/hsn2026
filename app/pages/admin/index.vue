<script setup lang="ts">
type Dashboard = {
  activities: { total: number; draft: number; published: number }
  registrations: { total: number; pending: number }
}

definePageMeta({ middleware: 'auth', layout: 'admin' })

const { user } = useUserSession()
const { data: dashboard } = await useFetch<Dashboard>('/api/admin/dashboard')
</script>

<template>
  <section class="grid gap-8">
    <div>
      <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-accent-soft)]">Ringkasan</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-4xl">Pusat kendali kegiatan.</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--hsn-text-secondary)]">Autentikasi sudah aktif. Area ini akan menjadi pintu masuk pengelolaan kegiatan, peserta, dan operator.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="admin-panel p-5"><p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Total kegiatan</p><p class="mt-4 text-3xl font-semibold text-[var(--hsn-text-primary)]">{{ dashboard?.activities.total ?? '—' }}</p></article>
      <article class="admin-panel p-5"><p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Dipublikasikan</p><p class="mt-4 text-3xl font-semibold text-[var(--hsn-accent-soft)]">{{ dashboard?.activities.published ?? '—' }}</p></article>
      <article class="admin-panel p-5"><p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Total pendaftar</p><p class="mt-4 text-3xl font-semibold text-[var(--hsn-text-primary)]">{{ dashboard?.registrations.total ?? '—' }}</p></article>
      <article class="admin-panel p-5"><p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Menunggu verifikasi</p><p class="mt-4 text-3xl font-semibold text-[var(--hsn-status-success)]">{{ dashboard?.registrations.pending ?? '—' }}</p></article>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <article class="admin-panel p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Akun aktif</p>
        <h2 class="mt-4 text-xl font-semibold text-[var(--hsn-text-primary)]">{{ user?.name }}</h2>
        <p class="mt-2 text-sm text-[var(--hsn-text-secondary)]">{{ user?.email }}</p>
        <span class="admin-badge-accent mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold">{{ user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator' }}</span>
      </article>
      <article class="admin-panel p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--hsn-text-muted)]">Langkah berikutnya</p>
        <h2 class="mt-4 text-xl font-semibold text-[var(--hsn-text-primary)]">Siapkan kegiatan pertama.</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--hsn-text-secondary)]">Buat kegiatan pertama melalui halaman manajemen kegiatan, lalu atur operator yang bertugas.</p>
        <NuxtLink class="admin-button admin-button-secondary mt-5 inline-flex" to="/admin/activities">Buka manajemen kegiatan</NuxtLink>
      </article>
    </div>
  </section>
</template>
