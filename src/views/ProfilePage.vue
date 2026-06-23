<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100 mb-4">👤 个人中心</h1>

    <!-- 个人卡片 -->
    <div class="card-box mb-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-wheat-100 dark:bg-wheat-800 flex items-center justify-center text-3xl flex-shrink-0">{{ profile.avatar }}</div>
        <div class="flex-1 min-w-0">
          <h2 class="font-bold text-lg truncate">{{ profile.nickname }}</h2>
          <p class="text-xs text-warm-500 truncate">{{ profile.bio || '这个人很懒，什么都没写...' }}</p>
        </div>
        <button class="btn-outline text-xs flex-shrink-0" @click="showEditProfile = true">✏️ 编辑</button>
      </div>
      <div class="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-warm-100 dark:border-warm-700">
        <div class="text-center"><div class="text-lg font-bold text-wheat-600">{{ stats.total }}</div><div class="text-[10px] text-warm-500">美食记录</div></div>
        <div class="text-center"><div class="text-lg font-bold text-wheat-600">{{ stats.public }}</div><div class="text-[10px] text-warm-500">公开分享</div></div>
        <div class="text-center"><div class="text-lg font-bold text-wheat-600">{{ stats.faves }}</div><div class="text-[10px] text-warm-500">收藏</div></div>
        <div class="text-center"><div class="text-lg font-bold text-wheat-600">{{ stats.warns }}</div><div class="text-[10px] text-warm-500">避雷</div></div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="card-box mb-4 divide-y divide-warm-100 dark:divide-warm-700 overflow-hidden">
      <div class="flex items-center gap-3 py-3 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-700/50 px-2 -mx-2 rounded-lg transition-colors" @click="showAltFoods = true">
        <span class="text-xl">🎲</span><span class="flex-1 text-sm font-medium">备选食物清单</span><span class="text-warm-400">›</span>
      </div>
      <div class="flex items-center gap-3 py-3 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-700/50 px-2 -mx-2 rounded-lg transition-colors" @click="openList('warn')">
        <span class="text-xl">⚠️</span><span class="flex-1 text-sm font-medium">避雷清单</span><span class="text-warm-400">›</span>
      </div>
      <div class="flex items-center gap-3 py-3 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-700/50 px-2 -mx-2 rounded-lg transition-colors" @click="openList('fav')">
        <span class="text-xl">⭐</span><span class="flex-1 text-sm font-medium">收藏清单</span><span class="text-warm-400">›</span>
      </div>
    </div>

    <!-- 偏好设置 -->
    <div class="card-box mb-4">
      <h3 class="text-sm font-semibold mb-3">🍽️ 口味与偏好</h3>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between"><span class="text-sm">口味偏好</span><button class="text-xs text-wheat-600" @click="showTagEditor('taste')">编辑</button></div>
        <div class="flex flex-wrap gap-1">
          <span v-if="!profile.tastePrefs?.length" class="text-xs text-warm-400">未设置</span>
          <span v-for="t in profile.tastePrefs" :key="t" class="tag-coral text-[10px]">{{ t }}</span>
        </div>
        <div class="flex items-center justify-between"><span class="text-sm">忌口/过敏</span><button class="text-xs text-wheat-600" @click="showTagEditor('allergy')">编辑</button></div>
        <div class="flex flex-wrap gap-1">
          <span v-if="!profile.allergies?.length" class="text-xs text-warm-400">未设置</span>
          <span v-for="t in profile.allergies" :key="t" class="tag-coral text-[10px]">⚠️ {{ t }}</span>
        </div>
        <div class="flex items-center justify-between"><span class="text-sm">常用地址</span><button class="text-xs text-wheat-600" @click="showAddrEditor = true">编辑</button></div>
        <div>
          <span v-if="!profile.addresses?.length" class="text-xs text-warm-400">未设置</span>
          <div v-for="a in profile.addresses" :key="a.name" class="text-xs text-warm-500">📍 {{ a.name }}: {{ a.address || '未设' }}</div>
        </div>
      </div>
    </div>

    <!-- 外观 -->
    <div class="card-box mb-4">
      <h3 class="text-sm font-semibold mb-3">🎨 外观设置</h3>
      <div class="flex items-center justify-between mb-3"><span class="text-sm">主题</span>
        <div class="flex gap-1">
          <button v-for="t in ['light','dark','system']" :key="t" class="tag-pill cursor-pointer" :class="theme === t ? '!bg-wheat-400' : ''" @click="setTheme(t)">{{ {light:'☀️浅',dark:'🌙深',system:'💻系统'}[t] }}</button>
        </div>
      </div>
      <div class="flex items-center justify-between"><span class="text-sm">字体</span>
        <div class="flex gap-1">
          <button v-for="s in ['small','medium','large']" :key="s" class="tag-pill cursor-pointer" :class="fontSize === s ? '!bg-wheat-400' : ''" @click="setFont(s)">{{ {small:'小',medium:'中',large:'大'}[s] }}</button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card-box mb-4">
      <h3 class="text-sm font-semibold mb-3">💾 数据管理</h3>
      <div class="flex flex-col gap-2">
        <button class="btn-outline text-sm w-full" @click="exportData">📥 导出全部数据</button>
        <button class="btn-outline text-sm w-full" @click="impFile.click()">📤 导入数据恢复</button>
        <button class="btn-ghost text-sm w-full !text-red-400" @click="onClearAll">🗑️ 清除全部数据</button>
        <input ref="impFile" type="file" accept=".json" hidden @change="importData" />
      </div>
    </div>

    <!-- 关于 -->
    <div class="text-center text-xs text-warm-400 py-4">
      <p>「这顿吃什么」v2.0</p><p>美食记录 & 决策轻社区 🌿</p><p>数据存储于浏览器本地 · 安全私密</p>
    </div>

    <!-- 编辑资料弹窗 -->
    <Modal :show="showEditProfile" title="✏️ 编辑资料" @close="showEditProfile = false">
      <div class="flex flex-col gap-3">
        <div>
          <label class="text-xs font-medium mb-1 block">选择头像</label>
          <div class="flex flex-wrap gap-1">
            <span v-for="a in avatars" :key="a" class="text-2xl cursor-pointer p-1 rounded-lg" :class="profile.avatar === a ? 'bg-wheat-200' : ''" @click="profile.avatar = a">{{ a }}</span>
          </div>
        </div>
        <div><label class="text-xs font-medium mb-1 block">昵称</label><input v-model="profile.nickname" class="input-box text-sm" /></div>
        <div><label class="text-xs font-medium mb-1 block">签名</label><input v-model="profile.bio" class="input-box text-sm" /></div>
        <div><label class="text-xs font-medium mb-1 block">DeepSeek API Key（可选）</label><input v-model="profile.aiApiKey" class="input-box text-sm" type="password" placeholder="sk-... 不填则用本地引擎" /></div>
      </div>
      <template #footer><button class="btn-main flex-1" @click="saveProfile">保存</button></template>
    </Modal>

    <!-- 标签编辑弹窗 -->
    <Modal :show="tagEditor.show" :title="tagEditor.title" @close="tagEditor.show = false">
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-1">
          <span v-for="s in tagEditor.suggestions" :key="s" class="tag-pill cursor-pointer" :class="tagEditor.items.includes(s) ? '!bg-wheat-400' : ''" @click="toggleTag(s)">{{ tagEditor.items.includes(s) ? '✓ ' : '' }}{{ s }}</span>
        </div>
        <div class="flex gap-2 mt-2"><input v-model="tagEditor.input" class="input-box flex-1 text-sm" placeholder="自定义，回车添加" @keydown.enter="addCustomTag" /><button class="btn-main text-xs" @click="addCustomTag">添加</button></div>
        <div class="flex flex-wrap gap-1 mt-2"><span v-for="(t,i) in tagEditor.items" :key="i" class="tag-coral cursor-pointer" @click="tagEditor.items.splice(i,1)">{{ t }} ×</span></div>
      </div>
      <template #footer><button class="btn-main flex-1" @click="saveTags">保存</button></template>
    </Modal>

    <!-- 地址编辑弹窗 -->
    <Modal :show="showAddrEditor" title="📍 常用地址" @close="showAddrEditor = false">
      <div class="flex flex-col gap-2">
        <div v-for="(a,i) in profile.addresses" :key="i" class="flex gap-2 items-center">
          <input v-model="a.name" class="input-box text-sm flex-1" placeholder="名称" />
          <input v-model="a.address" class="input-box text-sm flex-[2]" placeholder="地址" />
          <button class="text-red-400" @click="profile.addresses.splice(i,1)">🗑️</button>
        </div>
        <button class="btn-outline text-sm" @click="profile.addresses.push({name:'',address:''})">+ 添加地址</button>
      </div>
      <template #footer><button class="btn-main flex-1" @click="saveAddrs">保存</button></template>
    </Modal>

    <!-- 列表弹窗 -->
    <Modal :show="listModal.show" :title="listModal.title" @close="listModal.show = false">
      <div v-if="!listModal.items.length" class="text-center py-8 text-sm text-warm-500">这里还没有内容</div>
      <div v-for="r in listModal.items" :key="r.id" class="flex items-center justify-between py-2 border-b border-warm-50 dark:border-warm-700 cursor-pointer" @click="$router.push(`/diary/${r.id}`); listModal.show = false">
        <div><div class="text-sm font-medium">{{ r.name }}</div><div class="text-[10px] text-warm-500">{{ fmtDate(r.mealTime, 'date') }} · {{ r.mealType }}</div></div>
        <img v-if="r.photos?.[0]" :src="r.photos[0]" class="w-10 h-10 rounded-lg object-cover" />
      </div>
    </Modal>

    <!-- 备选食物弹窗 -->
    <Modal :show="showAltFoods" title="🎲 备选食物清单" @close="showAltFoods = false">
      <div class="flex gap-2 mb-3"><input v-model="altInput" class="input-box flex-1 text-sm" placeholder="添加备选食物..." @keydown.enter="addAlt" /><button class="btn-main text-xs" @click="addAlt">添加</button></div>
      <div v-if="!profile.altFoods?.length" class="text-sm text-warm-500 text-center py-4">暂无，添加后可用于「没吃过的」抽签</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="(f,i) in profile.altFoods" :key="i" class="flex items-center justify-between px-3 py-2 bg-warm-50 dark:bg-warm-700 rounded-lg">
          <span class="text-sm">🍽️ {{ f }}</span>
          <button class="text-red-400 text-sm" @click="profile.altFoods.splice(i,1); saveProfile()">🗑️</button>
        </div>
      </div>
      <template #footer><button class="btn-main flex-1" @click="saveProfile(); showAltFoods = false">完成</button></template>
    </Modal>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useProfile } from '@/stores/useProfile.js'
