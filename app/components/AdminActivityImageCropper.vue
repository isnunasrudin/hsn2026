<script setup lang="ts">
import type Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = withDefaults(defineProps<{
  imageUrl: string | null
  assetName?: string
  aspectRatio?: number
  fillColor?: string
}>(), {
  assetName: 'Gambar kegiatan',
  aspectRatio: 16 / 9,
  fillColor: '#071c1e'
})
const ratioLabel = computed(() => props.aspectRatio === 1 ? '1:1' : '16:9')
const emit = defineEmits<{
  cropped: [image: Blob]
  clear: []
}>()

const cropper = shallowRef<Cropper | null>(null)
const source = ref('')
const croppedPreview = ref('')
const errorMessage = ref('')
const isCropping = ref(false)
const isCropperReady = ref(false)
let sourceObjectUrl: string | null = null
let croppedObjectUrl: string | null = null

const revokeSource = (): void => {
  if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl)
  sourceObjectUrl = null
}

const revokeCroppedPreview = (): void => {
  if (croppedObjectUrl) URL.revokeObjectURL(croppedObjectUrl)
  croppedObjectUrl = null
  croppedPreview.value = ''
}

const destroyCropper = (): void => {
  cropper.value?.destroy()
  cropper.value = null
  isCropperReady.value = false
}

const initializeCropper = async (event: Event): Promise<void> => {
  const image = event.currentTarget
  if (!(image instanceof HTMLImageElement)) return
  destroyCropper()
  try {
    const { default: CropperConstructor } = await import('cropperjs')
    if (image.src !== source.value) return
    cropper.value = new CropperConstructor(image, {
      aspectRatio: props.aspectRatio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      responsive: true,
      background: false,
      checkOrientation: true,
      guides: true,
      center: true,
      minContainerHeight: 260
    })
    isCropperReady.value = true
  } catch {
    errorMessage.value = 'Cropper gambar gagal dimuat. Silakan pilih ulang gambar.'
  }
}

const selectImage = (event: Event): void => {
  const input = event.currentTarget
  if (!(input instanceof HTMLInputElement)) return
  const file = input.files?.[0]
  input.value = ''
  errorMessage.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    errorMessage.value = 'Pilih gambar JPG, PNG, atau WebP.'
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    errorMessage.value = 'Ukuran gambar maksimal 15 MB.'
    return
  }

  revokeSource()
  revokeCroppedPreview()
  destroyCropper()
  sourceObjectUrl = URL.createObjectURL(file)
  source.value = sourceObjectUrl
  isCropping.value = true
  isCropperReady.value = false
}

const applyCrop = (): void => {
  if (!isCropperReady.value || !cropper.value) return
  const canvas = cropper.value.getCroppedCanvas({
    maxWidth: props.aspectRatio === 1 ? 1000 : 1600,
    maxHeight: props.aspectRatio === 1 ? 1000 : 900,
    imageSmoothingQuality: 'high',
    fillColor: props.fillColor
  })
  if (!canvas) {
    errorMessage.value = 'Gambar belum siap dipotong. Silakan coba lagi.'
    return
  }

  canvas.toBlob((image) => {
    if (!image) {
      errorMessage.value = 'Hasil crop gambar gagal dibuat.'
      return
    }
    revokeCroppedPreview()
    croppedObjectUrl = URL.createObjectURL(image)
    croppedPreview.value = croppedObjectUrl
    emit('cropped', image)
    errorMessage.value = ''
    isCropping.value = false
    source.value = ''
    revokeSource()
  }, 'image/jpeg', 0.88)
}

const cancelCrop = (): void => {
  destroyCropper()
  isCropping.value = false
  source.value = ''
  revokeSource()
}

const clearImage = (): void => {
  destroyCropper()
  revokeSource()
  revokeCroppedPreview()
  source.value = ''
  isCropping.value = false
  errorMessage.value = ''
  emit('clear')
}

onUnmounted(() => {
  destroyCropper()
  revokeSource()
  revokeCroppedPreview()
})
</script>

<template>
  <section class="grid gap-3 rounded-lg border border-[var(--hsn-border-subtle)] p-4 sm:col-span-2">
    <div>
      <p class="text-sm font-medium text-[var(--hsn-text-secondary)]">{{ props.assetName }}</p>
      <p class="mt-1 text-xs leading-5 text-[var(--hsn-text-muted)]">Pilih JPG, PNG, atau WebP maksimal 15 MB. Area crop otomatis dikunci ke rasio {{ ratioLabel }}.</p>
    </div>
    <div v-if="isCropping && source" class="grid gap-3">
      <div class="h-80 overflow-hidden rounded-md bg-[var(--hsn-surface-primary)]">
        <img :src="source" class="block max-w-full" :alt="`Pilih area ${props.assetName.toLowerCase()}`" @load="initializeCropper">
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="admin-button admin-button-primary" type="button" :disabled="!isCropperReady" @click="applyCrop">{{ isCropperReady ? 'Gunakan hasil crop' : 'Menyiapkan cropper...' }}</button>
        <button class="admin-button admin-button-secondary" type="button" @click="cancelCrop">Batal</button>
      </div>
    </div>
    <img v-else-if="croppedPreview || imageUrl" class="max-h-64 w-full rounded-md bg-[var(--hsn-surface-primary)] object-contain" :src="croppedPreview || imageUrl || ''" :alt="`Pratinjau ${props.assetName.toLowerCase()}`">
    <p v-if="errorMessage" class="text-sm text-[var(--hsn-status-error)]" role="alert">{{ errorMessage }}</p>
    <div v-if="!isCropping" class="flex flex-wrap gap-2">
      <label class="admin-button admin-button-secondary inline-flex cursor-pointer items-center">
        {{ imageUrl || croppedPreview ? 'Ganti' : 'Pilih' }} {{ props.assetName.toLowerCase() }}
        <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="selectImage">
      </label>
      <button v-if="imageUrl || croppedPreview" class="admin-button admin-button-danger" type="button" @click="clearImage">Hapus {{ props.assetName.toLowerCase() }}</button>
      <p v-if="croppedPreview" class="self-center text-xs text-[var(--hsn-status-success)]" role="status">Hasil crop siap disimpan bersama kegiatan.</p>
    </div>
  </section>
</template>
