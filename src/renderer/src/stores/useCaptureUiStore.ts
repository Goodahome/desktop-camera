import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 拍照相关 UI 状态，不持久化 */
export const useCaptureUiStore = defineStore('captureUi', () => {
  const captureCountdown = ref(0)
  const showBorderFlash = ref(false)
  return { captureCountdown, showBorderFlash }
})
