<template>
  <div class="max-w-3xl mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100">📖 美食日记</h1>
        <p class="text-xs text-warm-500">{{ filtered.length }} 条记录</p>
      </div>
      <router-link to="/record" class="btn-main text-sm">+ 新记录</router-link>
    </div>

    <!-- 视图切换 -->
    <div class="flex gap-1 bg-warm-100 dark:bg-warm-800 rounded-xl p-1 mb-3">
      <button v-for="v in views" :key="v.key" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
        :class="curView === v.key ? 'bg-white dark:bg-warm-700 shadow-sm text-warm-700 dark:text-warm-100' : 'text-warm-500'"
        @click="curView = v.key">{{ v.icon }} {{ v.label }}</button>
    </div>

    <!-- 搜索 & 筛选 -->
    <div class="flex gap-2 mb-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400">🔍</span>
        <input v-model="search" class="input-box pl-9 text-sm" placeholder="搜索菜名、标签、地址..." />
      </div>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
      <button v-for="f in filters" :key="f.key" class="tag-pill whitespace-nowrap cursor-pointer flex-shrink-0"
        :class="activeFilter === f.key ? '!bg-wheat-400 !text-warm-700' : ''"
        @click="activeFilter = f.key">{{ f.label }}</button>
    </div>

    <!-- 时间线视图 -->
    <template v-if="curView === 'timeline'">
      <div v-if="!filtered.length" class="text-center py-20">
        <div class="text-5xl mb-4 animate-float">📭</div>
        <h3 class="font-semibold text-warm-700 dark:text-warm-100">还没有美食记录</h3>
        <p class="text-sm text-warm-500 mt-1 mb-4">{{ search ? '没有找到匹配的记录' : '快去记录你今天吃的美食吧！' }}</p>
        <router-link v-if="!search" to="/record" class="btn-main text-sm">📝 开始记录</router-link>
      </div>
      <div v-else>
        <template v-for="(items, group) in groupedRecords" :key="group">
          <div class="text-sm font-semibold text-wheat-600 dark:text-wheat-400 mb-3 mt-5 first:mt-0 pl-1">{{ group }}</div>
          <div class="flex flex-col gap-3">
            <div v-for="r in items" :key="r.id" class="card-box flex gap-3 items-start cursor-pointer" @click="openDetail(r.id)">
              <div v-if="r.photos?.length" class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-warm-700">
                <img :src="r.photos[0]" :alt="r.name" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-sm truncate">{{ r.isWarning ? '⚠️ ' : '' }}{{ r.name }}</span>
                  <span class="text-sm flex-shrink-0">{{ mealEmoji(r.mealType) }}</span>
                </div>
                <div v-if="r.rating" class="text-xs mt-0.5">{{ '⭐'.repeat(Math.floor(r.rating)) }}</div>
                <p v-if="r.note" class="text-xs text-warm-500 line-clamp-1 mt-0.5">{{ r.note }}</p>
                <div class="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] text-warm-400">
                  <span>{{ fmtDate(r.mealTime, 'time') }}</span>
                  <span v-if="r.location?.name">📍 {{ r.location.name }}</span>
                  <span v-if="r.price">¥{{ r.price }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1 flex-shrink-0">
                <button class="text-xs px-2 py-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors" @click.stop="openEdit(r.id)">✏️</button>
                <button class="text-xs px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" @click.stop="onDelete(r.id)">🗑️</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- 相册视图 -->
    <template v-if="curView === 'album'">
      <div v-if="!photoRecords.length" class="text-center py-20">
        <div class="text-5xl mb-4">📷</div><p class="text-sm text-warm-500">还没有美食照片</p>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div v-for="r in photoRecords" :key="r.id" class="relative aspect-square rounded-xl overflow-hidden cursor-pointer group" @click="openDetail(r.id)">
          <img :src="r.photos[0]" :alt="r.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
            <p class="text-white text-xs font-medium truncate">{{ r.name }}</p>
            <p class="text-white/70 text-[10px]">{{ fmtDate(r.mealTime, 'date') }}</p>
          </div>
          <span v-if="r.photos.length > 1" class="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">+{{ r.photos.length-1 }}</span>
        </div>
      </div>
    </template>

    <!-- 地图视图 -->
    <template v-if="curView === 'map'">
      <div v-if="!locRecords.length" class="text-center py-20">
        <div class="text-5xl mb-4">🗺️</div><p class="text-sm text-warm-500">还没有地点足迹</p>
      </div>
      <div v-else>
        <div class="card-box text-center py-8 mb-4 bg-mint-50 dark:bg-mint-900/20">
          <div class="text-4xl mb-2">🗺️</div>
          <p class="font-semibold">共 {{ locRecords.length }} 个美食地点</p>
          <p class="text-xs text-warm-500">点击下方卡片查看详情</p>
        </div>
        <div class="flex flex-col gap-3">
          <div v-for="r in locRecords" :key="r.id" class="card-box flex gap-3 items-center cursor-pointer" @click="openDetail(r.id)">
            <div v-if="r.photos?.[0]" class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"><img :src="r.photos[0]" class="w-full h-full object-cover" /></div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm">{{ r.name }}</p>
              <p class="text-xs text-warm-500 truncate">📍 {{ r.location?.address || `${r.location?.lat?.toFixed(4)},${r.location?.lng?.toFixed(4)}` }}</p>
              <p class="text-[10px] text-warm-400">{{ fmtDate(r.mealTime, 'short') }}{{ r.location?.name ? ' · ' + r.location.name : '' }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecords } from '@/stores/useRecords.js'
import { useAuth } from '@/stores/useAuth.js'
import { fmtDate, dateGroup, mealEmoji } from '@/utils/helpers.js'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const { state, remove, loadFromServer } = useRecords()
const { isLoggedIn } = useAuth()
const toastRef = ref(null)
const curView = ref('timeline')
const search = ref('')
const activeFilter = ref('all')

onMounted(async () => {
  if (isLoggedIn.value) {
    await loadFromServer()
  }
})

const views = [
  { key: 'timeline', icon: '📋', label: '时间线' },
  { key: 'album', icon: '🖼️', label: '相册' },
  { key: 'map', icon: '🗺️', label: '地图' },
]
const filters = [
  { key: 'all', label: '全部' }, { key: 'breakfast', label: '🌅 早餐' },
  { key: 'lunch', label: '☀️ 午餐' }, { key: 'dinner', label: '🌇 晚餐' },
  { key: 'supper', label: '🌙 夜宵' }, { key: 'favorite', label: '⭐ 收藏' },
  { key: 'warning', label: '⚠️ 避雷' },
]

const filtered = computed(() => {
  let list = [...state.list]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => (r.name + ' ' + (r.tags||[]).join(' ') + ' ' + (r.location?.address||'') + ' ' + (r.note||'')).toLowerCase().includes(q))
  }
  if (activeFilter.value === 'favorite') list = list.filter(r => r.isFavorite)
  else if (activeFilter.value === 'warning') list = list.filter(r => r.isWarning)
  else if (activeFilter.value !== 'all') list = list.filter(r => r.mealType === activeFilter.value)
  return list
})

const groupedRecords = computed(() => {
  const groups = {}
  filtered.value.forEach(r => {
    const g = dateGroup(r.mealTime)
    if (!groups[g]) groups[g] = []
    groups[g].push(r)
  })
  return groups
})

const photoRecords = computed(() => filtered.value.filter(r => r.photos?.length))
const locRecords = computed(() => filtered.value.filter(r => r.location?.lat || r.location?.address))

const openDetail = (id) => router.push(`/diary/${id}`)
const openEdit = (id) => router.push(`/record?edit=${id}`)
const onDelete = async (id) => {
  if (confirm('确认删除这条记录？')) { remove(id); toastRef.value?.show('已删除', 'success') }
}
</script>
