<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-[rgba(3,13,14,.72)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="admin-panel max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-[var(--hsn-text-primary)]">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-[var(--hsn-text-muted)]">{{ description }}</p>
          </div>
          <button class="admin-button admin-button-secondary px-3 py-2 text-xs" type="button" aria-label="Tutup modal" @click="emit('close')">Tutup</button>
        </div>
        <div class="mt-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
