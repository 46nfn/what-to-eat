<template>
  <div class="max-w-6xl mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100">🌍 美食广场</h1>
        <p class="text-xs text-warm-500">{{ total }} 篇美食分享</p>
      </div>
    </div>

    <!-- 搜索 & 排序 -->
    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400">🔍</span>
        <input v-model="search" class="input-box pl-9 text-sm" placeholder="搜索美食、标签、地点..." @input="debouncedFetch" />
      </div>
      <button class="tag-pill cursor-pointer flex-shrink-0" :class="sort === 'latest' ? '!bg-wheat-400 !text-warm-700' : ''" @click="sort = 'latest'; fetchCommunity()">🕐 最新</button>
      <button class="tag-pill cursor-pointer flex-shrink-0" :class="sort === 'popular' ? '!bg-wheat-400 !text-warm-700' : ''" @click="sort = 'popular'">🔥 最热</button>
    </div>

    <!-- 空状态 -->
    <div v-if="loading" class="text-center py-20">
      <div class="text-4xl mb-4 animate-float">⏳</div>
      <p class="text-sm text-warm-500">加载中...</p>
    </div>
    <div v-else-if="!list.length" class="text-center py-20">
      <div class="text-5xl mb-4 animate-float">🏜️</div>
      <h3 class="font-semibold text-warm-700 dark:text-warm-100">广场还没有分享</h3>
      <p class="text-sm text-warm-500 mt-1 mb-4">{{ search ? '没有找到匹配的内容' : '记录美食时设为「公开」就会在这展示' }}</p>
      <router-link v-if="!search" to="/record" class="btn-main text-sm">📝 去分享</router-link>
    </div>

    <!-- 瀑布流 -->
    <div v-else class="masonry">
      <FoodCard v-for="r in list" :key="r.id" :record="r" @click="openDetail(r.id)" />
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && list.length > 0" class="text-center mt-6">
      <button class="btn-outline text-sm" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/index.js'
import { useAuth } from '@/stores/useAuth.js'
import FoodCard from '@/components/FoodCard.vue'
import Toast from '@/components/Toast.vue'
import { debounce } from '@/utils/helpers.js'

const router = useRouter()
const { isLoggedIn } = useAuth()
const toastRef = ref(null)
const search = ref('')
const sort = ref('latest')
const list = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = computed(() => list.value.length < total.value)

const normalize = (r) => ({
  ...r,
  mealTime: r.meal_time || r.mealTime,
  mealType: r.meal_type || r.mealType,
  isPublic: r.is_public !== undefined ? !!r.is_public : r.isPublic,
  isFavorite: r.is_favorite !== undefined ? !!r.is_favorite : r.isFavorite,
  isWarning: r.is_warning !== undefined ? !!r.is_warning : r.isWarning,
  aiTags: r.ai_tags || r.aiTags,
  likeCount: r.likeCount || 0,
  saveCount: r.saveCount || 0,
  isLiked: r.isLiked || false,
  isSaved: r.isSaved || false,
  author: r.author || { nickname: r.nickname, avatar: r.avatar },
})

const fetchCommunity = async (append = false) => {
  if (!append) {
    loading.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }

  try {
    // 构建查询参数，空值不传（避免 URLSearchParams 把 undefined → "undefined"）
    const params = { page: page.value, limit: 20 }
    if (search.value) params.search = search.value
    const data = await api.get('/api/community', params)
    const items = (data.list || []).map(normalize)

    if (append) {
      list.value = [...list.value, ...items]
    } else {
      list.value = items
    }
    total.value = data.total || 0

    // 按热度排序（客户端排序，社区 API 返回的是最新排序）
    if (sort.value === 'popular') {
      list.value.sort((a, b) => b.likeCount - a.likeCount)
    }
  } catch (err) {
    console.warn('加载社区失败:', err.message)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  fetchCommunity(true)
}

const debouncedFetch = debounce(() => fetchCommunity(), 300)

const openDetail = (id) => router.push(`/diary/${id}`)

onMounted(() => {
  fetchCommunity()
})
</script>
