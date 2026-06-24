<template>
  <nav class="sm:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-warm-100 dark:border-warm-700 safe-bottom">
    <div class="flex items-center justify-around h-16 px-2">
      <router-link v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-xl text-[10px] font-medium transition-all duration-200 no-underline"
        :class="isActive(item.to)
          ? 'text-wheat-600 dark:text-wheat-400'
          : 'text-warm-400 dark:text-warm-500'">
        <span class="text-xl leading-none">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </router-link>
      <!-- 个人中心 / 登录 -->
      <template v-if="auth.isLoggedIn">
        <router-link to="/profile"
          class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-xl text-[10px] font-medium transition-all duration-200 no-underline"
          :class="isActive('/profile')
            ? 'text-wheat-600 dark:text-wheat-400'
            : 'text-warm-400 dark:text-warm-500'">
          <span class="text-xl leading-none">{{ auth.state.user?.avatar || '👤' }}</span>
          <span>我的</span>
        </router-link>
      </template>
      <template v-else>
        <button
          class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-xl text-[10px] font-medium text-warm-400 dark:text-warm-500"
          @click="showLogin = true">
          <span class="text-xl leading-none">👤</span>
          <span>登录</span>
        </button>
      </template>
    </div>
    <LoginModal :show="showLogin" mode="login" @close="showLogin = false" @success="onLoginSuccess" />
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/useAuth.js'
import LoginModal from '@/components/LoginModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const showLogin = ref(false)

const isActive = (path) => route.path === path || (path === '/draw' && route.path === '/')

const onLoginSuccess = () => {
  showLogin.value = false
  const publicPages = ['/draw', '/login', '/register']
  if (publicPages.includes(route.path)) router.push('/diary')
}

const navItems = [
  { to: '/draw', icon: '🎰', label: '听天意' },
  { to: '/ai-chat', icon: '🤖', label: '天帮我选' },
  { to: '/diary', icon: '📖', label: '日记' },
  { to: '/community', icon: '🌍', label: '社区' },
]
</script>
