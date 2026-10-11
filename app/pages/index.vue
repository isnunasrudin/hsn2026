<script setup lang="ts">
import hsnLogo from '~/assets/images/hsn2026.webp'
import { formatIndonesiaDate } from '~/utils/date'

type Activity = {
  id: number
  title: string
  slug: string
  organizer: string
  location: string | null
  startsAt: string
  registrationState: string
}

const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities', {
  query: { type: 'LOMBA' }
})

const featuredActivities = computed(() => (data.value?.activities ?? []).slice(0, 3))
const registrationLabel = (state: string): string => ({
  OPEN: 'Pendaftaran dibuka',
  NOT_OPEN: 'Segera dibuka',
  FULL: 'Kuota terpenuhi',
  CLOSED: 'Pendaftaran ditutup'
}[state] ?? 'Informasi lomba')

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  ],
  meta: [
    { name: 'theme-color', content: '#071c1e' },
    { name: 'description', content: 'Selayang pandang lomba Hari Santri Nasional 2026 PCNU Trenggalek.' }
  ],
  title: 'Hari Santri 2026 - PCNU Trenggalek'
})
</script>

<template>
  <main class="stage relative flex min-h-[100dvh] flex-col px-5 py-6 text-center sm:px-10 sm:py-8">
    <header class="reveal flex w-full shrink-0 items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[.18em] text-[#d6e4de]/70">
      <span>PCNU Trenggalek</span>
      <span class="whitespace-nowrap"><span class="sm:hidden">HSN 2026</span><span class="hidden sm:inline">Hari Santri Nasional · 2026</span></span>
    </header>

    <section class="content relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-5 py-6 sm:gap-7" aria-labelledby="headline">
      <div class="reveal h-px w-12 bg-[var(--hsn-accent-primary)]" aria-hidden="true"></div>
      <p class="reveal delay-1 eyebrow text-xs font-semibold uppercase text-[var(--hsn-accent-soft)]">Santri Menguatkan Negeri</p>
      <h1 id="headline" class="sr-only">Hari Santri Nasional 2026 PCNU Trenggalek</h1>
      <img
        class="logo block object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.18)]"
        :src="hsnLogo"
        alt="Logo Hari Santri 2026 - Santri Menguatkan Negeri, Menuju Indonesia Emas"
        width="3543"
        height="2032"
        fetchpriority="high"
      >

      <section class="overview reveal delay-2 w-full text-left" aria-labelledby="overview-title">
        <div class="overview-intro flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="overview-copy">
            <p class="eyebrow text-xs font-semibold uppercase text-[var(--hsn-accent-soft)]">Selayang pandang</p>
            <h2 id="overview-title" class="overview-title text-2xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-3xl">Ruang berprestasi dan berkhidmat.</h2>
            <p class="overview-description text-base text-[var(--hsn-text-secondary)]">
              Kenali rangkaian lomba Hari Santri Nasional 2026 di Trenggalek. Pilih panggungmu, lalu buka detail untuk jadwal dan informasi pendaftaran.
            </p>
          </div>
          <NuxtLink class="catalog-cta shrink-0" to="/kegiatan">
            Jelajahi semua kegiatan <span aria-hidden="true">↗</span>
          </NuxtLink>
        </div>

        <p v-if="pending" class="overview-state" role="status" aria-live="polite">Memuat informasi lomba...</p>
        <p v-else-if="error" class="overview-state" role="alert">Informasi lomba belum dapat dimuat. Silakan buka katalog kegiatan.</p>
        <p v-else-if="featuredActivities.length === 0" class="overview-state">Informasi lomba akan segera diumumkan. Pantau katalog kegiatan untuk pembaruan.</p>
        <ul v-else class="activity-list" aria-label="Sorotan lomba">
          <li v-for="(activity, index) in featuredActivities" :key="activity.id" class="activity-item">
            <NuxtLink class="activity-link" :to="`/kegiatan/${activity.slug}`">
              <span class="activity-index" aria-hidden="true">0{{ index + 1 }}</span>
              <span class="activity-copy">
                <span class="activity-meta">{{ formatIndonesiaDate(activity.startsAt) }} <span aria-hidden="true">·</span> {{ registrationLabel(activity.registrationState) }}</span>
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-organizer">{{ activity.organizer }} <span aria-hidden="true">·</span> {{ activity.location || 'Lokasi menyusul' }}</span>
              </span>
              <span class="activity-arrow" aria-hidden="true">↗</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </section>

    <footer class="reveal delay-3 flex w-full shrink-0 items-center justify-center gap-3 text-xs tracking-[.18em] text-[#b9cbc5]/60">
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
      <span>hsn.nutrenggalek.or.id</span>
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
    </footer>
  </main>
