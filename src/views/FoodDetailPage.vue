<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <!-- 返回 -->
    <button class="btn-ghost text-sm mb-4" @click="$router.push('/diary')">← 返回日记</button>

    <div v-if="!record" class="text-center py-20 text-warm-500">记录不存在</div>

    <template v-else>
      <!-- 图片轮播 -->
      <div v-if="record.photos?.length" class="relative rounded-2xl overflow-hidden mb-4 bg-warm-100 dark:bg-warm-700">
        <img :src="record.photos[curPhoto]" :alt="record.name" class="w-full max-h-72 object-cover" />
        <div v-if="record.photos.length > 1" class="absolute inset-x-0 bottom-0 p-3 flex items-center justify-center gap-3 bg-gradient-to-t from-black/30 to-transparent">
          <button class="w-8 h-8 rounded-full bg-white/80 dark:bg-warm-800/80 flex items-center justify-center text-sm" @click="prevPhoto">◀</button>
          <span class="text-white text-xs">{{ curPhoto + 1 }} / {{ record.photos.length }}</span>
          <button class="w-8 h-8 rounded-full bg-white/80 dark:bg-warm-800/80 flex items-center justify-center text-sm" @click="nextPhoto">▶</button>
        </div>
      </div>

      <!-- 视频 -->
      <div v-if="record.video" class="mb-4">
        <video :src="record.video" controls class="w-full max-h-64 rounded-xl" />
      </div>

      <!-- 标题 -->
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-2xl font-bold text-warm-700 dark:text-warm-100">
          <span v-if="record.isWarning">⚠️</span>{{ record.name }}
        </h1>
        <span class="text-2xl">{{ mealEmoji(record.mealType) }}</span>
      </div>

      <!-- 评分 -->
      <div v-if="record.rating" class="mb-3 text-lg">{{ '⭐'.repeat(Math.floor(record.rating)) }} <span class="text-sm text-warm-500">{{ record.rating }}分</span></div>

      <!-- 基础信息 -->
      <div class="card-box mb-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-warm-500">🕐 就餐时间</span><p class="font-medium">{{ fmtDate(record.mealTime, 'full') }}</p></div>
          <div><span class="text-warm-500">🍽️ 餐段</span><p class="font-medium">{{ mealEmoji(record.mealType) }} {{ record.mealType }}</p></div>
          <div v-if="record.price"><span class="text-warm-500">💰 人均</span><p class="font-medium">¥{{ record.price }}</p></div>
          <div v-if="record.location?.name || record.location?.address">
            <span class="text-warm-500">📍 地点</span>
            <p class="font-medium">{{ record.location?.name || record.location?.address?.slice(0,20) }}</p>
          </div>
        </div>
        <div v-if="record.location?.address" class="mt-2 text-xs text-warm-500">
          详细地址：{{ record.location.address }}
        </div>
      </div>

      <!-- 笔记 -->
      <div v-if="record.note" class="card-box mb-4">
        <h3 class="text-sm font-semibold mb-2">💬 心得体会</h3>
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ record.note }}</p>
      </div>

      <!-- 标签 -->
      <div class="card-box mb-4">
        <h3 class="text-sm font-semibold mb-2">🏷️ 标签</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="t in record.tags" :key="t" class="tag-mint">{{ t }}</span>
          <span v-for="t in record.aiTags" :key="t" class="tag-pill">🤖 {{ t }}</span>
          <span v-if="!record.tags?.length && !record.aiTags?.length" class="text-xs text-warm-500">暂无标签</span>
        </div>
      </div>

      <!-- 状态标记 -->
      <div class="card-box mb-4">
        <h3 class="text-sm font-semibold mb-2">📌 状态</h3>
        <div class="flex flex-wrap gap-2">
          <span class="tag-coral" v-if="record.isFavorite">⭐ 已收藏</span>
          <span class="tag-coral" v-if="record.isWarning">⚠️ 避雷</span>
          <span class="tag-mint" v-if="record.isPublic">🌍 公开分享</span>
          <span class="tag-pill" v-else>🔒 私密</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button class="btn-main flex-1" @click="$router.push(`/record?edit=${record.id}`)">✏️ 编辑</button>
        <button class="btn-outline flex-1" @click="togglePublic">{{ record.isPublic ? '🔒 设为私密' : '🌍 设为公开' }}</button>
        <button class="btn-ghost text-red-400" @click="onDelete">🗑️ 删除</button>
      </div>
    </template>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecords } from '@/stores/useRecords.js'
import { fmtDate, mealEmoji } from '@/utils/helpers.js'
import Toast from '@/components/Toast.vue'

const route = useRoute(); const router = useRouter()
const { getById, update, remove } = useRecords()
const toastRef = ref(null)
const record = ref(null)
const curPhoto = ref(0)

onMounted(() => {
  record.value = getById(route.params.id)
  if (!record.value) toastRef.value?.show('记录不存在', 'error')
})

const prevPhoto = () => { if (record.value?.photos?.length) curPhoto.value = (curPhoto.value - 1 + record.value.photos.length) % record.value.photos.length }
const nextPhoto = () => { if (record.value?.photos?.length) curPhoto.value = (curPhoto.value + 1) % record.value.photos.length }

const togglePublic = () => {
  update(record.value.id, { isPublic: !record.value.isPublic })
  record.value = getById(record.value.id)
  toastRef.value?.show(record.value.isPublic ? '已设为公开' : '已设为私密', 'success')
}

const onDelete = () => {
  if (confirm('确认删除？不可恢复。')) {
    remove(record.value.id)
    toastRef.value?.show('已删除', 'success')
    setTimeout(() => router.push('/diary'), 400)
  }
}
</script>
