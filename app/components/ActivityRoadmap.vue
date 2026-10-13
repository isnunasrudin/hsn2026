<script setup lang="ts">
import { computed } from 'vue'
import { groupByIndonesiaDate, formatIndonesiaTimeRange } from '~/utils/date'

type Activity = {
  id: number
  type: 'LOMBA' | 'EVENT'
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

const props = withDefaults(defineProps<{ activities: Activity[]; titleTag?: 'h2' | 'h3' }>(), { titleTag: 'h2' })
const activityGroups = computed(() => groupByIndonesiaDate(props.activities).map(group => ({
  ...group,
  datetime: group.key === 'undated' ? null : group.key
})))
const typeTone = (type: Activity['type']): string => type === 'LOMBA' ? 'is-teal' : 'is-gold'
</script>

<template>
  <div class="roadmap" aria-label="Timeline kegiatan Hari Santri Nasional 2026">
    <section v-for="(group, groupIndex) in activityGroups" :key="group.key" class="roadmap-group">
      <div class="roadmap-marker" aria-hidden="true"><span>{{ String(groupIndex + 1).padStart(2, '0') }}</span></div>
      <div class="roadmap-group__body">
        <div class="roadmap-date">
          <time :datetime="group.datetime || undefined">{{ group.date }}</time>
          <span>{{ group.items.length }} kegiatan</span>
        </div>
        <ol class="roadmap-events">
          <li v-for="activity in group.items" :key="activity.id" class="roadmap-event"
            :class="{ 'has-image': activity.image }">
            <div v-if="activity.image" class="roadmap-event__media">
              <img :src="activity.image" :alt="`Dokumentasi ${activity.title}`" loading="lazy" width="960" height="540">
            </div>
            <div class="roadmap-event__topline">
              <span v-if="activity.type == 'LOMBA'"
                class="admin-badge-accent rounded-full px-2.5 py-1 text-xs font-semibold">LOMBA</span>
              <span v-else class="agenda-status" :class="typeTone(activity.type)">Kegiatan</span>
              <span v-if="activity.startsAt" class="agenda-time">{{ formatIndonesiaTimeRange(activity.startsAt,
                activity.endsAt) }}</span>
            </div>
            <NuxtLink class="agenda-title-link" :to="`/kegiatan/${activity.slug}`">
              <component :is="titleTag">{{ activity.title }}</component>
            </NuxtLink>
            <p v-if="activity.description">{{ activity.description }}</p>
            <div class="agenda-footer">
              <span v-if="activity.location" class="agenda-location">{{ activity.location }}</span>
              <NuxtLink class="agenda-detail" :to="`/kegiatan/${activity.slug}`">Detail <span
                  aria-hidden="true">↗</span></NuxtLink>
            </div>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.roadmap {
  position: relative;
  padding: 26px 0 42px;
}

.roadmap::before {
  content: '';
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
  width: 54px;
  justify-content: center;
  align-items: flex-start;
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
  min-width: 0;
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
  min-width: 0;
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
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, #071c1e 0%, rgba(7, 28, 30, .9) 32%, rgba(7, 28, 30, .28) 72%, rgba(7, 28, 30, .08) 100%);
}

.roadmap-event__media img {
  display: block;
  width: 100%;
  height: 100%;
  margin-left: auto;
  object-fit: cover;
  object-position: center;
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

.roadmap-event h2,
.roadmap-event h3 {
  margin: 0 0 9px;
  color: #f4f1e9;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  font-weight: 500;
  letter-spacing: -.035em;
}

.agenda-title-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.agenda-title-link:hover,
.agenda-title-link:focus-visible {
  color: #e9b74f;
}

.agenda-title-link:focus-visible,
.agenda-detail:focus-visible {
  outline: 2px solid #e9b74f;
  outline-offset: 4px;
  border-radius: 3px;
}

.roadmap-event p {
  display: -webkit-box;
  min-height: 44px;
  margin: 0;
  overflow: hidden;
  color: #d2d2d2;
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.agenda-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.agenda-location {
  color: rgba(233, 183, 79, .78);
  font-size: 10px;
  letter-spacing: .12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.agenda-state {
  color: rgba(203, 217, 212, .72);
  font-size: 10px;
}

.agenda-detail {
  flex: 0 0 auto;
  color: #e9b74f;
  font-size: 10px;
  letter-spacing: .12em;
  text-decoration: none;
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

.agenda-status.is-gold {
  color: #e9b74f;
}

@media (max-width: 640px) {
  .roadmap {
    padding-top: 24px;
  }

  .roadmap::before {
    left: 8px;
  }

  .roadmap-group {
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 12px;
  }

  .roadmap-marker {
    width: 20px;
  }

  .roadmap-marker span {
    display: none;
  }

  .roadmap-date {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .roadmap-date {
    margin-left: -24px;
    padding-left: 24px;
  }

  .roadmap-events {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .roadmap-event {
    min-height: 0;
    padding: 17px 16px 18px;
  }

  .roadmap-event p {
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    transition: none !important;
  }
}
</style>
