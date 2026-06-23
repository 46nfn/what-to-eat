<template>
  <div class="card-box cursor-pointer group" @click="$emit('click', record)">
    <!-- 图片 -->
    <div v-if="record.photos?.length" class="relative rounded-xl overflow-hidden mb-3 aspect-[4/3] bg-warm-100 dark:bg-warm-700">
      <img :src="record.photos[0]" :alt="record.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      <span v-if="record.photos.length > 1" class="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">{{ record.photos.length }}张</span>
      <span v-if="record.video" class="absolute top-2 right-2 bg-black/40 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">▶</span>
    </div>

    <!-- 头部 -->
    <div class="flex items-start justify-between gap-2">
      <h4 class="font-semibold text-sm truncate flex-1">
        <span v-if="record.isWarning">⚠️</span>
        <span v-if="record.isFavorite">⭐</span>
        {{ record.name }}
      </h4>
      <span class="text-base flex-shrink-0">{{ mealEmoji(record.mealType) }}</span>
    </div>

    <!-- 评分 -->
    <div v-if="record.rating" class="mt-1 text-xs">
      <span v-for="i in 5" :key="i">{{ i <= Math.floor(record.rating) ? '⭐' : '☆' }}</span>
    </div>

    <!-- 笔记 -->
    <p v-if="record.note" class="text-xs text-warm-500 dark:text-warm-400 mt-1.5 line-clamp-2">{{ record.note }}</p>

    <!-- 标签 -->
    <div class="flex flex-wrap gap-1 mt-2">
      <span v-for="t in (record.tags || []).slice(0, 3)" :key="t" class="tag-mint text-[10px]">{{ t }}</span>
      <span v-for="t in (record.aiTags || []).slice(0, 2)" :key="t" class="tag-pill text-[10px]">🤖 {{ t }}</span>
    </div>

    <!-- 元信息 -->
    <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10px] text-warm-400">
      <span v-if="record.location?.name || record.location?.address">📍 {{ record.location?.name || record.location?.address?.slice(0,10) }}</span>
      <span>🕐 {{ fmtDate(record.mealTime, 'short') }}</span>
      <span v-if="record.price">💰 ¥{{ record.price }}</span>
    </div>

    <!-- 操作栏 -->
    <div class="flex gap-3 mt-3 pt-3 border-t border-warm-100 dark:border-warm-700">
      <button class="flex items-center gap-1 text-xs text-warm-500 hover:text-coral-400 transition-colors" @click.stop="onLike">
        <span :class="{ 'animate-heartbeat': justLiked }">{{ liked ? '❤️' : '🤍' }}</span> {{ likes }}
      </button>
      <button class="flex items-center gap-1 text-xs text-warm-500 hover:text-coral-400 transition-colors" @click.stop="onSave">
        {{ saved ? '🔖' : '🏷️' }} {{ saved ? '已收藏' : '收藏' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { fmtDate, mealEmoji } from '@/utils/helpers.js'
import { toggleLike, toggleSave, getInteraction } from '@/utils/storage.js'

const props = defineProps({ record: Object })
defineEmits(['click'])

const interaction = computed(() => getInteraction(props.record.id))
const liked = computed(() => interaction.value.liked)
const saved = computed(() => interaction.value.saved)
const likes = computed(() => interaction.value.likes)
const justLiked = ref(false)

const onLike = () => {
  toggleLike(props.record.id)
  justLiked.value = true
  setTimeout(() => justLiked.value = false, 400)
}
const onSave = () => { toggleSave(props.record.id) }
</script>
