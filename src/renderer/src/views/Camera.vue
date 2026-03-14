<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import { useCaptureUiStore } from '@renderer/stores/useCaptureUiStore'
import { onMounted } from 'vue'

const { config } = useConfigStore()
const { captureCountdown, showBorderFlash } = storeToRefs(useCaptureUiStore())

const constraints = {
  audio: false,
  video: {
    deviceId: config.deviceId,
    width: 1920,
    height: 1080
  }
} as MediaStreamConstraints

onMounted(() => {
  const video = document.querySelector('video')! as HTMLVideoElement
  config.videoElement = video

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream
    const track = stream.getVideoTracks()[0]
    if (track) {
      const deviceId = track.getSettings().deviceId
      if (deviceId) config.deviceId = deviceId
    }
  })
})
</script>
<template>
  <main
    class="w-screen h-screen drag aspect-square overflow-hidden relative z-0"
    :style="`border:solid ${config.borderWidth}px ${config.borderColor};border-radius:${
      config.rounded ? '50%' : config.borderRadius + 'px'
    }`"
  >
    <div
      class="border-4 border-transparent absolute w-screen h-screen bg-slate-700 text-white font-light text-base flex flex-col justify-center items-center"
    >
      摄像头加载中...
      <div class="text-xs opacity-90">如果长时间不加载，在软件配置中切换摄像头</div>
    </div>
    <video
      class="object-cover h-full w-full relative z-10 aspect-video"
      :style="{
        transform: config.flip ? `rotateY(180deg)` : '',
        height: config.rounded ? '100vh' : ''
      }"
      autoplay
    ></video>

    <!-- 延时拍照倒数：画面中央大号半透明白字 -->
    <div
      v-if="captureCountdown > 0"
      class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
    >
      <span class="countdown-num">{{ captureCountdown }}</span>
    </div>

    <!-- 拍照完成：白色半透明遮罩屏闪 -->
    <div
      v-if="showBorderFlash"
      class="screen-flash"
    ></div>
  </main>
</template>

<style lang="scss" scoped>
.countdown-num {
  font-size: min(28vw, 28vh);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

/* 拍照完成时全屏白色半透明屏闪 */
.screen-flash {
  position: absolute;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.6);
  animation: screen-flash 0.28s ease-out forwards;
}
@keyframes screen-flash {
  0% {
    opacity: 0;
  }
  35% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
