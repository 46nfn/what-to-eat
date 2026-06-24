<template>
  <nav class="sticky top-0 z-50 glass border-b border-warm-100 dark:border-warm-700">
    <div class="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
      <!-- Logo -->
      <router-link to="/draw" class="flex items-center gap-1.5 flex-shrink-0 no-underline">
        <span class="text-xl">🍜</span>
        <span class="font-bold text-base text-warm-700 dark:text-warm-100 hidden sm:inline">这顿吃什么</span>
      </router-link>

      <!-- 桌面导航 -->
      <div class="hidden sm:flex items-center gap-1">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 no-underline"
          :class="isActive(item.to)
            ? 'bg-wheat-200 text-wheat-700 dark:bg-wheat-800 dark:text-wheat-300'
            : 'text-warm-500 hover:text-warm-700 hover:bg-warm-50 dark:hover:bg-warm-800 dark:hover:text-warm-300'">
          {{ item.icon }} {{ item.label }}
        </router-link>
      </div>

      <!-- 移动端（仅 logo + 头像，导航见底部栏） -->
      <div class="flex sm:hidden items-center gap-2">
        <template v-if="auth.isLoggedIn">
          <router-link to="/profile"
            class="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 no-underline"
            :class="isActive('/profile')
              ? 'bg-wheat-200 text-wheat-700 dark:bg-wheat-800 dark:text-wheat-300'
              : 'text-warm-500'">
            {{ auth.state.user?.avatar || '👤' }}
          </router-link>
        </template>
        <template v-else>
          <button class="btn-main text-xs px-3 py-1.5 flex-shrink-0" @click="showLoginModal = true">登录</button>
        </template>
      </div>

      <!-- 桌面端登录/头像 -->
      <div class="hidden sm:flex items-center">
        <template v-if="auth.isLoggedIn">
          <router-link to="/profile"
            class="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 no-underline"
            :class="isActive('/profile')
              ? 'bg-wheat-200 text-wheat-700 dark:bg-wheat-800 dark:text-wheat-300'
              : 'text-warm-500 hover:text-warm-700 hover:bg-warm-50 dark:hover:bg-warm-800 dark:hover:text-warm-300'">
            {{ auth.state.user?.avatar || '👤' }} <span>{{ auth.state.user?.nickname || '我的' }}</span>
          </router-link>
        </template>
        <template v-else>
          <button class="btn-main text-xs px-3 py-1.5" @click="showLoginModal = true">登录</button>
        </template>
      </div>
    </div>

    <!-- 登录/注册弹窗 -->
    <LoginModal
      :show="showLoginModal"
      mode="login"
      @close="showLoginModal = false"
      @success="onLoginSuccess"
    />
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/stores/useAuth.js';
import LoginModal from '@/components/LoginModal.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const showLoginModal = ref(false);

const isActive = (path) => route.path === path || (path === '/draw' && route.path === '/');

const onLoginSuccess = () => {
  showLoginModal.value = false;
  // 如果当前在公开页面，跳转到日记页
  const publicPages = ['/draw', '/login', '/register'];
  if (publicPages.includes(route.path)) {
    router.push('/diary');
  }
};

const navItems = [
  { to: '/draw', icon: '🎰', label: '听天意', short: '抽签' },
  { to: '/ai-chat', icon: '🤖', label: '天帮我选', short: 'AI推荐' },
  { to: '/diary', icon: '📖', label: '美食日记', short: '日记' },
  { to: '/community', icon: '🌍', label: '社区', short: '社区' },
];
</script>
