<script setup lang="ts">
import { computed } from 'vue'

type ActivityType = 'LOMBA' | 'EVENT'
type ActivityStatus = 'ALL' | ActivityType
type Activity = {
  id: number
  type: ActivityType
  title: string
  organizer: string | null
  slug: string
  description: string | null
  image: string | null
  location: string | null
  startsAt: string | null
  endsAt: string | null
  registrationState: string
}

const props = withDefaults(defineProps<{
  activities: Activity[]
  pending: boolean
  hasError: boolean
  heading: string
  eyebrow: string
  actionLabel: string
  actionTo: string
  showFilters?: boolean
  selectedType?: ActivityStatus
}>(), { showFilters: false, selectedType: 'ALL' })

const emit = defineEmits<{ 'update:selectedType': [type: ActivityStatus] }>()
const typeFilters: ActivityStatus[] = ['ALL', 'LOMBA', 'EVENT']
</script>

<template>
  <main class="timeline-page">
    <header class="timeline-header">
      <NuxtLink class="back-link" to="/" aria-label="Kembali ke halaman utama"><span aria-hidden="true">←</span>Kembali</NuxtLink>
      <p class="header-label">PCNU Trenggalek</p>
      <NuxtLink class="catalog-link" :to="actionTo">{{ actionLabel }} <span aria-hidden="true">↗</span></NuxtLink>
    </header>

    <section class="timeline-intro" aria-labelledby="catalog-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ eyebrow }}</p>
          <h1 id="catalog-title">{{ heading }}</h1>
        </div>
        <p class="intro-copy">Temukan lomba dan event Hari Santri Nasional 2026 di Trenggalek.</p>
      </div>

      <div class="catalog-controls">
        <span class="section-count">{{ activities.length }} kegiatan</span>
        <div v-if="showFilters" class="agenda-filters" aria-label="Filter jenis kegiatan">
          <button v-for="type in typeFilters" :key="type" class="filter-button" :class="{ 'is-selected': selectedType === type }" type="button" :aria-pressed="selectedType === type" @click="emit('update:selectedType', type)">
            {{ type === 'ALL' ? 'Semua' : type }}
          </button>
        </div>
      </div>

      <p v-if="pending" class="timeline-note" role="status" aria-live="polite">Memuat agenda dari katalog kegiatan...</p>
      <p v-else-if="hasError" class="timeline-note" role="alert">Agenda belum dapat dimuat. Silakan coba lagi.</p>
      <p v-else-if="activities.length === 0" class="timeline-note">Belum ada kegiatan yang dipublikasikan.</p>

      <ActivityRoadmap v-else :activities="activities" />
    </section>

    <footer class="timeline-footer"><span>hsn.nutrenggalek.or.id</span><span>Hari Santri Nasional 2026</span></footer>
  </main>
</template>

