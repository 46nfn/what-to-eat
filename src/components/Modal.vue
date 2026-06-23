<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-warm-700/30 dark:bg-black/50" @click.self="$emit('close')">
        <div class="bg-white dark:bg-warm-800 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl animate-bounce-in">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 class="text-lg font-semibold text-warm-700 dark:text-warm-100">{{ title }}</h3>
            <button class="w-9 h-9 rounded-full bg-warm-50 dark:bg-warm-700 flex items-center justify-center text-warm-400 hover:bg-red-50 hover:text-red-400 transition-colors" @click="$emit('close')">&times;</button>
          </div>
          <div class="px-5 pb-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 pb-5 flex gap-3 justify-end">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean, title: String })
defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
