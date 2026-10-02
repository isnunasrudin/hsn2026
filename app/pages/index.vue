<template>
  <main class="stage relative flex flex-col items-center justify-between px-5 py-6 text-center sm:px-10 sm:py-9">
    <header class="w-full shrink-0 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d6e4de]/70 sm:text-xs">
      <span class="text-left reveal">PCNU Trenggalek</span>
      <span class="text-right reveal" v-if="tanggal">{{ tanggal }}</span>
    </header>

    <section class="content relative flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 py-6 sm:gap-9" aria-labelledby="headline">
      <div class="reveal h-px w-12 bg-[#e9a51e]" aria-hidden="true"></div>
      <p class="reveal delay-1 eyebrow text-[10px] font-semibold uppercase text-[#e9b74f] sm:text-xs">Menuju Kick-Off</p>
      <h1 id="headline" class="sr-only">Hari Santri Nasional 2026 PCNU Trenggalek - Segera Hadir</h1>
      <img
        class="logo block w-[min(78vw,610px)] max-h-[44svh] object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.18)] sm:w-[min(68vw,690px)]"
        :src="hsnLogo"
        alt="Logo Hari Santri 2026 - Santri Menguatkan Negeri, Menuju Indonesia Emas"
        width="3543"
        height="2032"
      >
      <div class="countdown-grid reveal delay-3 grid grid-cols-4 gap-2 sm:gap-4 mb-24" role="timer" :aria-label="countdownLabel">
        <div v-for="(unit, index) in countdownUnits" :key="unit.label" class="countdown-unit w-[68px] border-t pt-3 sm:w-24" :class="index === 0 ? 'border-[#e9a51e]/70' : 'border-white/25'">
          <strong class="count block text-3xl font-light leading-none sm:text-5xl">{{ unit.value }}</strong>
          <span class="mt-2 block text-[9px] uppercase tra  cking-[.2em] text-[#b9cbc5] sm:text-[10px]">{{ unit.label }}</span>
        </div>
      </div>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ eventStatus }}</p>
    </section>

    <footer class="reveal delay-3 w-full shrink-0 flex items-center justify-center gap-3 text-[10px] tracking-[.18em] text-[#b9cbc5]/60 sm:text-xs">
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
      <span>hsn.nutrenggalek.or.id</span>
      <span class="h-px w-7 bg-[#b9cbc5]/35" aria-hidden="true"></span>
    </footer>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import hsnLogo from '~/assets/images/hsn2026.webp'

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  ],
  meta: [
    { name: 'theme-color', content: '#071c1e' },
    { name: 'description', content: 'Menuju Hari Santri Nasional 2026 bersama PCNU Trenggalek.' }
  ],
  title: 'Hari Santri 2026 - PCNU Trenggalek'
})

const targetDate = new Date('2026-10-04T00:00:00+07:00').getTime()
const remaining = ref(getRemainingTime())
let countdownInterval

function getRemainingTime() {
  const difference = Math.max(0, targetDate - Date.now())
  const totalSeconds = Math.floor(difference / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  }
}

const countdownUnits = computed(() => [
  { value: String(remaining.value.days).padStart(2, '0'), label: 'Hari' },
  { value: String(remaining.value.hours).padStart(2, '0'), label: 'Jam' },
  { value: String(remaining.value.minutes).padStart(2, '0'), label: 'Menit' },
  { value: String(remaining.value.seconds).padStart(2, '0'), label: 'Detik' }
])

const countdownLabel = computed(() => countdownUnits.value
  .map((unit) => `${unit.value} ${unit.label}`)
  .join(', '))

const eventStatus = computed(() => targetDate <= Date.now()
  ? 'Hari Santri Nasional 2026 telah tiba.'
  : countdownLabel.value)

onMounted(() => {
  countdownInterval = window.setInterval(() => {
    remaining.value = getRemainingTime()
  }, 1000)
})

onUnmounted(() => window.clearInterval(countdownInterval))

const tanggal = ref(null)
onMounted(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  tanggal.value = new Date(targetDate).toLocaleDateString('id-ID', options)
})
</script>

<style scoped>
:global(html) { color-scheme: dark; }
:global(body) { margin: 0; background: #071c1e; color: #f4f1e9; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
:global(*) { box-sizing: border-box; }

.stage {
  min-height: 100svh;
  min-height: 100dvh;
  isolation: isolate;
  overflow: hidden;
  background: radial-gradient(circle at 50% 36%, #124b4d 0%, #0a292b 34%, #071c1e 74%);
}

.stage::before {
  content: "";
  position: absolute;
  z-index: -1;
  width: min(82vw, 740px);
  aspect-ratio: 1;
  left: 50%;
  top: calc(50% - 24px);
  translate: -50% -50%;
  border: 1px solid rgba(244, 241, 233, .085);
  border-radius: 50%;
  box-shadow: 0 0 0 95px rgba(244, 241, 233, .025), 0 0 0 190px rgba(244, 241, 233, .018);
  pointer-events: none;
  animation: breathe 12s ease-in-out infinite;
  translate: none;
}

.eyebrow { letter-spacing: .27em; }
.count { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes logoReveal { from { opacity: 0; transform: translateY(20px) scale(.96); filter: blur(8px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
@keyframes breathe { 0%, 100% { opacity: .48; transform: translate(-50%, -50%) scale(1); } 50% { opacity: .8; transform: translate(-50%, -50%) scale(1.07); } }

.reveal { opacity: 0; animation: rise .8s cubic-bezier(.2, .75, .25, 1) forwards; }
.logo { animation: logoReveal 1.15s .15s cubic-bezier(.2, .75, .25, 1) both; }
.delay-1 { animation-delay: .35s; }
.delay-2 { animation-delay: .55s; }
.delay-3 { animation-delay: .75s; }

@media (max-height: 650px) { .logo { max-height: 36svh; } .content { gap: 1rem; } }
@media (max-width: 399px) {
  .countdown-grid { gap: .25rem; }
  .countdown-unit { width: 64px; }
}
</style>
