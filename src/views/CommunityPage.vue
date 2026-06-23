<template>
  <div class="max-w-6xl mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100">🌍 美食广场</h1>
        <p class="text-xs text-warm-500">{{ filtered.length }} 篇美食分享</p>
      </div>
    </div>

    <!-- 搜索 & 排序 -->
    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400">🔍</span>
        <input v-model="search" class="input-box pl-9 text-sm" placeholder="搜索美食、标签、地点..." />
      </div>
      <button class="tag-pill cursor-pointer flex-shrink-0" :class="sort === 'latest' ? '!bg-wheat-400 !text-warm-700' : ''" @click="sort = 'latest'">🕐 最新</button>
      <button class="tag-pill cursor-pointer flex-shrink-0" :class="sort === 'popular' ? '!bg-wheat-400 !text-warm-700' : ''" @click="sort = 'popular'">🔥 最热</button>
    </div>

    <!-- 空状态 -->
    <div v-if="!filtered.length" class="text-center py-20">
      <div class="text-5xl mb-4 animate-float">🏜️</div>
      <h3 class="font-semibold text-warm-700 dark:text-warm-100">广场还没有分享</h3>
      <p class="text-sm text-warm-500 mt-1 mb-4">{{ search ? '没有找到匹配的内容' : '记录美食时设为「公开」就会在这展示' }}</p>
      <router-link v-if="!search" to="/record" class="btn-main text-sm">📝 去分享</router-link>
    </div>

    <!-- 瀑布流 -->
    <div v-else class="masonry">
      <FoodCard v-for="r in filtered" :key="r.id" :record="r" @click="openDetail(r.id)" />
    </div>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecords } from '@/stores/useRecords.js'
import { getInteraction } from '@/utils/storage.js'
import FoodCard from '@/components/FoodCard.vue'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const { publicList } = useRecords()
const toastRef = ref(null)
const search = ref('')
const sort = ref('latest')

const filtered = computed(() => {
  let list = [...publicList.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => (r.name + ' ' + (r.tags||[]).join(' ') + ' ' + (r.location?.address||'') + ' ' + (r.note||'')).toLowerCase().includes(q))
  }
  if (sort.value === 'popular') list.sort((a, b) => (getInteraction(b.id)?.likes || 0) - (getInteraction(a.id)?.likes || 0))
  else list.sort((a, b) => new Date(b.mealTime) - new Date(a.mealTime))
  return list
})

const openDetail = (id) => router.push(`/diary/${id}`)
</script>
