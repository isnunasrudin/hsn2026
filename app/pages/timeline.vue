<template>
  <main class="timeline-page">
    <div class="timeline-page__halo" aria-hidden="true"></div>

    <header class="timeline-header">
      <NuxtLink class="back-link" to="/" aria-label="Kembali ke halaman utama">
        <span aria-hidden="true">←</span>
        Kembali
      </NuxtLink>
      <p class="header-label">PCNU Trenggalek</p>
      <NuxtLink class="catalog-link" to="/kegiatan">Katalog kegiatan <span aria-hidden="true">↗</span></NuxtLink>
    </header>

    <section class="timeline-intro" aria-labelledby="agenda-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Kalender kegiatan</p>
          <h2 id="agenda-title">Rangkaian agenda</h2>
        </div>
        <span class="section-count">{{ String(timelineItems.length).padStart(2, '0') }} agenda</span>
      </div>

      <p v-if="pending" class="timeline-note">Memuat agenda dari katalog kegiatan...</p>
      <p v-else-if="error" class="timeline-note">Agenda belum dapat dimuat. Silakan coba lagi.</p>

      <div class="roadmap" aria-label="Roadmap kegiatan Hari Santri Nasional 2026">
        <section v-for="(group, groupIndex) in timelineGroups" :key="group.key" class="roadmap-group">
          <div class="roadmap-marker" aria-hidden="true">
            <span>{{ String(groupIndex + 1).padStart(2, '0') }}</span>
          </div>
          <div class="roadmap-group__body">
            <div class="roadmap-date">
              <time :datetime="group.datetime || undefined">{{ group.date }}</time>
              <span>{{ group.items.length }} kegiatan</span>
            </div>
            <ol class="roadmap-events">
              <li v-for="item in group.items" :key="`${group.key}-${item.title}`" class="roadmap-event"
                :class="{ 'has-image': item.image }">
                <div v-if="item.image" class="roadmap-event__media">
                  <img
                    :src="item.image"
                    :alt="`Dokumentasi ${item.title}`"
                    :style="{
                      '--image-zoom': item.imageZoom || 1,
                      '--image-position': item.imagePosition || 'center'
                    }"
                    loading="lazy"
                    width="960"
                    height="540"
                  >
                </div>
                <div class="roadmap-event__topline">
                  <span class="agenda-status" :class="`is-${item.tone}`">{{ item.pj }}</span>
                  <span class="agenda-time">{{ item.time || 'Waktu menyusul' }}</span>
                </div>
                <NuxtLink v-if="item.slug" class="agenda-title-link" :to="`/kegiatan/${item.slug}`">
                  <h3>{{ item.title }}</h3>
                </NuxtLink>
                <h3 v-else>{{ item.title }}</h3>
                <p>{{ item.description || 'Detail kegiatan akan diumumkan.' }}</p>
                <div class="agenda-footer">
                  <span class="agenda-location">{{ item.location }}</span>
                  <span class="agenda-detail">Detail <span aria-hidden="true">↗</span></span>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </section>

    <footer class="timeline-footer">
      <span>hsn.nutrenggalek.or.id</span>
      <span>Hari Santri Nasional 2026</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatIndonesiaDate, formatIndonesiaTimeRange, getIndonesiaDateKey } from '~/utils/date'

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  ],
  meta: [
    { name: 'theme-color', content: '#071c1e' },
    { name: 'description', content: 'Timeline kegiatan Hari Santri Nasional 2026 PCNU Trenggalek.' }
  ],
  title: 'Timeline Kegiatan - Hari Santri 2026'
})

type PublicActivity = {
  type: 'LOMBA' | 'EVENT'
  title: string
  organizer: string | null
  slug: string
  description: string | null
  image: string | null
  imageZoom: number
  imagePosition: string
  location: string | null
  startsAt: string | null
  endsAt: string | null
}

const { data: activitiesData, pending, error } = await useFetch<{ activities: PublicActivity[] }>('/api/public/activities')
const timelineItems = computed(() => {
  const activities = activitiesData.value?.activities ?? []
  return activities.map(activity => ({
    ...activity,
    date: formatIndonesiaDate(activity.startsAt) || 'Jadwal belum ditentukan',
    datetime: activity.startsAt ? getIndonesiaDateKey(activity.startsAt) : null,
    time: formatIndonesiaTimeRange(activity.startsAt, activity.endsAt),
    pj: activity.organizer || activity.type,
    tone: activity.type === 'LOMBA' ? 'teal' : 'gold'
  }))
})

