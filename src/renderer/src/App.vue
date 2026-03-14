<script setup lang="ts">
import CameraControlPanel from '@renderer/components/CameraControlPanel.vue'
import Footer from '@renderer/components/Footer.vue'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import Camera from './views/Camera.vue'
import Setting from './views/Setting.vue'
// import Secret from './views/Secret.vue'

const { config } = useConfigStore()
config.page = 'camera'
</script>

<template>
  <Suspense>
    <main class="relative">
      <Camera v-if="config.page == 'camera'" />
      <Setting v-if="config.page == 'setting'" />
      <!-- 摄像头页面右下角：UVC 控制面板（须在 Footer 前以保证 z-index 生效） -->
      <CameraControlPanel v-if="config.page == 'camera'" />
      <!-- 菜单图标 -->
      <Footer />
      <!-- 编译苹果 mas 时不使用该组件 -->
      <!-- <Secret /> -->
    </main>
  </Suspense>
</template>
