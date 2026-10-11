<script setup lang="ts">
import hsnLogo from '~/assets/images/hsn2026.webp'
import { formatIndonesiaDate, formatIndonesiaTimeRange, getIndonesiaDateKey } from '~/utils/date'

type Activity = {
  id: number
  title: string
  slug: string
  type: 'LOMBA' | 'EVENT'
  organizer: string | null
  description: string | null
  image: string | null
  location: string | null
  startsAt: string | null
  endsAt: string | null
  registrationState: string
}
type ActivityFilter = 'ALL' | 'EVENT' | 'LOMBA'
const activityFilters: { value: ActivityFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'EVENT', label: 'Kegiatan' },
  { value: 'LOMBA', label: 'Lomba' }
]

const { data, pending, error } = await useFetch<{ activities: Activity[] }>('/api/public/activities')
const currentTime = useState('landing-current-time', () => new Date().toISOString())
let clockInterval: ReturnType<typeof setInterval> | undefined

const publicActivities = computed(() => data.value?.activities ?? [])
const activitySearch = ref('')
const activityFilter = ref<ActivityFilter>('ALL')
const activitiesByTime = (activities: Activity[]): Activity[] => [...activities].sort((a, b) => {
  const aStart = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY
  const bStart = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY
  return aStart - bStart
})
const notPassedActivities = computed(() => {
  const now = new Date(currentTime.value).getTime()
  return activitiesByTime(publicActivities.value.filter((activity) => {
    if (!activity.startsAt) return true
    const end = activity.endsAt ? new Date(activity.endsAt).getTime() : new Date(activity.startsAt).getTime()
    return end >= now
  }))
})
const visibleActivities = computed(() => {
  const query = activitySearch.value.trim().toLocaleLowerCase('id-ID')
  const source = query ? publicActivities.value : notPassedActivities.value
  return activitiesByTime(source.filter((activity) => {
    const matchesType = activityFilter.value === 'ALL' || activity.type === activityFilter.value
    const matchesSearch = !query || `${activity.title} ${activity.description ?? ''}`.toLocaleLowerCase('id-ID').includes(query)
    return matchesType && matchesSearch
  }))
})
const todayKey = computed(() => getIndonesiaDateKey(currentTime.value))
const todayActivities = computed(() => publicActivities.value.filter((activity) => {
  if (!activity.startsAt) return false
  const startDate = getIndonesiaDateKey(activity.startsAt)
  const endDate = activity.endsAt ? getIndonesiaDateKey(activity.endsAt) : startDate
  return startDate <= todayKey.value && endDate >= todayKey.value
}).sort((a, b) => new Date(a.startsAt ?? '').getTime() - new Date(b.startsAt ?? '').getTime()))
const isCurrentlyOngoing = (activity: Activity): boolean => {
  if (!activity.startsAt) return false
  const now = new Date(currentTime.value).getTime()
  return new Date(activity.startsAt).getTime() <= now
    && (activity.endsAt ? new Date(activity.endsAt).getTime() >= now : getIndonesiaDateKey(activity.startsAt) === todayKey.value)
}
const hasOngoingActivities = computed(() => todayActivities.value.some(isCurrentlyOngoing))
const currentDateLabel = computed(() => formatIndonesiaDate(currentTime.value))
onMounted(() => {
  clockInterval = setInterval(() => { currentTime.value = new Date().toISOString() }, 30_000)
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})

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

    <section class="content relative mx-auto grid w-full max-w-6xl flex-1 content-center gap-8 py-8 sm:gap-10 sm:py-10"
      aria-labelledby="headline">
      <div class="today-layout">
        <div class="brand-lockup">
          <h1 id="headline" class="sr-only">Hari Santri Nasional 2026 PCNU Trenggalek</h1>
          <img class="logo block object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.18)]" :src="hsnLogo"
            alt="Logo Hari Santri 2026 - Santri Menguatkan Negeri, Menuju Indonesia Emas" width="3543" height="2032"
            fetchpriority="high">
        </div>

        <section v-if="todayActivities?.length > 0" class="today-section text-left" aria-labelledby="today-title"
          aria-live="polite">
          <div class="today-heading">
            <div class="today-heading__title my-auto">
              <h2 id="today-title" class="today-title eyebrow">Agenda Hari Ini</h2>
              <span v-if="hasOngoingActivities" class="today-live is-active"><span class="today-live__dot"
                  aria-hidden="true"></span>Sedang berlangsung</span>
            </div>
            <time class="today-date" :datetime="todayKey">{{ currentDateLabel }}</time>
          </div>
          <ul class="today-list">
            <li v-for="(activity, index) in todayActivities" :key="activity.id" class="today-item"
              :style="{ '--item-index': index }">
              <NuxtLink class="today-item__link" :to="`/kegiatan/${activity.slug}`">
                <h3>{{ activity.title }}</h3>
                <p v-if="activity.description">{{ activity.description }}</p>
              </NuxtLink>
              <div class="today-item__footer">
                <span v-if="activity.location">{{ activity.location }}</span>
                <span v-if="activity.startsAt">{{ formatIndonesiaTimeRange(activity.startsAt, activity.endsAt) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <section id="activities" class="overview reveal delay-2 w-full text-left" aria-labelledby="overview-title">
        <div class="overview-intro pb-5">
          <div class="overview-copy">
            <h2 id="overview-title" class="sr-only">Cari kegiatan Hari Santri 2026</h2>
            <div class="activity-search">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" stroke-width="1.7" />
                <path d="m16 16 4.2 4.2" stroke="currentColor" stroke-linecap="round" stroke-width="1.7" />
              </svg>
              <input id="activity-search" v-model="activitySearch" type="search"
                placeholder="Cari kegiatan berdasarkan judul atau deskripsi..."
                aria-label="Cari kegiatan berdasarkan judul atau deskripsi">
            </div>
          </div>
          <div class="activity-filters" role="group" aria-label="Filter jenis kegiatan">
            <button v-for="filter in activityFilters" :key="filter.value" class="activity-filter"
              :class="{ 'is-active': activityFilter === filter.value }" type="button"
              :aria-pressed="activityFilter === filter.value" @click="activityFilter = filter.value">
              {{ filter.label }}
            </button>
          </div>
        </div>

        <p v-if="pending" class="overview-state" role="status" aria-live="polite">Memuat informasi kegiatan...</p>
        <p v-else-if="error" class="overview-state" role="alert">Informasi kegiatan belum dapat dimuat.</p>
        <p v-else-if="(activitySearch.trim() || activityFilter !== 'ALL') && visibleActivities.length === 0"
          class="overview-state" role="status">
          Tidak ada kegiatan yang sesuai dengan pencarian dan filter.</p>
        <p v-else-if="!activitySearch.trim() && visibleActivities.length === 0" class="overview-state">Belum ada
          kegiatan mendatang yang dijadwalkan.</p>
        <p v-if="!pending && !error && (activitySearch.trim() || activityFilter !== 'ALL') && visibleActivities.length"
          class="search-results" role="status" aria-live="polite">{{ visibleActivities.length }} kegiatan ditampilkan.
        </p>
        <ActivityRoadmap v-if="!pending && !error && visibleActivities.length" :activities="visibleActivities"
          title-tag="h3" />
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
  overflow: visible;
  background: radial-gradient(circle at 50% 20%, #124b4d 0%, #0a292b 34%, #071c1e 74%);
  background-attachment: fixed;
  background-size: cover;
}

.stage::before {
  content: "";
  position: fixed;
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
  justify-self: center;
}

.today-layout {
  display: grid;
  width: 100%;
  gap: 28px;
  align-items: center;
}

.brand-lockup {
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

.today-section {
  position: relative;
  min-width: 0;
  overflow: hidden;
  isolation: isolate;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid rgba(233, 165, 30, .48);
  border-left: 3px solid var(--hsn-accent-primary);
  border-radius: 14px;
  background: linear-gradient(140deg, rgba(18, 75, 77, .82), rgba(4, 31, 32, .88) 76%);
  box-shadow: 0 20px 64px rgba(0, 0, 0, .2), 0 0 38px rgba(233, 165, 30, .08);
  animation: today-focus-arrive .9s .12s cubic-bezier(.2, .75, .25, 1) both;
}

.today-section::before {
  content: "";
  position: absolute;
  z-index: -1;
  top: -130px;
  right: -110px;
  width: 280px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(233, 165, 30, .17), transparent 68%);
  pointer-events: none;
}

.today-title {
  margin: 0;
  color: var(--hsn-text-primary);
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -.045em;
  line-height: 1.2;
}

.today-section .eyebrow {
  margin: 0;
  color: var(--hsn-accent-soft);
}

.today-section .today-date {
  padding: 8px 11px;
  border: 1px solid rgba(244, 241, 233, .14);
  border-radius: 999px;
  background: rgba(4, 31, 32, .42);
  color: var(--hsn-text-secondary);
}

.today-section .today-list {
  margin-top: 20px;
  border-top-color: rgba(244, 241, 233, .2);
}

.today-section .today-item {
  border-bottom-color: rgba(244, 241, 233, .16);
}

.today-section .today-item__link h3 {
  font-size: 17px;
}

.today-section .today-item__footer {
  color: rgba(233, 183, 79, .9);
}

.today-section .today-item:last-child {
  border-bottom: 0;
}

@keyframes today-focus-arrive {
  from {
    opacity: 0;
    transform: translateY(18px) scale(.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.today-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.today-heading__title {
  display: grid;
  gap: 5px;
}

.today-date {
  flex: 0 0 auto;
  color: var(--hsn-text-muted);
  font-size: 12px;
}

.today-empty {
  margin: 0;
  border-top: 1px solid var(--hsn-border-subtle);
  padding: 14px 0;
  color: var(--hsn-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.today-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 24px;
  row-gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--hsn-border-subtle);
}

.today-item {
  min-width: 0;
  padding: 13px 0;
  border-bottom: 1px solid var(--hsn-border-subtle);
  animation: agenda-item-arrive .55s calc(.12s + var(--item-index, 0) * .09s) cubic-bezier(.2, .75, .25, 1) both;
}

.today-item__topline,
.today-item__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.today-live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  color: var(--hsn-accent-soft);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.today-live.is-active {
  color: var(--hsn-accent-soft);
}

.today-live__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--hsn-accent-primary);
  box-shadow: 0 0 0 4px rgba(233, 165, 30, .12);
}

.today-live.is-active .today-live__dot {
  background: var(--hsn-accent-primary);
  animation: live-pulse 1.8s ease-in-out infinite;
}

.today-item__time {
  color: var(--hsn-text-secondary);
  font-size: 11px;
  text-align: right;
}

.today-item__link {
  display: block;
  margin-top: 10px;
  color: inherit;
  text-decoration: none;
}

.today-item__link:focus-visible {
  outline: 2px solid var(--hsn-accent-soft);
  outline-offset: 3px;
}

.today-item__link h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.today-item__link p {
  display: -webkit-box;
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--hsn-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.today-item__footer {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 10px;
  color: var(--hsn-text-muted);
  font-size: 10px;
}

.overview-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  margin-bottom: 16px;
}

.overview-copy {
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.overview-description {
  margin: 0;
}

.activity-search {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border: 1px solid var(--hsn-border-subtle);
  border-radius: 8px;
  background: rgba(10, 41, 43, .72);
  color: var(--hsn-text-muted);
  transition: border-color .2s ease, background-color .2s ease;
}

.activity-search:focus-within {
  border-color: var(--hsn-accent-soft);
  background: rgba(10, 41, 43, .92);
}

.activity-search svg {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
}

.activity-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--hsn-text-primary);
  font: inherit;
  font-size: 14px;
}

.activity-search input::placeholder {
  color: var(--hsn-text-muted);
  opacity: .9;
}

.activity-search:focus-within input:focus-visible {
  outline: none;
}

.search-results {
  margin: 0 0 10px;
  color: var(--hsn-text-muted);
  font-size: 12px;
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

.activity-filters {
  display: flex;
  align-items: center;
  align-self: flex-end;
  justify-self: end;
  gap: 8px;
  flex-wrap: wrap;
}

.activity-filter {
  min-height: 44px;
  padding: 0 15px;
  border: 1px solid var(--hsn-border-subtle);
  border-radius: 999px;
  background: rgba(10, 41, 43, .52);
  color: var(--hsn-text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .08em;
  cursor: pointer;
  transition: border-color .2s ease, background-color .2s ease, color .2s ease;
}

.activity-filter:hover,
.activity-filter.is-active {
  border-color: rgba(233, 165, 30, .7);
  background: rgba(233, 165, 30, .14);
  color: var(--hsn-accent-soft);
}

.activity-filter:focus-visible {
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
  object-position: center;
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
  white-space: nowrap;
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

@keyframes agenda-arrive {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes agenda-item-arrive {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes live-pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: .48;
    transform: scale(.78);
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

  .today-item__topline {
    align-items: flex-start;
  }

  .today-heading {
    align-items: flex-start;
  }

  .today-section .today-date {
    max-width: 46%;
    text-align: right;
  }
}

@media (min-width: 640px) {
  .overview-intro {
    grid-template-columns: minmax(0, 1fr) auto;
    margin-bottom: 12px;
  }

  .logo {
    width: min(76vw, 520px);
  }

  .today-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (min-width: 1100px) {
  .today-layout {
    grid-template-columns: minmax(280px, .78fr) minmax(0, 1.22fr);
    gap: 40px;
  }

  .logo {
    width: min(32vw, 420px);
    max-height: 42svh;
  }

  .activity-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .today-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .today-live__dot {
    animation: none !important;
  }

  .today-section {
    animation: none !important;
  }
}
</style>
