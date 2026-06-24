<template>
  <div class="max-w-2xl mx-auto px-4 pt-4 pb-20 animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100">🤖 天帮我选</h1>
        <p class="text-xs text-warm-500">{{ meal.emoji }} {{ meal.label }} · AI美食对话
          <span v-if="auth.isLoggedIn" class="text-wheat-500"> · {{ auth.state.user?.nickname || '' }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <button class="btn-ghost text-xs" @click="onNewChat">+ 新对话</button>
        <select v-if="chatState.sessions.length > 0" v-model="chatState.activeId" class="text-xs rounded-lg border border-warm-200 dark:border-warm-600 bg-white dark:bg-warm-800 px-2 py-1" @change="onSwitch">
          <option :value="null">新对话</option>
          <option v-for="s in chatState.sessions" :key="s.id" :value="s.id">{{ s.title || '未命名' }} ({{ fmtDate(s.updatedAt, 'date') }})</option>
        </select>
      </div>
    </div>

    <!-- 对话区 -->
    <div ref="chatBox" class="card-box mb-4 h-[440px] overflow-y-auto flex flex-col gap-3">
      <!-- 欢迎语 -->
      <div v-if="!msgs.length" class="flex gap-2">
        <span class="w-8 h-8 rounded-full bg-mint-100 dark:bg-mint-800 flex items-center justify-center text-lg flex-shrink-0">🤖</span>
        <div class="bg-warm-50 dark:bg-warm-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%]">
          <p>嗨！我是你的专属美食助手～</p>
          <p class="mt-2">告诉我你的需求，比如「推荐午餐」「想吃辣的」「减脂餐推荐」「50元以内外卖」，我会结合你的饮食记录给你最好的建议！</p>
          <p v-if="auth.isLoggedIn && (profile.tastePrefs?.length || profile.allergies?.length)" class="mt-2 text-xs text-wheat-500">
            👤 已知你的偏好：<span v-if="profile.tastePrefs?.length">爱{{ profile.tastePrefs.join('、') }}</span>
            <span v-if="profile.allergies?.length"> · 忌{{ profile.allergies.join('、') }}</span>
          </p>
        </div>
      </div>

      <!-- 历史消息 -->
      <template v-for="(m, i) in msgs" :key="i">
        <div class="flex gap-2" :class="m.role === 'user' ? 'flex-row-reverse' : ''">
          <span class="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            :class="m.role === 'user' ? 'bg-wheat-200 dark:bg-wheat-800' : 'bg-mint-100 dark:bg-mint-800'">
            {{ m.role === 'user' ? '🧑' : '🤖' }}
          </span>
          <div :class="['rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%]',
            m.role === 'user'
              ? 'bg-wheat-200 dark:bg-wheat-800 rounded-tr-sm text-warm-700 dark:text-warm-100'
              : 'bg-warm-50 dark:bg-warm-700 rounded-tl-sm text-warm-700 dark:text-warm-100']">
            <p style="white-space:pre-wrap">{{ m.content }}</p>

            <!-- 推荐方案卡片 -->
            <div v-if="m.mealPlans?.length" class="flex flex-col gap-2 mt-3">
              <div v-for="(plan, j) in m.mealPlans" :key="j" class="bg-white dark:bg-warm-800 rounded-xl p-3 border border-warm-100 dark:border-warm-700">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-semibold">🥢 方案{{ '一二三四'[j] || j+1 }}</span>
                  <span class="text-[10px] text-warm-500">{{ plan.cuisine }}</span>
                </div>
                <div class="font-semibold text-sm">{{ plan.name }}</div>
                <div class="flex gap-3 mt-1 text-[10px] text-warm-500">
                  <span>💰 {{ plan.budget }}</span>
                  <span>📍 {{ plan.scene }}</span>
                </div>
                <p class="text-xs text-warm-500 mt-1">💡 {{ plan.reason }}</p>
                <button class="mt-2 px-3 py-1 text-xs rounded-lg bg-wheat-300 hover:bg-wheat-400 dark:bg-wheat-600 dark:hover:bg-wheat-500 font-medium transition-colors" @click="onPickPlan(plan.name)">就吃这个</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-if="sending" class="flex gap-2">
        <span class="w-8 h-8 rounded-full bg-mint-100 dark:bg-mint-800 flex items-center justify-center text-lg flex-shrink-0">🤖</span>
        <div class="bg-warm-50 dark:bg-warm-700 rounded-2xl rounded-tl-sm px-4 py-3">
          <div class="flex gap-1"><span class="w-2 h-2 rounded-full bg-warm-400 animate-bounce [animation-delay:0ms]"></span><span class="w-2 h-2 rounded-full bg-warm-400 animate-bounce [animation-delay:150ms]"></span><span class="w-2 h-2 rounded-full bg-warm-400 animate-bounce [animation-delay:300ms]"></span></div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button v-for="chip in chips" :key="chip" class="tag-pill whitespace-nowrap cursor-pointer flex-shrink-0 hover:bg-wheat-300 transition-colors" @click="send(chip)">{{ chip }}</button>
    </div>

    <!-- 输入区 -->
    <div class="flex gap-2 mt-3">
      <input v-model="input" class="input-box flex-1 text-sm" placeholder="输入需求，如：推荐30元以内午餐..." @keydown.enter="send(input)" />
      <button class="btn-main px-4" :disabled="sending || !input.trim()" @click="send(input)">📤</button>
    </div>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { getMealType, fmtDate } from '@/utils/helpers.js'
