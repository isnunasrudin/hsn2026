<script setup lang="ts">
import hsnLogo from '~/assets/images/hsn2026.webp'
import { formatIndonesiaDateTimeRange } from '~/utils/date'

type Activity = {
  id: number
  title: string
  slug: string
  type: 'LOMBA' | 'EVENT'
  organizer: string | null
  description: string | null
  image: string | null
  imageZoom: number
  imagePosition: string
  location: string | null
  startsAt: string | null
  endsAt: string | null
  registrationState: string
}

const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities', {
  query: { type: 'LOMBA' }
})

const featuredActivities = computed(() => (data.value?.activities ?? []).slice(0, 3))
const featuredIndex = (activity: Activity): number => featuredActivities.value.findIndex(item => item.id === activity.id) + 1
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
    <header
      class="reveal flex w-full shrink-0 items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[.18em] text-[#d6e4de]/70">
      <span>PCNU Trenggalek</span>
      <span class="whitespace-nowrap"><span class="sm:hidden">HSN 2026</span><span class="hidden sm:inline">Hari Santri
          Nasional · 2026</span></span>
    </header>

    <section
      class="content relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-5 py-6 sm:gap-7"
      aria-labelledby="headline">
      <div class="reveal h-px w-12 bg-[var(--hsn-accent-primary)]" aria-hidden="true"></div>
      <p class="reveal delay-1 eyebrow text-xs font-semibold uppercase text-[var(--hsn-accent-soft)]">Santri Menguatkan
        Negeri</p>
      <h1 id="headline" class="sr-only">Hari Santri Nasional 2026 PCNU Trenggalek</h1>
      <img class="logo block object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.18)]" :src="hsnLogo"
        alt="Logo Hari Santri 2026 - Santri Menguatkan Negeri, Menuju Indonesia Emas" width="3543" height="2032"
        fetchpriority="high">

      <section class="overview reveal delay-2 w-full text-left" aria-labelledby="overview-title">
        <div class="overview-intro flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-5">
          <div class="overview-copy">
            <p class="eyebrow text-xs font-semibold uppercase text-[var(--hsn-accent-soft)]">Selayang pandang</p>
            <h2 id="overview-title"
              class="overview-title text-2xl font-semibold tracking-[-.035em] text-[var(--hsn-text-primary)] sm:text-3xl">
              Kegiatan Hari Santri 2026 PCNU Trenggalek</h2>
          </div>
          <NuxtLink class="catalog-cta shrink-0" to="/kegiatan">
            Jelajahi semua kegiatan <span aria-hidden="true">↗</span>
          </NuxtLink>
        </div>

        <p v-if="pending" class="overview-state" role="status" aria-live="polite">Memuat informasi lomba...</p>
        <p v-else-if="error" class="overview-state" role="alert">Informasi lomba belum dapat dimuat. Silakan buka
          katalog kegiatan.</p>
        <p v-else-if="featuredActivities.length === 0" class="overview-state">Informasi lomba akan segera diumumkan.
          Pantau katalog kegiatan untuk pembaruan.</p>
        <ul v-else class="activity-list" aria-label="Sorotan lomba">
          <li v-for="activity in featuredActivities" :key="activity.id" class="activity-item"
            :class="{ 'has-image': activity.image }">
            <div v-if="activity.image" class="activity-media" aria-hidden="true">
              <img :src="activity.image" alt="" :style="{
                '--image-zoom': activity.imageZoom || 1,
                '--image-position': activity.imagePosition || 'center'
              }" loading="lazy" width="960" height="540">
            </div>
            <NuxtLink class="activity-link" :to="`/kegiatan/${activity.slug}`">
              <span class="activity-topline">
                <span class="activity-time">{{ formatIndonesiaDateTimeRange(activity.startsAt, activity.endsAt)
                  }}</span>
              </span>
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description">{{ activity.description || 'Detail kegiatan akan diumumkan.' }}</p>
              <span class="activity-footer">
                <span class="activity-location">{{ activity.location || 'Lokasi menyusul' }} <span
                    aria-hidden="true">·</span> {{ registrationLabel(activity.registrationState) }}</span>
                <span class="activity-detail">Detail <span aria-hidden="true">↗</span></span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </section>

    <footer
      class="reveal delay-3 flex w-full shrink-0 items-center justify-center gap-3 text-xs tracking-[.18em] text-[#b9cbc5]/60">
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
      <span>hsn.nutrenggalek.or.id</span>
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
    </footer>
  </main>
