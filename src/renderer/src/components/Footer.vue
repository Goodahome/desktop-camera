<script setup lang="ts">
import { CameraFive, Setting as SettingICon } from '@icon-park/vue-next'
import DropdownMenu from '@renderer/components/DropdownMenu.vue'
import FullScreen from '@renderer/components/FullScreen.vue'
// import useCamera from '@renderer/composables/useCamera'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import { useCaptureUiStore } from '@renderer/stores/useCaptureUiStore'
import ChangeFlipHorizontally from './ChangeFlipHorizontally.vue'
import ChangeRounded from './ChangeRounded.vue'
import { ref } from 'vue'
// const { openNewCamera } = useCamera()
const { config } = useConfigStore()
const { captureCountdown, showBorderFlash } = storeToRefs(useCaptureUiStore())

const takingPhoto = ref(false)
const countdown = ref(0)
const isRecording = ref(false)

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: BlobPart[] = []

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildFileName = (ext: string) => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `camera-${y}${m}${d}-${hh}${mm}${ss}.${ext}`
}

const handleTakePhoto = async () => {
  if (takingPhoto.value) return
  const video = config.videoElement as HTMLVideoElement | null
  if (!video) {
    return
  }
  takingPhoto.value = true
  captureCountdown.value = 0

  const delay = Number(config.captureDelay || 0)
  if (delay > 0) {
    countdown.value = delay
    captureCountdown.value = delay
    while (countdown.value > 0) {
      await sleep(1000)
      countdown.value -= 1
      captureCountdown.value = countdown.value
    }
  }

  const width = video.videoWidth || video.clientWidth
  const height = video.videoHeight || video.clientHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    takingPhoto.value = false
    return
  }
  ctx.drawImage(video, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

  const name = buildFileName('png')
  const dir = (config as any).saveDir || ''

  try {
    // @ts-ignore
    await window.api.capturePhoto({ data: base64, dir, name })
    // 拍照反馈：白色半透明遮罩屏闪
    showBorderFlash.value = true
    await sleep(320)
    showBorderFlash.value = false
  } finally {
    takingPhoto.value = false
  }
}

const handleToggleRecord = async () => {
  const video = config.videoElement as HTMLVideoElement | null
  if (!video || !video.srcObject) {
    return
  }
  const stream = video.srcObject as MediaStream

  if (!isRecording.value) {
    recordedChunks = []
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5_000_000
      })
    } catch (e) {
      console.error(e)
      return
    }

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      if (!recordedChunks.length) return

      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const arrayBuffer = await blob.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i])
      }
      const base64 = window.btoa(binary)

      const name = buildFileName('webm')
      const dir = (config as any).saveDir || ''

      try {
        // @ts-ignore
        await window.api.saveVideo({ data: base64, dir, name, mime: blob.type })
      } catch (e) {
        console.error(e)
      } finally {
        recordedChunks = []
      }
    }

    mediaRecorder.start()
    isRecording.value = true
  } else {
    mediaRecorder?.stop()
    isRecording.value = false
  }
}

//退出软件
// const quit = () => window.api.quit()
</script>

<template>
  <section
    class="nodrag absolute bottom-0 z-30 group w-screen justify-center items-center gap-2 cursor-pointer flex hover:bg-pink-600 py-2"
    :class="{ 'bg-pink-600': config.page == 'setting' }"
  >
    <!-- 设置页面 -->
    <SettingICon
      v-if="!['setting', 'updater'].includes(config.page)"
      theme="outline"
      size="20"
      :stroke-width="3"
      class="icon"
      @click="config.page = 'setting'"
    />
    <!-- 摄像头页面 -->
    <CameraFive
      v-if="config.page != 'camera'"
      theme="outline"
      size="20"
      :stroke-width="3"
      class="icon"
      @click="config.page = 'camera'"
    />
    <!-- 圆角切换 -->
    <ChangeRounded v-if="config.page == 'camera'" />
    <!-- 画面镜像 -->
    <ChangeFlipHorizontally v-if="config.page == 'camera'" />
    <!-- 拍照 -->
    <button
      v-if="config.page == 'camera'"
      class="capture-btn"
      type="button"
      @click="handleTakePhoto"
    >
      {{ countdown > 0 ? `拍照(${countdown})` : takingPhoto ? '拍照中...' : '拍照' }}
    </button>
    <!-- 录像 -->
    <button
      v-if="config.page == 'camera'"
      class="record-btn"
      type="button"
      @click="handleToggleRecord"
    >
      {{ isRecording ? '停止录像' : '开始录像' }}
    </button>
    <!-- 全屏 -->
    <FullScreen v-if="['camera'].includes(config.page)" />
    <!-- 快捷菜单 -->
    <DropdownMenu />
  </section>
</template>

<style lang="scss" scoped>
.icon,
:deep(.icon) {
  @apply text-white cursor-pointer opacity-0 group-hover:opacity-100;
}
.capture-btn,
.record-btn {
  outline: none;
}
.capture-btn:focus,
.record-btn:focus,
.capture-btn:focus-visible,
.record-btn:focus-visible {
  outline: none;
  box-shadow: none;
}
.capture-btn {
  @apply text-white text-xs px-3 py-1 rounded border border-white bg-pink-500/60 hover:bg-pink-500/90 opacity-0 group-hover:opacity-100;
}
.record-btn {
  @apply text-white text-xs px-3 py-1 rounded border border-red-400 bg-red-500/70 hover:bg-red-500/90 opacity-0 group-hover:opacity-100;
}
:deep(.el-dropdown__trigger:focus),
:deep(.el-dropdown__trigger:focus-visible) {
  outline: none;
  box-shadow: none;
}
:deep(.icon:focus),
:deep(.icon:focus-visible) {
  outline: none;
}
.bg-pink-600 {
  .icon,
  :deep(.icon),
  .capture-btn,
  .record-btn {
    @apply opacity-100;
  }
}
</style>
