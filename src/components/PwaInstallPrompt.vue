<template>
  <Teleport to="body">
    <!-- PWA 安装提示 -->
    <Transition name="slide-up">
      <div v-if="showInstall" class="fixed bottom-20 inset-x-0 z-[999] flex justify-center px-4 pointer-events-none">
        <div class="card-box pointer-events-auto flex items-center gap-4 max-w-md w-full shadow-xl animate-float">
          <div class="text-4xl flex-shrink-0">🍜</div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-warm-700 dark:text-warm-100">安装「这顿吃什么」</p>
            <p class="text-xs text-warm-500 mt-0.5">添加到桌面，随时随地使用</p>
          </div>
          <button class="btn-main text-xs px-4 py-2 flex-shrink-0" @click="onInstall">安装</button>
          <button class="text-warm-400 hover:text-warm-600 text-sm flex-shrink-0" @click="showInstall = false">✕</button>
        </div>
      </div>
    </Transition>

    <!-- 更新提示 -->
    <Transition name="slide-up">
      <div v-if="showUpdate" class="fixed bottom-4 inset-x-0 z-[999] flex justify-center px-4 pointer-events-none">
        <div class="card-box pointer-events-auto flex items-center gap-3 max-w-md w-full bg-mint-50 dark:bg-mint-900/30 border border-mint-200 dark:border-mint-700">
          <span class="text-lg">🔄</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-warm-700 dark:text-warm-100">新版本可用</p>
            <p class="text-[10px] text-warm-500">刷新页面即可更新</p>
          </div>
          <button class="btn-main text-xs px-3 py-1.5 flex-shrink-0" @click="onRefresh">立即更新</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showInstall = ref(false);
const showUpdate = ref(false);
let deferredPrompt = null;

onMounted(() => {
  // 监听 beforeinstallprompt（浏览器触发）
  const onBeforeInstall = (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // 延迟显示，避免首次访问就弹
    setTimeout(() => {
      showInstall.value = true;
    }, 3000);
  };

  // 监听 appinstalled（用户已安装）
  const onAppInstalled = () => {
    showInstall.value = false;
    deferredPrompt = null;
    console.log('🍜 PWA: 应用已安装');
  };

  // 监听 SW 更新
  const onSwUpdate = () => {
    showUpdate.value = true;
  };

  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onAppInstalled);
  window.addEventListener('sw-update-available', onSwUpdate);

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    window.removeEventListener('appinstalled', onAppInstalled);
    window.removeEventListener('sw-update-available', onSwUpdate);
  });
});

const onInstall = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  console.log('🍜 PWA: 用户安装选择:', result.outcome);
  deferredPrompt = null;
  showInstall.value = false;
};

const onRefresh = () => {
  showUpdate.value = false;
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage('SKIP_WAITING');
      }
    });
  }
  setTimeout(() => window.location.reload(), 200);
};
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.35s ease-out; }
.slide-up-leave-active { transition: all 0.25s ease-in; }
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