<style scoped>
:global(html) { color-scheme: dark; }
:global(body) { margin: 0; background: #071c1e; color: #f4f1e9; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
:global(*) { box-sizing: border-box; }

.timeline-page {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  padding: 28px clamp(20px, 5vw, 76px) 32px;
  background: radial-gradient(circle at 80% 16%, rgba(26, 105, 99, .34), transparent 30rem), linear-gradient(135deg, #071c1e 0%, #0a292b 52%, #071c1e 100%);
}

.timeline-page::before,
.timeline-page::after { content: ''; position: absolute; z-index: -1; border: 1px solid rgba(244, 241, 233, .075); border-radius: 50%; pointer-events: none; }
.timeline-page::before { width: min(78vw, 900px); aspect-ratio: 1; top: 9rem; right: -26rem; }
.timeline-page::after { width: min(52vw, 620px); aspect-ratio: 1; top: 18rem; right: -13rem; }
.timeline-header, .timeline-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 10px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }
.timeline-header { max-width: 1200px; margin: 0 auto; color: rgba(214, 228, 222, .72); }
.back-link, .catalog-link { display: inline-flex; align-items: center; min-height: 44px; color: #f1b949; text-decoration: none; }
.back-link span { margin-right: 7px; font-size: 16px; line-height: 0; transition: transform .25s ease; }
.back-link:hover span { transform: translateX(-4px); }
.catalog-link { gap: 7px; color: #f4f1e9; transition: color .2s ease; }
.catalog-link:hover, .catalog-link:focus-visible, .agenda-title-link:hover, .agenda-title-link:focus-visible { color: #e9b74f; }
.back-link:focus-visible, .catalog-link:focus-visible, .agenda-title-link:focus-visible, .agenda-detail:focus-visible, .filter-button:focus-visible { outline: 2px solid #e9b74f; outline-offset: 4px; border-radius: 3px; }
.timeline-intro { max-width: 1000px; margin: 0 auto; padding: clamp(90px, 14vh, 170px) 0 110px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; padding-bottom: 22px; border-bottom: 1px solid rgba(244, 241, 233, .16); }
.eyebrow { margin: 0; color: #e9b74f; font-size: 10px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; }
.section-heading h1 { margin: 10px 0 0; color: #f4f1e9; font-size: clamp(1.7rem, 3vw, 2.5rem); font-weight: 400; letter-spacing: -.045em; }
.intro-copy { max-width: 360px; margin: 0 0 3px; color: rgba(203, 217, 212, .7); font-size: 13px; line-height: 1.65; }
.catalog-controls { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-top: 16px; }
.section-count { color: rgba(203, 217, 212, .78); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
.agenda-filters { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-button { min-height: 36px; padding: 0 13px; border: 1px solid rgba(244, 241, 233, .16); border-radius: 999px; background: rgba(4, 31, 32, .28); color: rgba(203, 217, 212, .78); font: inherit; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
.filter-button:hover, .filter-button.is-selected { border-color: rgba(233, 165, 30, .55); background: rgba(233, 165, 30, .12); color: #f4f1e9; }
.timeline-note { margin: 20px 0 0; color: rgba(203, 217, 212, .72); font-size: 13px; }
.roadmap { position: relative; padding: 26px 0 42px; }
.roadmap::before { content: ''; position: absolute; top: 27px; bottom: 42px; left: 26px; width: 1px; background: linear-gradient(to bottom, #e9a51e, rgba(203, 217, 212, .2) 62%, rgba(203, 217, 212, .03)); }
.roadmap-group { position: relative; display: grid; grid-template-columns: 54px 1fr; gap: 28px; }
.roadmap-marker { position: relative; z-index: 1; display: flex; width: 54px; justify-content: center; align-items: flex-start; }
.roadmap-marker span { display: grid; width: 54px; height: 54px; place-items: center; border: 1px solid rgba(233, 165, 30, .7); border-radius: 50%; background: #0a292b; color: #e9b74f; font-size: 11px; letter-spacing: .12em; }
.roadmap-group__body { min-width: 0; padding-bottom: 38px; }
.roadmap-date { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding: 5px 0 16px; border-bottom: 1px solid rgba(233, 165, 30, .35); }
.roadmap-date time { color: #f4f1e9; font-size: clamp(1.15rem, 2vw, 1.55rem); font-weight: 400; letter-spacing: -.035em; }
.roadmap-date span { color: rgba(203, 217, 212, .68); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
.roadmap-events { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 16px 0 0; padding: 0; list-style: none; }
.roadmap-event { position: relative; min-width: 0; min-height: 178px; padding: 19px 20px 20px; overflow: hidden; isolation: isolate; border: 1px solid rgba(244, 241, 233, .12); border-radius: 3px; background: rgba(4, 31, 32, .38); transition: border-color .2s ease, background-color .2s ease, transform .2s ease; }
.roadmap-event:hover { border-color: rgba(233, 165, 30, .52); background: rgba(4, 31, 32, .62); transform: translateY(-2px); }
.roadmap-event > :not(.roadmap-event__media) { position: relative; z-index: 1; }
.roadmap-event__media { position: absolute; z-index: 0; inset: 0; overflow: hidden; opacity: .48; background: #0a292b; pointer-events: none; }
.roadmap-event__media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom right, #071c1e 0%, rgba(7, 28, 30, .9) 32%, rgba(7, 28, 30, .28) 72%, rgba(7, 28, 30, .08) 100%); }
.roadmap-event__media img { display: block; width: 50%; height: 100%; margin-left: auto; object-fit: cover; object-position: center; -webkit-mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%); mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.roadmap-event__topline { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 19px; }
.agenda-time { color: rgba(244, 241, 233, .86); font-size: 10px; letter-spacing: .1em; text-align: right; text-transform: uppercase; }
.roadmap-event h2 { margin: 0 0 9px; color: #f4f1e9; font-size: clamp(1.05rem, 2vw, 1.35rem); font-weight: 400; letter-spacing: -.035em; }
.agenda-title-link { display: block; color: inherit; text-decoration: none; }
.roadmap-event p { display: -webkit-box; min-height: 44px; margin: 0; overflow: hidden; color: rgba(203, 217, 212, .67); font-size: 12px; line-height: 1.6; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.agenda-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.agenda-location { color: rgba(233, 183, 79, .78); font-size: 10px; letter-spacing: .12em; line-height: 1.5; text-transform: uppercase; }
.agenda-state { color: rgba(203, 217, 212, .72); font-size: 10px; }
.agenda-detail { flex: 0 0 auto; color: #e9b74f; font-size: 10px; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }
.agenda-status { color: #e9b74f; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; }
.agenda-status.is-teal { color: #8dc7bd; }
.agenda-status.is-gold { color: #e9b74f; }
.timeline-footer { max-width: 1000px; margin: 12px auto 0; padding-top: 20px; border-top: 1px solid rgba(244, 241, 233, .12); color: rgba(203, 217, 212, .76); font-weight: 400; }

@media (max-width: 640px) {
  .timeline-page { padding: 22px 20px 26px; }
  .timeline-intro { padding: 92px 0 78px; }
  .section-heading { align-items: start; flex-direction: column; gap: 16px; }
  .intro-copy { max-width: none; }
  .catalog-controls { align-items: flex-start; flex-direction: column; }
  .roadmap { padding-top: 24px; }
  .roadmap::before { left: 20px; }
  .roadmap-group { grid-template-columns: 42px minmax(0, 1fr); gap: 18px; }
  .roadmap-marker { width: 42px; }
  .roadmap-marker span { width: 42px; height: 42px; font-size: 10px; }
  .roadmap-date { align-items: flex-start; flex-direction: column; gap: 7px; }
  .roadmap-events { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .roadmap-event { min-height: 0; padding: 17px 16px 18px; }
  .roadmap-event p { min-height: 0; }
  .timeline-footer { align-items: flex-start; flex-direction: column; gap: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
</style>
