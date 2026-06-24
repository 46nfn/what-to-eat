<template>
  <div class="min-h-screen bg-wheat-50 dark:bg-warm-900 transition-colors duration-300">
    <!-- auth 初始化完成前显示加载 -->
    <template v-if="auth.state.initDone">
      <TopNav ref="topNavRef" />
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
      <!-- 移动端底部导航栏 -->
      <BottomNav />
      <!-- PWA 安装与更新提示 -->
      <PwaInstallPrompt />
    </template>
    <template v-else>
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl mb-4 animate-float">🍜</div>
          <p class="text-warm-500">加载中...</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import TopNav from '@/components/TopNav.vue'
import BottomNav from '@/components/BottomNav.vue'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/useAuth.js'
import { useProfile } from '@/stores/useProfile.js'
import { authEvents } from '@/api/index.js'

const router = useRouter()
const auth = useAuth()
const { state: profile } = useProfile()

// 全局 token 过期处理
const onAuthExpired = () => {
  router.push('/draw')
}

onMounted(async () => {
  // 初始化主题
  const t = profile.theme || 'light'
  const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches
  const isDark = t === 'dark' || (t === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.dataset.font = profile.fontSize || 'medium'

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (profile.theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })

  // 监听 token 过期
  authEvents.onExpired(onAuthExpired)

  // 初始化认证状态（验证 token 有效性）
  await auth.init()
})

onUnmounted(() => {
  // 清理过期监听（authEvents._handlers 是内部实现，这里用简单方式）
})
</script>

<style>
.page-enter-active { transition: all 0.25s ease-out; }
.page-leave-active { transition: all 0.15s ease-in; }
.page-enter-from { opacity: 0; transform: translateY(12px); }
.page-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