</template>

<style scoped>
:global(html) { color-scheme: dark; }
:global(body) { margin: 0; background: var(--hsn-surface-primary); color: var(--hsn-text-primary); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
:global(*) { box-sizing: border-box; }

.stage {
  isolation: isolate;
  overflow: hidden;
  background: radial-gradient(circle at 50% 20%, #124b4d 0%, #0a292b 34%, #071c1e 74%);
}

.stage::before {
  content: "";
  position: absolute;
  z-index: -1;
  width: min(82vw, 740px);
  aspect-ratio: 1;
  left: 50%;
  top: 20%;
  translate: -50% -50%;
  border: 1px solid rgba(244, 241, 233, .07);
  border-radius: 50%;
  box-shadow: 0 0 0 95px rgba(244, 241, 233, .02), 0 0 0 190px rgba(244, 241, 233, .015);
  pointer-events: none;
  animation: breathe 12s ease-in-out infinite;
}

.eyebrow { letter-spacing: .27em; }

.overview { max-width: 1050px; }
.overview-intro { margin-bottom: 16px; }
.overview-copy { display: grid; gap: 12px; }
.overview-title,
.overview-description { margin: 0; }
.overview-description { max-width: 540px; font-size: 17px; line-height: 1.55; }
.logo { width: min(78vw, 520px); max-height: 30svh; }

.catalog-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  gap: 8px;
  min-height: 44px;
  width: fit-content;
  max-width: 100%;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--hsn-accent-primary);
  color: var(--hsn-surface-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color .2s ease, border-color .2s ease, color .2s ease;
}

.catalog-cta:hover,
.catalog-cta:focus-visible {
  background: var(--hsn-accent-soft);
  color: var(--hsn-surface-primary);
}

.catalog-cta:focus-visible,
.activity-link:focus-visible {
  outline: 2px solid var(--hsn-accent-soft);
  outline-offset: 4px;
}

.overview-state {
  border-top: 1px solid var(--hsn-border-subtle);
  padding: 16px 0;
  color: var(--hsn-text-secondary);
  font-size: 15px;
  line-height: 1.5;
}

.activity-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  padding: 0;
  list-style: none;
}

.activity-item {
  min-width: 0;
  border: 1px solid var(--hsn-border-subtle);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(18, 75, 77, .58), rgba(7, 28, 30, .72));
  transition: background-color .2s ease, transform .2s ease;
}

.activity-item:hover {
  transform: translateY(-2px);
  background: linear-gradient(145deg, rgba(18, 75, 77, .82), rgba(7, 28, 30, .82));
}

.activity-link {
  display: grid;
  min-height: 136px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.activity-index {
  padding-top: 4px;
  color: var(--hsn-accent-soft);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
}

.activity-copy { display: grid; min-width: 0; gap: 12px; }
.activity-meta { color: var(--hsn-accent-soft); font-size: 15px; font-weight: 600; letter-spacing: .04em; line-height: 1.4; text-transform: uppercase; }
.activity-title { color: var(--hsn-text-primary); font-size: 18px; font-weight: 600; line-height: 1.35; }
.activity-organizer { color: var(--hsn-text-muted); font-size: 15px; line-height: 1.5; }
.activity-arrow { color: var(--hsn-text-muted); transition: color .2s ease, transform .2s ease; }
.activity-link:hover .activity-arrow { color: var(--hsn-accent-soft); transform: translate(2px, -2px); }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes logoReveal { from { opacity: 0; transform: translateY(20px) scale(.96); filter: blur(8px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
@keyframes breathe { 0%, 100% { opacity: .48; transform: translate(-50%, -50%) scale(1); } 50% { opacity: .8; transform: translate(-50%, -50%) scale(1.07); } }

.reveal { opacity: 0; animation: rise .8s cubic-bezier(.2, .75, .25, 1) forwards; }
.logo { animation: logoReveal 1.15s .15s cubic-bezier(.2, .75, .25, 1) both; }
.delay-1 { animation-delay: .2s; }
.delay-2 { animation-delay: .35s; }
.delay-3 { animation-delay: .5s; }

@media (max-width: 639px) {
  .stage { overflow: visible; }
  .activity-link { min-height: 0; }
}

@media (min-width: 640px) {
  .overview-intro { margin-bottom: 12px; }
  .logo { width: min(60vw, 520px); }
  .activity-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .activity-meta { font-size: 14px; }
  .catalog-cta { align-self: flex-end; }
}

@media (min-width: 1100px) {
  .activity-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .activity-item:hover, .activity-link:hover .activity-arrow { transform: none; }
}
</style>
