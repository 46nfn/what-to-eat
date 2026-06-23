<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="fixed top-5 left-1/2 z-[9999] -translate-x-1/2">
        <div :class="[
          'px-5 py-3 rounded-xl shadow-lg text-sm font-medium whitespace-nowrap',
          type === 'success' && 'bg-mint-500 text-white',
          type === 'error' && 'bg-red-400 text-white',
          type === 'warn' && 'bg-coral-400 text-white',
          type === 'info' && 'bg-warm-700 text-white dark:bg-warm-200 dark:text-warm-800',
        ]">{{ msg }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const msg = ref('')
const type = ref('info')
let timer = null

const show = (m, t = 'info', ms = 2000) => {
  clearTimeout(timer)
  msg.value = m; type.value = t; visible.value = true
  timer = setTimeout(() => { visible.value = false }, ms)
}

defineExpose({ show })
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
