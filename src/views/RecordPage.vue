<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24 animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-warm-700 dark:text-warm-100">{{ editId ? '✏️ 编辑记录' : '✏️ 美食记录' }}</h1>
        <p class="text-xs text-warm-500">记录这一刻的美味</p>
      </div>
      <button v-if="editId" class="btn-ghost text-sm" @click="$router.push('/diary')">取消</button>
    </div>

    <div class="flex flex-col gap-5">
      <!-- 美食名称 -->
      <div>
        <label class="text-sm font-semibold mb-1 block">美食名称 <span class="text-red-400">*</span></label>
        <input v-model="form.name" class="input-box" placeholder="输入菜名或食物名称..." required />
      </div>

      <!-- 照片上传 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">📷 美食照片</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="(p,i) in form.photos" :key="i" class="relative w-20 h-20 rounded-lg overflow-hidden">
            <img :src="p" class="w-full h-full object-cover" />
            <button class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center" @click="form.photos.splice(i,1)">×</button>
          </div>
          <label class="w-20 h-20 border-2 border-dashed border-warm-200 dark:border-warm-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-wheat-400 transition-colors">
            <span class="text-xl">+</span><span class="text-[10px] text-warm-500">照片</span>
            <input type="file" accept="image/*" multiple hidden @change="onPhotos" />
          </label>
        </div>
      </div>

      <!-- 短视频 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">🎬 短视频（≤30秒）</label>
        <label v-if="!form.video" class="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-warm-200 dark:border-warm-600 rounded-lg cursor-pointer hover:border-wheat-400 transition-colors">
          <span>🎥</span><span class="text-xs text-warm-500">添加视频</span>
          <input type="file" accept="video/*" hidden @change="onVideo" />
        </label>
        <div v-else class="relative">
          <video :src="form.video" controls class="w-full max-h-48 rounded-lg" />
          <button class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs" @click="form.video = null">×</button>
        </div>
      </div>

      <!-- 心得体会 -->
      <div>
        <label class="text-sm font-semibold mb-1 block">💬 心得体会</label>
        <textarea v-model="form.note" class="input-box" rows="3" placeholder="记录口味、环境、服务等感受..."></textarea>
      </div>

      <!-- 就餐时间 -->
      <div>
        <label class="text-sm font-semibold mb-1 block">🕐 就餐时间</label>
        <input type="datetime-local" v-model="form.mealTime" class="input-box" @change="autoMealType" />
      </div>

      <!-- 餐段 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">🍽️ 餐段（自动识别）</label>
        <div class="flex gap-2">
          <button v-for="mt in mealTypes" :key="mt.key" class="tag-pill cursor-pointer transition-colors"
            :class="form.mealType === mt.key ? '!bg-wheat-400 !text-warm-700' : ''"
            @click="form.mealType = mt.key">{{ mt.emoji }} {{ mt.label }}</button>
        </div>
      </div>

      <!-- 评分 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">⭐ 评分</label>
        <StarRating v-model="form.rating" />
      </div>

      <!-- 花费 -->
      <div>
        <label class="text-sm font-semibold mb-1 block">💰 花费金额（人均）</label>
        <input v-model.number="form.price" type="number" class="input-box" placeholder="输入人均消费金额" step="0.1" min="0" />
      </div>

      <!-- 地理位置 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">📍 地理位置打卡</label>
        <div class="flex flex-col gap-2 bg-warm-50 dark:bg-warm-700 rounded-xl p-3">
          <button class="btn-outline text-sm" :disabled="locating" @click="getLocation">
            {{ locating ? '定位中...' : '📍 自动定位' }}
          </button>
          <span class="text-[10px] text-warm-500" v-if="locStatus">{{ locStatus }}</span>
          <input v-model="form.location.address" class="input-box text-sm" placeholder="或手动输入地址..." />
          <input v-model="form.location.name" class="input-box text-sm" placeholder="餐厅/店铺名称（可选）" />
        </div>
      </div>

      <!-- 标签 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">🏷️ 标签</label>
        <div class="bg-warm-50 dark:bg-warm-700 rounded-xl p-3">
          <div class="flex flex-wrap gap-1 mb-2">
            <span v-for="t in autoTags" :key="t" class="tag-mint">{{ t }}</span>
            <span class="text-[10px] text-warm-500" v-if="!autoTags.length">输入名称后自动生成 →</span>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <span v-for="(t,i) in form.tags" :key="i" class="tag-pill cursor-pointer" @click="form.tags.splice(i,1)">{{ t }} ×</span>
          </div>
          <input v-model="tagInput" class="input-box text-sm" placeholder="输入自定义标签，回车添加" @keydown.enter="addTag" />
        </div>
      </div>

      <!-- 选项 -->
      <div>
        <label class="text-sm font-semibold mb-2 block">⚙️ 选项设置</label>
        <div class="flex flex-col gap-3 bg-warm-50 dark:bg-warm-700 rounded-xl p-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.isPublic" class="w-5 h-5 accent-wheat-400 rounded" />
            <span class="text-sm">🌍 公开分享到社区</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.isWarning" class="w-5 h-5 accent-red-400 rounded" />
            <span class="text-sm">⚠️ 标记为避雷</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.isFavorite" class="w-5 h-5 accent-coral-400 rounded" />
            <span class="text-sm">⭐ 收藏</span>
          </label>
        </div>
      </div>

      <!-- 提交 -->
      <button class="btn-main w-full py-3 text-base" @click="onSubmit">{{ editId ? '💾 保存修改' : '📝 保存记录' }}</button>
    </div>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecords } from '@/stores/useRecords.js'