import { useRecords } from '@/stores/useRecords.js'
import { exportAll, importAll, clearAll } from '@/utils/storage.js'
import Modal from '@/components/Modal.vue'
import Toast from '@/components/Toast.vue'
import { fmtDate } from '@/utils/helpers.js'

const { state: profile } = useProfile()
const { state: recordState } = useRecords()
const toastRef = ref(null)
const showEditProfile = ref(false)
const showAddrEditor = ref(false)
const showAltFoods = ref(false)
const theme = ref(profile.theme || 'light')
const fontSize = ref(profile.fontSize || 'medium')
const altInput = ref('')
const impFile = ref(null)

const avatars = ['🍜','🍛','🍣','🥘','🍕','🍔','🌮','🥗','🍲','🧑‍🍳','👩‍🍳','👨‍🍳','🐱','🐶','🐰','🦊']

const stats = computed(() => ({
  total: recordState.list.length,
  public: recordState.list.filter(r => r.isPublic).length,
  faves: recordState.list.filter(r => r.isFavorite).length,
  warns: recordState.list.filter(r => r.isWarning).length,
}))

const tagEditor = reactive({ show: false, title: '', type: '', items: [], suggestions: [], input: '' })

const listModal = reactive({ show: false, title: '', items: [] })

const showTagEditor = (type) => {
  const map = {
    taste: { title: '口味偏好', key: 'tastePrefs', suggestions: ['辣','甜','酸','咸','清淡','麻辣','重油','养生','海鲜','肉类','素食'] },
    allergy: { title: '忌口/过敏', key: 'allergies', suggestions: ['花生','海鲜','牛奶','鸡蛋','小麦','大豆','坚果','芒果','酒精'] },
  }
  const cfg = map[type]
  tagEditor.title = '✏️ ' + cfg.title
  tagEditor.type = type
  tagEditor.items = [...(profile[cfg.key] || [])]
  tagEditor.suggestions = cfg.suggestions
  tagEditor.input = ''
  tagEditor.show = true
}