const timelineGroups = computed(() => {
  const groups = new Map<string, { key: string; date: string; datetime: string | null; items: typeof timelineItems.value }>()
  for (const item of timelineItems.value) {
    const key = item.datetime ?? 'undated'
    const group = groups.get(key)
    if (group) group.items.push(item)
    else groups.set(key, { key, date: item.date, datetime: item.datetime, items: [item] })
  }
  return [...groups.values()]
})
</script>

<style scoped>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background: #071c1e;
  color: #f4f1e9;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

:global(*) {
  box-sizing: border-box;
}

.timeline-page {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  padding: 28px clamp(20px, 5vw, 76px) 32px;
  background:
    radial-gradient(circle at 80% 16%, rgba(26, 105, 99, .34), transparent 30rem),
    linear-gradient(135deg, #071c1e 0%, #0a292b 52%, #071c1e 100%);
}

.timeline-page::before,
.timeline-page::after {
  content: "";
  position: absolute;
  z-index: -1;
  border: 1px solid rgba(244, 241, 233, .075);
  border-radius: 50%;
  pointer-events: none;
}

.timeline-page::before {
  width: min(78vw, 900px);
  aspect-ratio: 1;
  top: 9rem;
  right: -26rem;
}

.timeline-page::after {
  width: min(52vw, 620px);
  aspect-ratio: 1;
  top: 18rem;
  right: -13rem;
}

.timeline-page__halo {
  position: absolute;
  z-index: -1;
  width: 22rem;
  height: 22rem;
  top: -11rem;
  left: 7%;
  border-radius: 50%;
  background: rgba(233, 165, 30, .08);
  filter: blur(50px);
  pointer-events: none;
}

.timeline-header,
.timeline-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.timeline-header {
  max-width: 1200px;
  margin: 0 auto;
  color: rgba(214, 228, 222, .72);
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: #f1b949;
  text-decoration: none;
}

.back-link:focus-visible {
  outline: 2px solid #e9b74f;
  outline-offset: 5px;
  border-radius: 3px;
}

.back-link span {
  display: inline-block;
  margin-right: 7px;
  font-size: 16px;
  line-height: 0;
  transition: transform .25s ease;
}

.catalog-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  color: #f4f1e9;
  text-decoration: none;
  transition: color .2s ease;
}

.catalog-link:hover,
.catalog-link:focus-visible,
.agenda-title-link:hover,
.agenda-title-link:focus-visible {
  color: #e9b74f;
}

.catalog-link:focus-visible,
.agenda-title-link:focus-visible {
  outline: 2px solid #e9b74f;
  outline-offset: 5px;
  border-radius: 3px;
}

.timeline-note {
  margin: 20px 0 0;
  color: rgba(203, 217, 212, .72);
  font-size: 13px;
}

.back-link:hover span {
  transform: translateX(-4px);
}

.header-mark {
  color: rgba(203, 217, 212, .48);
}

.timeline-intro,
.timeline-section {
  max-width: 1000px;
  margin-inline: auto;
}

.timeline-intro {
  padding: clamp(90px, 14vh, 170px) 0 110px;
}

.eyebrow {
  margin: 0;
  color: #e9b74f;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .28em;
  text-transform: uppercase;
}

.timeline-intro h1 {
  max-width: 760px;
  margin: 18px 0 22px;
  color: #f6f3e9;
  font-size: clamp(3.2rem, 8vw, 7.5rem);
  font-weight: 300;
  letter-spacing: -.075em;
  line-height: .92;
}

.timeline-intro h1 em {
  color: #e9b74f;
  font-style: normal;
}

.timeline-intro__copy {
  max-width: 440px;
  margin: 0;
  color: rgba(203, 217, 212, .7);
  font-size: 15px;
  line-height: 1.75;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(244, 241, 233, .16);
}

.section-heading h2 {
  margin: 10px 0 0;
  color: #f4f1e9;
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -.045em;
}

