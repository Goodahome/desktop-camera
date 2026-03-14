<script setup lang="ts">
import { useConfigStore } from '@renderer/stores/useConfigStore'
import packageJson from '../../../../package.json'

const { config } = useConfigStore()
const devices = await navigator.mediaDevices.enumerateDevices()
const cameras = devices.filter((d) => {
  return d.kind.includes('video')
})

const chooseSaveDir = async () => {
  // @ts-ignore
  const dir = await window.api.selectSaveDir()
  if (dir) {
    config.saveDir = dir
  }
}
</script>

<template>
  <main class="bg-[#2c3e50] h-screen w-screen z-50 drag">
    <section class="p-5 h-screen overflow-y-auto setting-scroll nodrag">
      <h2 class="text-center text-gray-100 opacity-80 text-sm font-mono mb-4">参数设置</h2>

      <div class="space-y-3">
        <!-- 边框宽度 / 圆角尺寸 -->
        <div class="flex items-center gap-3">
          <span class="label">边框宽度</span>
          <el-input
            v-model="config.borderWidth"
            type="number"
            :min="0"
            size="small"
            class="w-24"
          ></el-input>
          <span class="label ml-6">圆角尺寸</span>
          <el-input
            v-model="config.borderRadius"
            type="number"
            :min="0"
            size="small"
            class="w-24"
          ></el-input>
        </div>

        <!-- 延时拍照 -->
        <div class="flex items-center gap-3">
          <span class="label">延时拍照(秒)</span>
          <el-input
            v-model="config.captureDelay"
            type="number"
            :min="0"
            size="small"
            class="w-24"
          ></el-input>
          <!-- 边框颜色 -->
          <span class="label ml-6">边框颜色</span>
          <el-input
            v-model="config.borderColor"
            placeholder="例如 #f1c40f"
            clearable
            size="small"
            class="w-24"
          ></el-input>
        </div>
      
<!-- 摄像头选择 -->
        <div class="flex items-center gap-3">
          <span class="label">选择摄像头</span>
          <el-select
            v-model="config.deviceId"
            placeholder="选择摄像头"
            clearable
            filterable
            class="flex-1"
            size="small"
          >
            <el-option
              v-for="(device, index) in cameras"
              :key="index"
              :label="device.label"
              :value="device.deviceId"
            >
            </el-option>
          </el-select>
        </div>

        <!-- 保存目录 -->
        <div class="flex items-center gap-3">
          <span class="label">照片/视频目录</span>
          <el-input
            v-model="config.saveDir"
            placeholder="未设置时使用系统默认图片/视频目录"
            class="flex-1"
            size="small"
          ></el-input>
          <el-button type="primary" size="small" @click="chooseSaveDir">选择</el-button>
        </div>
      </div>


      <section
        class="flex flex-col items-center justify-center text-gray-100 font-light mt-4 text-xs nodrag"
      >
        <div class="text-orange-300 mb-2">
          由向军大叔开源项目二开，特此感谢
          <!--
          <a
            href="https://www.baidu.com/live"
            target="_blank"
            class="text-yellow-500 font-bold hover:text-orange-300"
            >晚八点直播</a
          >
          -->
        </div>
        <!-- <span class="font-light opacity-70 mb-1">微信: houdunren2021</span> -->
        <span class="font-light opacity-70 text-xs text-gray-300">
          版本号: {{ packageJson.version }}
        </span>
      </section>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.label {
  @apply text-white opacity-80 text-xs flex-shrink-0;
  min-width: 80px;
  text-align: right;
}
.setting-scroll {
  scrollbar-width: none;
}
.setting-scroll::-webkit-scrollbar {
  display: none;
}
</style>