</template>

<style scoped>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background: var(--hsn-surface-primary);
  color: var(--hsn-text-primary);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

:global(*) {
  box-sizing: border-box;
}

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

.eyebrow {
  letter-spacing: .27em;
}

.overview {
  max-width: 1050px;
}

.overview-intro {
  margin-bottom: 16px;
}

.overview-copy {
  display: grid;
  gap: 12px;
}

.overview-title,
.overview-description {
  margin: 0;
}

.overview-description {
  max-width: 540px;
  font-size: 17px;
  line-height: 1.55;
}

.logo {
  width: min(78vw, 520px);
  max-height: 30svh;
}

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
  margin: 0;
  padding: 0;
  list-style: none;
}

.activity-item {
  position: relative;
  min-width: 0;
  min-height: 178px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(244, 241, 233, .12);
  border-radius: 3px;
  background: rgba(4, 31, 32, .38);
  transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
}

.activity-item:hover {
  border-color: rgba(233, 165, 30, .52);
  background: rgba(4, 31, 32, .62);
  transform: translateY(-2px);
}

.activity-media {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  opacity: .48;
  background: #0a292b;
  pointer-events: none;
}

.activity-media::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, #071c1e 0%, rgba(7, 28, 30, .9) 32%, rgba(7, 28, 30, .28) 72%, rgba(7, 28, 30, .08) 100%);
}

.activity-media img {
  display: block;
  width: 50%;
  height: 100%;
  margin-left: auto;
  object-fit: cover;
  object-position: var(--image-position, right center);
  transform: scale(var(--image-zoom, 1));
  transform-origin: var(--image-position, right center);
  -webkit-mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%);
  mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%);
}

.activity-link>* {
  position: relative;
  z-index: 1;
}

.activity-link {
  display: grid;
  min-height: 178px;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  padding: 19px 20px 20px;
  color: var(--hsn-text-primary);
  text-decoration: none;
}

.activity-link:focus-visible {
  outline-offset: -4px;
}

.activity-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 19px;
}

.activity-time {
  color: rgba(244, 241, 233, .86);
  font-size: 10px;
  letter-spacing: .1em;
  text-align: right;
  text-transform: uppercase;
}

.activity-title {
  margin: 0 0 9px;
  color: var(--hsn-text-primary);
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  font-weight: 400;
  letter-spacing: -.035em;
  line-height: 1.35;
}

.activity-description {
  display: -webkit-box;
  min-height: 44px;
  margin: 0;
  overflow: hidden;
  color: rgba(203, 217, 212, .75);
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.activity-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.activity-location {
  color: rgba(233, 183, 79, .78);
  font-size: 10px;
  letter-spacing: .12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.activity-detail {
  color: #e9b74f;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  transition: transform .2s ease;
}

.activity-link:hover .activity-detail {
  transform: translate(2px, -2px);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoReveal {
  from {
    opacity: 0;
    transform: translateY(20px) scale(.96);
    filter: blur(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes breathe {

  0%,
  100% {
    opacity: .48;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: .8;
    transform: translate(-50%, -50%) scale(1.07);
  }
}

.reveal {
  opacity: 0;
  animation: rise .8s cubic-bezier(.2, .75, .25, 1) forwards;
}

.logo {
  animation: logoReveal 1.15s .15s cubic-bezier(.2, .75, .25, 1) both;
}

.delay-1 {
  animation-delay: .2s;
}

.delay-2 {
  animation-delay: .35s;
}

.delay-3 {
  animation-delay: .5s;
}

@media (max-width: 639px) {
  .stage {
    overflow: visible;
  }

  .activity-item,
  .activity-link {
    min-height: 0;
  }

  .activity-item {
    padding: 0;
  }

  .activity-link {
    padding: 17px 16px 18px;
  }

  .activity-description {
    min-height: 0;
  }
}

@media (min-width: 640px) {
  .overview-intro {
    margin-bottom: 12px;
  }

  .logo {
    width: min(60vw, 520px);
  }

  .activity-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .catalog-cta {
    align-self: flex-end;
  }
}

@media (min-width: 1100px) {
  .activity-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }

  .activity-item:hover,
  .activity-link:hover .activity-detail {
    transform: none;
  }
}
</style>