import { getMealType, compressImage, getPosition, autoTagsFromName } from '@/utils/helpers.js'
import StarRating from '@/components/StarRating.vue'
import Toast from '@/components/Toast.vue'

const route = useRoute(); const router = useRouter()
const { add, update: updateRecord, getById } = useRecords()
const editId = ref(route.query.edit || '')
const toastRef = ref(null)
const tagInput = ref('')
const locating = ref(false)
const locStatus = ref('')

const now = new Date()
const defaultMeal = getMealType()

const mealTypes = [
  { key: 'breakfast', label: '早餐', emoji: '🌅' },
  { key: 'lunch', label: '午餐', emoji: '☀️' },
  { key: 'dinner', label: '晚餐', emoji: '🌇' },
  { key: 'supper', label: '夜宵', emoji: '🌙' },
]

const form = reactive({
  name: '', photos: [], video: null, note: '',
  mealTime: now.toISOString().slice(0, 16),
  mealType: defaultMeal.type, rating: 0, price: 0,
  location: { lat: null, lng: null, address: '', name: '' },
  tags: [], aiTags: [],
  isPublic: true, isWarning: false, isFavorite: false,
})

const autoTags = computed(() => autoTagsFromName(form.name))

const autoMealType = () => {
  const m = getMealType(form.mealTime)
  form.mealType = m.type
}

const addTag = () => {
  const t = tagInput.value.trim()
  if (t && !form.tags.includes(t)) { form.tags.push(t); tagInput.value = '' }
}

onMounted(() => {
  if (editId.value) {
    const r = getById(editId.value)
    if (r) Object.assign(form, {
      name: r.name, photos: r.photos || [], video: r.video, note: r.note,
      mealTime: new Date(r.mealTime).toISOString().slice(0, 16), mealType: r.mealType,
      rating: r.rating, price: r.price,
      location: r.location || { lat: null, lng: null, address: '', name: '' },
      tags: r.tags || [], aiTags: r.aiTags || [],
      isPublic: r.isPublic, isWarning: r.isWarning, isFavorite: r.isFavorite,
    })
  }
})

const onPhotos = async (e) => {
  const files = [...e.target.files]
  for (const f of files) {
    try { form.photos.push(await compressImage(f)) } catch { toastRef.value?.show('图片压缩失败', 'error') }
  }
  e.target.value = ''
}

const onVideo = (e) => {
  const f = e.target.files[0]
  if (!f) return
  if (f.size > 50 * 1024 * 1024) return toastRef.value?.show('视频不超过50MB', 'error')
  const r = new FileReader()
  r.onload = (ev) => { form.video = ev.target.result }
  r.readAsDataURL(f)
  e.target.value = ''
}

const getLocation = async () => {
  locating.value = true
  try {
    const pos = await getPosition()
    form.location.lat = pos.lat
    form.location.lng = pos.lng
    locStatus.value = `✅ 已获取 (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`
  } catch {
    locStatus.value = '⚠️ 定位失败，请手动输入'
  }
  locating.value = false
}

const onSubmit = () => {
  if (!form.name.trim()) return toastRef.value?.show('请输入美食名称', 'warn')
  const allTags = [...new Set([...autoTags.value, ...form.tags])]
  const data = { ...form, name: form.name.trim(), tags: allTags }

  if (editId.value) {
    updateRecord(editId.value, data)
    toastRef.value?.show('记录已更新！', 'success')
  } else {
    add(data)
    toastRef.value?.show('记录保存成功！🎉', 'success')
  }
  setTimeout(() => router.push('/diary'), 600)
}
</script>
