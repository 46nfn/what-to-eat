<template>
  <div class="flex items-center gap-0.5 cursor-pointer select-none">
    <span v-for="i in 5" :key="i" class="text-2xl transition-transform duration-200 hover:scale-110"
      :class="{ 'scale-115': i <= hover || (hover === 0 && i <= model) }"
      @click="$emit('update:modelValue', i)"
      @mouseenter="hover = i"
      @mouseleave="hover = 0">
      {{ i <= (hover || model) ? '⭐' : '☆' }}
    </span>
    <span class="ml-2 text-sm text-warm-500">{{ model > 0 ? model + '分' : '点击评分' }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ modelValue: { type: Number, default: 0 } })
defineEmits(['update:modelValue'])
const hover = ref(0)
</script>
