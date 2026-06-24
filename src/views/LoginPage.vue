<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-3">🍜</div>
        <h1 class="text-2xl font-bold text-warm-700 dark:text-warm-100">这顿吃什么</h1>
        <p class="text-sm text-warm-500 mt-1">登录以同步你的美食数据</p>
      </div>

      <!-- 登录表单 -->
      <div class="card-box">
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">用户名</label>
            <input
              v-model="form.username"
              class="input-box text-sm w-full"
              placeholder="请输入用户名"
              autocomplete="username"
              @keydown.enter="onLogin"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="input-box text-sm w-full"
              placeholder="请输入密码"
              autocomplete="current-password"
              @keydown.enter="onLogin"
            />
          </div>
          <p v-if="errorMsg" class="text-xs text-red-500 text-center">{{ errorMsg }}</p>
          <button
            class="btn-main w-full py-2.5 text-sm font-semibold"
            :disabled="loading || !formValid"
            @click="onLogin"
          >
            <span v-if="loading" class="inline-block animate-spin mr-1">⏳</span>
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </div>
      </div>

      <!-- 切换注册 -->
      <p class="text-center text-xs text-warm-500 mt-6">
        还没有账号？
        <router-link to="/register" class="text-wheat-600 font-medium hover:underline">立即注册</router-link>
      </p>

      <!-- 返回首页 -->
      <p class="text-center mt-3">
        <router-link to="/draw" class="text-xs text-warm-400 hover:text-warm-600">← 返回首页</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/useAuth.js';

const router = useRouter();
const route = useRoute();
const { state, login } = useAuth();

const form = reactive({ username: '', password: '' });
const errorMsg = ref('');
const loading = computed(() => state.loading);
const formValid = computed(() => form.username.trim() && form.password.trim());

const onLogin = async () => {
  if (!formValid.value || loading.value) return;
  errorMsg.value = '';
  try {
    await login(form.username.trim(), form.password);
    // 跳转到之前要访问的页面，或默认跳转日记页
    const redirect = route.query.redirect || '/diary';
    router.push(redirect);
  } catch (err) {
    errorMsg.value = err.message || '登录失败';
  }
};
</script>
