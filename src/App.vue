<template>
  <div class="min-h-screen bg-wheat-50 dark:bg-warm-900 transition-colors duration-300">
    <TopNav />
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import TopNav from '@/components/TopNav.vue'
import { onMounted } from 'vue'
import { useProfile } from '@/stores/useProfile.js'

const { state: profile } = useProfile()

onMounted(() => {
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
})
</script>

<style>
.page-enter-active { transition: all 0.25s ease-out; }
.page-leave-active { transition: all 0.15s ease-in; }
.page-enter-from { opacity: 0; transform: translateY(12px); }
.page-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