.section-count {
  padding-bottom: 5px;
  color: rgba(203, 217, 212, .78);
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.roadmap {
  position: relative;
  padding: 26px 0 42px;
}

.roadmap::before {
  content: "";
  position: absolute;
  top: 27px;
  bottom: 42px;
  left: 26px;
  width: 1px;
  background: linear-gradient(to bottom, #e9a51e, rgba(203, 217, 212, .2) 62%, rgba(203, 217, 212, .03));
}

.roadmap-group {
  position: relative;
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 28px;
}

.roadmap-marker {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 54px;
}

.roadmap-marker span {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid rgba(233, 165, 30, .7);
  border-radius: 50%;
  background: #0a292b;
  color: #e9b74f;
  font-size: 11px;
  letter-spacing: .12em;
}

.roadmap-group__body {
  padding-bottom: 38px;
}

.roadmap-date {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  padding: 5px 0 16px;
  border-bottom: 1px solid rgba(233, 165, 30, .35);
}

.roadmap-date time {
  color: #f4f1e9;
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  font-weight: 400;
  letter-spacing: -.035em;
}

.roadmap-date span {
  color: rgba(203, 217, 212, .68);
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.roadmap-events {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.roadmap-event {
  position: relative;
  min-height: 178px;
  padding: 19px 20px 20px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(244, 241, 233, .12);
  border-radius: 3px;
  background: rgba(4, 31, 32, .38);
  transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
}

.roadmap-event:hover {
  border-color: rgba(233, 165, 30, .52);
  background: rgba(4, 31, 32, .62);
  transform: translateY(-2px);
}

.roadmap-event> :not(.roadmap-event__media) {
  position: relative;
  z-index: 1;
}

.roadmap-event__media {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  opacity: .48;
  background: #0a292b;
  pointer-events: none;
}

.roadmap-event__media::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, #071c1e 0%, rgba(7, 28, 30, .9) 32%, rgba(7, 28, 30, .28) 72%, rgba(7, 28, 30, .08) 100%);
}

.roadmap-event__media img {
  display: block;
  width: 50%;
  margin-left: auto;
  height: 100%;
  object-fit: cover;
  object-position: var(--image-position, right center);
  transform: scale(var(--image-zoom, 1));
  transform-origin: var(--image-position, right center);
  -webkit-mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%);
  mask-image: linear-gradient(100deg, transparent 0%, rgba(0, 0, 0, .18) 30%, rgba(0, 0, 0, .72) 50%, #000 100%);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.roadmap-event__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 19px;
}

.agenda-time {
  color: rgba(244, 241, 233, .86);
  font-size: 10px;
  letter-spacing: .1em;
  text-align: right;
  text-transform: uppercase;
}

.roadmap-event h3 {
  margin: 0 0 9px;
  color: #f4f1e9;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  font-weight: 400;
  letter-spacing: -.035em;
}

.agenda-title-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.roadmap-event p {
  min-height: 44px;
  margin: 0;
  color: rgba(203, 217, 212, .67);
  font-size: 12px;
  line-height: 1.6;
}

.agenda-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.agenda-detail {
  color: #e9b74f;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.agenda-location {
  display: block;
  margin-top: 16px;
  color: rgba(233, 183, 79, .78);
  font-size: 10px;
  letter-spacing: .12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.agenda-status {
  color: #e9b74f;
  font-size: 10px;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.agenda-status.is-teal {
  color: #8dc7bd;
}

.agenda-status.is-cream {
  color: #f4f1e9;
}

.agenda-location {
  color: rgba(233, 183, 79, .78);
  font-size: 10px;
  letter-spacing: .12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.timeline-footer {
  max-width: 1000px;
  margin: 12px auto 0;
  padding-top: 20px;
  border-top: 1px solid rgba(244, 241, 233, .12);
  color: rgba(203, 217, 212, .76);
  font-weight: 400;
}

@media (max-width: 640px) {
  .timeline-page {
    padding: 22px 20px 26px;
  }

  .header-mark {
    display: none;
  }

  .timeline-intro {
    padding: 92px 0 78px;
  }

  .timeline-intro h1 {
    font-size: clamp(3rem, 16vw, 5rem);
  }

  .timeline-intro__copy {
    font-size: 14px;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 16px;
  }

  .roadmap {
    padding-top: 24px;
  }

  .roadmap::before {
    left: 20px;
  }

  .roadmap-group {
    grid-template-columns: 42px 1fr;
    gap: 18px;
  }

  .roadmap-marker {
    width: 42px;
  }

  .roadmap-marker span {
    width: 42px;
    height: 42px;
    font-size: 10px;
  }

  .roadmap-date {
    align-items: start;
    flex-direction: column;
    gap: 7px;
  }

  .roadmap-events {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .roadmap-event {
    min-height: 0;
    padding: 17px 16px 18px;
  }

  .roadmap-event p {
    min-height: 0;
  }

  .timeline-footer {
    align-items: start;
    flex-direction: column;
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
