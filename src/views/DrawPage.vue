<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-20 animate-fade-in-up">
    <!-- 问候 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-warm-700 dark:text-warm-100">{{ greeting.text }}</h1>
      <p class="text-sm text-warm-500 mt-1">{{ greeting.sub }}</p>
      <span class="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-wheat-200 dark:bg-wheat-800 rounded-full text-sm font-medium text-wheat-700 dark:text-wheat-300">
        {{ meal.emoji }} {{ meal.label }}时段
      </span>
    </div>

    <!-- 模式切换 -->
    <div class="flex bg-warm-100 dark:bg-warm-800 rounded-xl p-1 gap-1 mb-6">
      <button v-for="mode in modes" :key="mode.key"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
        :class="curMode === mode.key ? 'bg-white dark:bg-warm-700 text-warm-700 dark:text-warm-100 shadow-sm' : 'text-warm-500'"
        @click="curMode = mode.key; resetAnim()">
        {{ mode.icon }} {{ mode.label }}
      </button>
    </div>

    <!-- 抽签区域 -->
    <div class="card-box text-center py-10 mb-6">
      <div class="transition-transform duration-100" :style="{ transform: `rotate(${animDeg}deg) scale(${animScale})` }">
        <div class="text-7xl mb-4 transition-all duration-100">{{ animEmoji }}</div>
        <p class="text-sm text-warm-500">{{ animText }}</p>
      </div>
      <button class="btn-main mt-8 px-10 py-3 text-base w-full" :disabled="drawing" @click="startDraw">
        🎯 {{ drawing ? '抽签中...' : '开始抽签' }}
      </button>
    </div>

    <!-- 结果弹窗 -->
    <Modal :show="resultShow" :title="resultTitle" @close="resultShow = false">
      <div v-if="result" class="text-center">
        <div class="text-5xl mb-4">🎉</div>
        <h3 class="text-xl font-bold text-warm-700 dark:text-warm-100 mb-3">{{ result.name }}</h3>
        <div class="flex flex-wrap justify-center gap-2 mb-3">
          <span v-for="t in (result.tags || []).slice(0,6)" :key="t" class="tag-mint">{{ t }}</span>
        </div>
        <div v-if="result.rating" class="text-sm mb-2">{{ '⭐'.repeat(Math.floor(result.rating)) }} {{ result.rating }}分</div>
        <p v-if="result.mealTime" class="text-sm text-warm-500">上次品尝：{{ fmtDate(result.mealTime, 'date') }}</p>
        <p v-if="result.note" class="text-sm text-warm-500 italic mt-2">💬 {{ result.note?.slice(0, 80) }}</p>
        <img v-if="result.photos?.[0]" :src="result.photos[0]" class="w-full max-h-48 object-cover rounded-xl mt-3" />
        <p class="text-xs text-warm-400 mt-3">来源：{{ resultSource }}</p>
      </div>
      <template #footer>
        <button class="btn-main flex-1" @click="resultShow = false">就吃这个 ✓</button>
        <button class="btn-outline flex-1" @click="resultShow = false; startDraw()">再抽一次 🔄</button>
        <button class="btn-ghost" @click="resultShow = false; $router.push('/record')">记一笔 📝</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getGreeting, getMealType, fmtDate } from '@/utils/helpers.js'
import { useRecords } from '@/stores/useRecords.js'
import { useProfile } from '@/stores/useProfile.js'
import { FOOD_DB } from '@/utils/foodDatabase.js'
import Modal from '@/components/Modal.vue'

const { state: recordState } = useRecords()
const { state: profile } = useProfile()

const greeting = computed(() => getGreeting())
const meal = computed(() => getMealType())
const modes = [{ key: 'history', icon: '🔄', label: '吃过的' }, { key: 'new', icon: '🎲', label: '没吃过的' }]
const curMode = ref('history')
const drawing = ref(false)
const animEmoji = ref('🥢')
const animText = ref('点击下方按钮开始抽签')
const animDeg = ref('0')
const animScale = ref('1')
const resultShow = ref(false)
const result = ref(null)
const resultTitle = ref('')
const resultSource = ref('')

const resetAnim = () => {
  animEmoji.value = '🥢'; animText.value = '点击下方按钮开始抽签'
  animDeg.value = '0'; animScale.value = '1'
}

const startDraw = () => {
  drawing.value = true
  const emojis = ['🥢','🍜','🍛','🍣','🥘','🍕','🍔','🌮','🥗','🍲']
  let count = 0, max = 15
  const interval = setInterval(() => {
    animEmoji.value = emojis[Math.floor(Math.random() * emojis.length)]
    animText.value = '抽签中...'
    animDeg.value = String((Math.random() - 0.5) * 20)
    animScale.value = String(0.9 + Math.random() * 0.2)
    if (++count >= max) {
      clearInterval(interval)
      animDeg.value = '0'; animScale.value = '1'
      doDraw()
      drawing.value = false
    }
  }, 100)
}

const doDraw = () => {
  if (curMode.value === 'history') {
    const records = recordState.list
    if (!records.length) {
      animText.value = '还没有美食记录哦～'
      animEmoji.value = '📭'
      return
    }
    const r = records[Math.floor(Math.random() * records.length)]
    result.value = { ...r, tags: r.tags || [] }
    resultTitle.value = '🎰 命运选择了...'
    resultSource.value = '你的美食记录'
  } else {
    const all = [...FOOD_DB.map(f => f.n), ...(profile.altFoods || [])]
    const unique = [...new Set(all)]
    const name = unique[Math.floor(Math.random() * unique.length)]
    const info = FOOD_DB.find(f => f.n === name)
    result.value = {
      name, tags: info?.t || [], cuisine: info?.c,
      rating: 0, note: info?.d || '没吃过就试试吧！',
      photos: [], mealTime: null,
    }
    resultTitle.value = '🎲 新的尝试...'
    resultSource.value = '备选食物库'
  }
  resultShow.value = true
  resetAnim()
}
</script>