import { useChat } from '@/stores/useChat.js'
import { useAuth } from '@/stores/useAuth.js'
import { useProfile } from '@/stores/useProfile.js'
import { sendToAI } from '@/utils/deepseekService.js'
import { getRecords } from '@/utils/storage.js'
import Toast from '@/components/Toast.vue'

const auth = useAuth()
const { state: profile } = useProfile()
const meal = computed(() => getMealType())
const { state: chatState, activeSession, addMsg, switchSession, newSession } = useChat()

const input = ref('')
const sending = ref(false)
const chatBox = ref(null)
const toastRef = ref(null)

const msgs = computed(() => {
  try { return activeSession()?.msgs || [] } catch { return [] }
})

const chips = ['📍 附近有什么好吃的？', '☀️ 推荐午餐', '💰 平价大餐', '🥗 推荐减脂餐', '🍃 想吃清淡的', '🌶️ 想吃辣的', '🔄 换个菜系']

const scrollBottom = () => nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })

const send = (text) => {
  if (sending.value || !text?.trim()) return
  const msg = text.trim()
  input.value = ''
  addMsg('user', msg)
  scrollBottom()
  sending.value = true

  const s = activeSession()
  const history = (s?.msgs || []).map(m => ({ role: m.role, content: m.content }))

  // 使用 auth-aware profile（云端同步的偏好）
  const userProfile = auth.isLoggedIn ? {
    tastePrefs: profile.tastePrefs || [],
    allergies: profile.allergies || [],
    budgetRange: profile.budgetRange || [20, 50],
  } : getRecords() // fallback

  sendToAI(msg, history, profile.aiApiKey || '').then(res => {
    addMsg('assistant', res.text, res.mealPlans)
    sending.value = false
    scrollBottom()
    if (res.source === 'deepseek') toastRef.value?.show('DeepSeek AI 推荐 ✓', 'success', 1500)
  }).catch(() => {
    addMsg('assistant', '抱歉，出了点问题，请稍后再试 😢')
    sending.value = false
    scrollBottom()
  })
}

const onPickPlan = (name) => toastRef.value?.show(`选好了！${name}，享受美食吧 🎉`, 'success')
const onNewChat = () => { newSession(); scrollBottom() }
const onSwitch = () => scrollBottom()

watch(msgs, scrollBottom, { deep: true })
</script>