const toggleTag = (t) => {
  const idx = tagEditor.items.indexOf(t)
  if (idx >= 0) tagEditor.items.splice(idx, 1)
  else tagEditor.items.push(t)
}

const addCustomTag = () => {
  const t = tagEditor.input.trim()
  if (t && !tagEditor.items.includes(t)) { tagEditor.items.push(t); tagEditor.input = '' }
}

const saveTags = () => {
  const key = tagEditor.type === 'taste' ? 'tastePrefs' : 'allergies'
  profile[key] = [...tagEditor.items]
  saveProfile()
  tagEditor.show = false
  toastRef.value?.show('已更新', 'success')
}

const setTheme = (t) => {
  theme.value = t
  profile.theme = t
  saveProfile()
  applyTheme(t)
  toastRef.value?.show('主题已切换', 'success')
}

const setFont = (s) => {
  fontSize.value = s
  profile.fontSize = s
  saveProfile()
  document.documentElement.dataset.font = s
  toastRef.value?.show('字体已调整', 'success')
}

const applyTheme = (t) => {
  const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme:dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

const saveProfile = () => {
  const { state: s, update } = useProfile()
  update({ ...s })
  toastRef.value?.show('已保存', 'success')
}

const saveAddrs = () => {
  profile.addresses = profile.addresses.filter(a => a.name || a.address)
  saveProfile()
  showAddrEditor.value = false
}

const addAlt = () => {
  const v = altInput.value.trim()
  if (v && !profile.altFoods?.includes(v)) {
    if (!profile.altFoods) profile.altFoods = []
    profile.altFoods.push(v)
    altInput.value = ''
    saveProfile()
  }
}

const exportData = () => {
  const data = exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `这顿吃什么_${new Date().toISOString().slice(0,10)}.json`; a.click()
  URL.revokeObjectURL(url)
  toastRef.value?.show('导出成功！', 'success')
}

const importData = (e) => {
  const f = e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      if (importAll(data)) { toastRef.value?.show('导入成功！刷新页面生效', 'success'); setTimeout(() => location.reload(), 1000) }
      else toastRef.value?.show('数据格式不正确', 'error')
    } catch { toastRef.value?.show('JSON 解析失败', 'error') }
  }
  reader.readAsText(f)
  e.target.value = ''
}

const onClearAll = () => {
  if (confirm('⚠️ 确认清除所有数据？此操作不可撤销！')) {
    clearAll()
    toastRef.value?.show('数据已清除', 'success')
    setTimeout(() => location.reload(), 500)
  }
}

// 列表弹窗
const openList = (type) => {
  const map = { warn: { title: '⚠️ 避雷清单', filter: r => r.isWarning }, fav: { title: '⭐ 收藏清单', filter: r => r.isFavorite } }
  const c = map[type]
  listModal.title = c.title
  listModal.items = recordState.list.filter(c.filter)
  listModal.show = true
}

// 初始应用主题
import { onMounted } from 'vue'
onMounted(() => applyTheme(profile.theme || 'light'))
</script>
