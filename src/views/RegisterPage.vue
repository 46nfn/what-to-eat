<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-3">🍜</div>
        <h1 class="text-2xl font-bold text-warm-700 dark:text-warm-100">注册账号</h1>
        <p class="text-sm text-warm-500 mt-1">加入美食社区，记录每一餐</p>
      </div>

      <!-- 注册表单 -->
      <div class="card-box">
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">用户名</label>
            <input
              v-model="form.username"
              class="input-box text-sm w-full"
              placeholder="2-50个字符，中英文、数字、下划线"
              autocomplete="username"
              @keydown.enter="onRegister"
            />
            <p v-if="usernameHint" class="text-[10px] mt-1" :class="usernameOk ? 'text-green-500' : 'text-warm-400'">{{ usernameHint }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="input-box text-sm w-full"
              placeholder="至少6个字符"
              autocomplete="new-password"
              @keydown.enter="onRegister"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">确认密码</label>
            <input
              v-model="form.confirmPwd"
              type="password"
              class="input-box text-sm w-full"
              placeholder="再次输入密码"
              autocomplete="new-password"
              @keydown.enter="onRegister"
            />
            <p v-if="form.confirmPwd && form.password !== form.confirmPwd" class="text-[10px] text-red-500 mt-1">两次密码不一致</p>
          </div>
          <p v-if="errorMsg" class="text-xs text-red-500 text-center">{{ errorMsg }}</p>
          <button
            class="btn-main w-full py-2.5 text-sm font-semibold"
            :disabled="loading || !formValid"
            @click="onRegister"
          >
            <span v-if="loading" class="inline-block animate-spin mr-1">⏳</span>
            {{ loading ? '注册中...' : '注 册' }}
          </button>
        </div>
      </div>

      <!-- 切换登录 -->
      <p class="text-center text-xs text-warm-500 mt-6">
        已有账号？
        <router-link to="/login" class="text-wheat-600 font-medium hover:underline">立即登录</router-link>
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
const { state, register } = useAuth();

const form = reactive({ username: '', password: '', confirmPwd: '' });
const errorMsg = ref('');
const loading = computed(() => state.loading);

const usernameOk = computed(() => {
  const u = form.username.trim();
  if (!u) return null;
  return u.length >= 2 && u.length <= 50 && /^[a-zA-Z0-9_一-鿿]+$/.test(u);
});

const usernameHint = computed(() => {
  const u = form.username.trim();
  if (!u) return null;
  if (u.length < 2) return '用户名至少2个字符';
  if (!/^[a-zA-Z0-9_一-鿿]+$/.test(u)) return '只能使用中英文、数字和下划线';
  return '✓ 格式正确';
});

const formValid = computed(() => {
  return usernameOk.value && form.password.length >= 6 && form.password === form.confirmPwd;
});

const onRegister = async () => {
  if (!formValid.value || loading.value) return;
  errorMsg.value = '';
  try {
    await register(form.username.trim(), form.password);
    const redirect = route.query.redirect || '/diary';
    router.push(redirect);
  } catch (err) {
    errorMsg.value = err.message || '注册失败';
  }
};
</script>
