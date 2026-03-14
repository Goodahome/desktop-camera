<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Control, ZoomIn, ZoomOut } from '@icon-park/vue-next'

const visible = ref(false)
const connected = ref(false)
const connectError = ref('')
const controlError = ref('')
const loading = ref(false)

const api = (window as any).api

/** 自动尝试连接当前可用的 UVC 摄像头（倒序尝试，仅连接支持控制的设备） */
async function tryAutoConnect() {
  if (!api?.uvcAutoConnect) return
  connectError.value = ''
  controlError.value = ''
  loading.value = true
  try {
    const res = await api.uvcAutoConnect()
    connected.value = res?.ok ?? false
    if (!res?.ok && res?.error) connectError.value = res.error
    if (res?.ok) {
      console.log('[UVC] 控制协议已连接', res.vendorId != null && res.productId != null ? `0x${res.vendorId.toString(16)}:0x${res.productId.toString(16)}` : '')
    } else {
      console.log('[UVC] 控制协议未连接', res?.error ?? '')
    }
  } finally {
    loading.value = false
  }
}

async function panTilt(dir: 'up' | 'down' | 'left' | 'right') {
  if (!connected.value || !api?.uvcPanTilt) return
  controlError.value = ''
  const res = await api.uvcPanTilt(dir)
  if (res && !res.ok) controlError.value = res.error || '云台控制失败'
}

async function zoom(delta: number) {
  if (!connected.value || !api?.uvcZoom) return
  controlError.value = ''
  const res = await api.uvcZoom(delta)
  if (res && !res.ok) controlError.value = res.error || '变焦控制失败'
}

function togglePanel() {
  visible.value = !visible.value
}

onMounted(async () => {
  if (api?.uvcIsConnected) {
    connected.value = await api.uvcIsConnected()
  }
  if (!connected.value && api?.uvcAutoConnect) {
    await tryAutoConnect()
  }
})
</script>

<template>
  <div class="uvc-panel-wrapper nodrag">
    <!-- 右下角展开/收起按钮 -->
    <button
      type="button"
      class="uvc-toggle"
      :class="{ active: visible }"
      title="摄像头控制"
      @click.stop.prevent="togglePanel"
    >
      <span class="uvc-toggle-inner"><Control theme="outline" size="22" /></span>
    </button>

    <!-- 控制面板：直接展示云台与变焦，未连接时显示重试 -->
    <div v-show="visible" class="uvc-panel">
      <div class="uvc-header">
        <span class="uvc-title">UVC 控制</span>
        <span v-if="connected" class="uvc-status connected">已连接</span>
        <span v-else-if="!loading" class="uvc-status disconnected">未连接</span>
      </div>

      <template v-if="!connected">
        <p v-if="connectError" class="uvc-error">{{ connectError }}</p>
        <p v-else class="uvc-hint">未连接 UVC 控制</p>
        <button type="button" class="uvc-btn primary" :disabled="loading" @click="tryAutoConnect">
          {{ loading ? '连接中…' : '重试连接' }}
        </button>
      </template>

      <!-- 圆形方向 + 变焦 -->
      <div v-if="connected" class="uvc-pad">
        <p v-if="controlError" class="uvc-error">{{ controlError }}，可点击下方重试连接以切换设备</p>
        <div class="uvc-dpad">
          <button type="button" class="uvc-circle-btn up" @click="panTilt('up')" title="上">↑</button>
          <div class="uvc-dpad-mid">
            <button type="button" class="uvc-circle-btn left" @click="panTilt('left')" title="左">←</button>
            <span class="uvc-dpad-center">云台</span>
            <button type="button" class="uvc-circle-btn right" @click="panTilt('right')" title="右">→</button>
          </div>
          <button type="button" class="uvc-circle-btn down" @click="panTilt('down')" title="下">↓</button>
        </div>
        <div class="uvc-zoom">
          <button type="button" class="uvc-circle-btn zoom-btn" @click="zoom(-5)" title="缩小">
            <ZoomOut theme="outline" size="18" />
          </button>
          <span class="uvc-zoom-label">变焦</span>
          <button type="button" class="uvc-circle-btn zoom-btn" @click="zoom(5)" title="放大">
            <ZoomIn theme="outline" size="18" />
          </button>
        </div>
        <button v-if="controlError" type="button" class="uvc-btn primary uvc-retry-btn" @click="tryAutoConnect">
          重试连接（切换设备）
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.uvc-panel-wrapper {
  position: absolute;
  bottom: 52px;
  right: 12px;
  z-index: 50;
  pointer-events: auto;
  -webkit-app-region: no-drag;
  overflow: visible; /* 避免被全局 * { overflow: hidden } 裁剪，面板在按钮上方会超出本层 */
}

.uvc-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  pointer-events: auto;
  transition: background 0.2s;
  &:hover,
  &.active {
    background: rgba(200, 100, 150, 0.7);
  }
}

.uvc-toggle-inner {
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uvc-panel {
  position: absolute;
  bottom: 44px;
  right: 0;
  min-width: 200px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.uvc-header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.uvc-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}
.uvc-status {
  font-size: 11px;
  &.connected {
    color: #7dd87d;
  }
  &.disconnected {
    color: rgba(255, 255, 255, 0.5);
  }
}

.uvc-connect {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
}
.uvc-select {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  &.full {
    width: 100%;
  }
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 11px;
}
.uvc-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  outline: none;
  &.primary {
    background: rgba(100, 150, 255, 0.5);
  }
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
.uvc-error {
  font-size: 10px;
  color: #f88;
  margin: 0 0 8px 0;
}
.uvc-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 8px 0;
  line-height: 1.4;
}
.uvc-hint code {
  background: rgba(0, 0, 0, 0.35);
  padding: 1px 4px;
  border-radius: 3px;
}

.uvc-retry-btn {
  margin-top: 8px;
}
.uvc-pad {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.uvc-dpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.uvc-dpad-mid {
  display: flex;
  align-items: center;
  gap: 4px;
}
.uvc-dpad-center {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 32px;
  text-align: center;
}

.uvc-circle-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: background 0.15s, transform 0.1s;
  &:hover {
    background: rgba(120, 80, 180, 0.5);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.98);
  }
  &.up,
  &.down {
    width: 36px;
  }
  &.left,
  &.right {
    height: 36px;
  }
}

.uvc-zoom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
.uvc-zoom-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}
.uvc-zoom .zoom-btn {
  width: 36px;
  height: 36px;
}
</style>
