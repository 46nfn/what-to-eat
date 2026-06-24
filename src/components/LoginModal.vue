<template>
  <Modal :show="show" title="" @close="$emit('close')" :closable="!loading">
    <div class="text-center mb-4">
      <div class="text-4xl mb-2">🍜</div>
      <h2 class="text-lg font-bold text-warm-700 dark:text-warm-100">{{ isRegister ? '注册账号' : '欢迎回来' }}</h2>
      <p class="text-xs text-warm-500 mt-0.5">{{ isRegister ? '加入美食社区，记录每一餐' : '登录以同步你的美食数据' }}</p>
    </div>

    <div class="flex flex-col gap-3">
      <!-- 用户名 -->
      <div>
        <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">用户名</label>
        <input
          v-model="form.username"
          class="input-box text-sm w-full"
          :placeholder="isRegister ? '2-50字符，中英文、数字、下划线' : '请输入用户名'"
          autocomplete="username"
          @keydown.enter="onSubmit"
        />
        <p v-if="isRegister && usernameHint" class="text-[10px] mt-1" :class="usernameOk ? 'text-green-500' : 'text-warm-400'">{{ usernameHint }}</p>
      </div>

      <!-- 密码 -->
      <div>
        <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">密码</label>
        <input
          v-model="form.password"
          type="password"
          class="input-box text-sm w-full"
          :placeholder="isRegister ? '至少6个字符' : '请输入密码'"
          autocomplete="current-password"
          @keydown.enter="onSubmit"
        />
      </div>

      <!-- 注册: 确认密码 -->
      <div v-if="isRegister">
        <label class="text-xs font-medium text-warm-600 dark:text-warm-300 mb-1 block">确认密码</label>
        <input
          v-model="form.confirmPwd"
          type="password"
          class="input-box text-sm w-full"
          placeholder="再次输入密码"
          autocomplete="new-password"
          @keydown.enter="onSubmit"
        />
        <p v-if="form.confirmPwd && form.password !== form.confirmPwd" class="text-[10px] text-red-500 mt-1">两次密码不一致</p>
      </div>

      <!-- 错误信息 -->
      <p v-if="errorMsg" class="text-xs text-red-500 text-center">{{ errorMsg }}</p>

      <!-- 提交按钮 -->
      <button
        class="btn-main w-full py-2.5 text-sm font-semibold"
        :disabled="loading || !formValid"
        @click="onSubmit"
      >
        <span v-if="loading" class="inline-block animate-spin mr-1">⏳</span>
        {{ loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注 册' : '登 录') }}
      </button>
    </div>

    <!-- 切换登录/注册 -->
    <p class="text-center text-xs text-warm-500 mt-4">
      {{ isRegister ? '已有账号？' : '还没有账号？' }}
      <button class="text-wheat-600 font-medium hover:underline" @click="toggleMode">
        {{ isRegister ? '立即登录' : '立即注册' }}
      </button>
    </p>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAuth } from '@/stores/useAuth.js';
import Modal from '@/components/Modal.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  /** 'login' | 'register' */
  mode: { type: String, default: 'login' },
});

const emit = defineEmits(['close', 'success']);

const { state, login, register } = useAuth();

const isRegister = ref(props.mode === 'register');
const errorMsg = ref('');
const loading = computed(() => state.loading);

const form = reactive({ username: '', password: '', confirmPwd: '' });

// 重置表单
watch(() => props.show, (val) => {
  if (val) {
    form.username = '';
    form.password = '';
    form.confirmPwd = '';
    errorMsg.value = '';
    isRegister.value = props.mode === 'register';
  }
});

const usernameOk = computed(() => {
  const u = form.username.trim();
  if (!u || !isRegister.value) return null;
  return u.length >= 2 && u.length <= 50 && /^[a-zA-Z0-9_一-鿿]+$/.test(u);
});

const usernameHint = computed(() => {
  const u = form.username.trim();
  if (!u || !isRegister.value) return null;
  if (u.length < 2) return '用户名至少2个字符';
  if (!/^[a-zA-Z0-9_一-鿿]+$/.test(u)) return '只能使用中英文、数字和下划线';
  return '✓ 格式正确';
});

const formValid = computed(() => {
  if (isRegister.value) {
    return usernameOk.value && form.password.length >= 6 && form.password === form.confirmPwd;
  }
  return form.username.trim() && form.password.trim();
});

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  form.password = '';
  form.confirmPwd = '';
  errorMsg.value = '';
};

const onSubmit = async () => {
  if (!formValid.value || loading.value) return;
  errorMsg.value = '';
  try {
    if (isRegister.value) {
      await register(form.username.trim(), form.password);
    } else {
      await login(form.username.trim(), form.password);
    }
    emit('success');
    emit('close');
  } catch (err) {
    errorMsg.value = err.message || (isRegister.value ? '注册失败' : '登录失败');
  }
};
</script>
