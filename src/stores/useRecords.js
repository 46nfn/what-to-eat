/**
 * 美食记录响应式 Store
 * 登录后从后端 API 操作，未登录时使用 localStorage
 */
import { reactive, computed } from 'vue'
import { getRecords, saveRecord, delRecord, getRecord } from '@/utils/storage.js'
import { uid, getMealType } from '@/utils/helpers.js'
import api from '@/api/index.js'

const state = reactive({ list: getRecords(), loading: false, stats: null })

const isOnline = () => !!localStorage.getItem('eat_token')

/** 将后端 snake_case 字段转为前端 camelCase */
const normalize = (r) => ({
  ...r,
  mealTime: r.meal_time || r.mealTime,
  mealType: r.meal_type || r.mealType,
  isPublic: r.is_public !== undefined ? !!r.is_public : r.isPublic,
  isFavorite: r.is_favorite !== undefined ? !!r.is_favorite : r.isFavorite,
  isWarning: r.is_warning !== undefined ? !!r.is_warning : r.isWarning,
  aiTags: r.ai_tags || r.aiTags,
  createdAt: r.created_at || r.createdAt,
  updatedAt: r.updated_at || r.updatedAt,
})

const normalizeList = (list) => (list || []).map(normalize)

export const useRecords = () => {
  const publicList = computed(() => state.list.filter(r => r.isPublic))
  const favoriteList = computed(() => state.list.filter(r => r.isFavorite))
  const warningList = computed(() => state.list.filter(r => r.isWarning))
  const count = computed(() => state.list.length)

  const refresh = () => {
    if (isOnline()) {
      loadFromServer()
    } else {
      state.list = getRecords()
    }
  }

  /** 从服务器加载日记列表 */
  const loadFromServer = async (params = {}) => {
    if (!isOnline()) return
    state.loading = true
    try {
      const data = await api.get('/api/diary', params)
      state.list = normalizeList(data.list)
      state.stats = {
        total: data.total,
        public: 0, // 后续从 stats 接口获取
        favorites: 0,
        warnings: 0,
      }
    } catch (err) {
      console.warn('加载日记列表失败:', err.message)
      state.list = getRecords()
    } finally {
      state.loading = false
    }
  }

  /** 加载收藏列表 */
  const loadFavorites = async () => {
    if (!isOnline()) return
    state.loading = true
    try {
      const data = await api.get('/api/diary', { type: 'favorite' })
      return normalizeList(data.list)
    } catch (err) {
      console.warn('加载收藏失败:', err.message)
      return []
    } finally {
      state.loading = false
    }
  }

  /** 加载避雷列表 */
  const loadWarnings = async () => {
    if (!isOnline()) return
    state.loading = true
    try {
      const data = await api.get('/api/diary', { type: 'warning' })
      return normalizeList(data.list)
    } catch (err) {
      console.warn('加载避雷失败:', err.message)
      return []
    } finally {
      state.loading = false
    }
  }

  /** 加载统计数据 */
  const loadStats = async () => {
    if (!isOnline()) return null
    try {
      const stats = await api.get('/api/diary/stats')
      state.stats = stats
      return stats
    } catch {
      return null
    }
  }

  /** 创建记录 */
  const add = async (data) => {
    if (!isOnline()) {
      // 离线模式: localStorage
      const now = new Date()
      const meal = getMealType(data.mealTime || now.toISOString())
      const record = {
        id: uid(),
        name: data.name || '',
        photos: data.photos || [],
        video: data.video || null,
        note: data.note || '',
        mealTime: data.mealTime || now.toISOString(),
        mealType: data.mealType || meal.type,
        location: data.location || null,
        rating: data.rating || 0,
        price: data.price || 0,
        tags: data.tags || [],
        aiTags: data.aiTags || [],
        isPublic: data.isPublic ?? true,
        isWarning: data.isWarning ?? false,
        isFavorite: data.isFavorite ?? false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      state.list = saveRecord(record)
      return record
    }

    // 在线模式: API
    state.loading = true
    try {
      // 安全转换：price/rating 必须为有效数字且在 MySQL DECIMAL 范围内
      const safeNum = (v, max) => {
        const n = Number(v)
        if (!Number.isFinite(n) || n < 0) return 0
        return Math.min(n, max)
      }

      const record = await api.post('/api/diary', {
        name: data.name,
        photos: data.photos || [],
        video: data.video || null,
        note: data.note || '',
        mealTime: data.mealTime || new Date().toISOString(),
        mealType: data.mealType || 'lunch',
        location: data.location || null,
        rating: safeNum(data.rating, 5),
        price: safeNum(data.price, 99999999.99),
        tags: data.tags || [],
        aiTags: data.aiTags || [],
        isPublic: data.isPublic ?? true,
        isFavorite: data.isFavorite ?? false,
        isWarning: data.isWarning ?? false,
      })
      await loadFromServer()
      return record
    } catch (err) {
      throw err
    } finally {
      state.loading = false
    }
  }

  /** 更新记录 */
  const update = async (id, data) => {
    if (!isOnline()) {
      const existing = getRecord(id)
      if (!existing) return null
      const updated = { ...existing, ...data, updatedAt: Date.now() }
      state.list = saveRecord(updated)
      return updated
    }

    state.loading = true
    try {
      const result = await api.put(`/api/diary/${id}`, data)
      await loadFromServer()
      return result
    } catch (err) {
      throw err
    } finally {
      state.loading = false
    }
  }

  /** 删除记录 */
  const remove = async (id) => {
    if (!isOnline()) {
      state.list = delRecord(id)
      return
    }

    state.loading = true
    try {
      await api.del(`/api/diary/${id}`)
      await loadFromServer()
    } catch (err) {
      throw err
    } finally {
      state.loading = false
    }
  }

  /** 获取单条记录 */
  const getById = async (id) => {
    if (!isOnline()) return getRecord(id)

    try {
      return await api.get(`/api/diary/${id}`)
    } catch {
      return getRecord(id)
    }
  }

  return {
    state, publicList, favoriteList, warningList, count,
    refresh, loadFromServer, loadFavorites, loadWarnings, loadStats,
    add, update, remove, getById,
  }
}
