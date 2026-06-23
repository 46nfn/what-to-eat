/**
 * 美食记录响应式 Store
 */
import { reactive, computed } from 'vue'
import { getRecords, saveRecord, delRecord, getRecord, getPublicRecords } from '@/utils/storage.js'
import { uid, getMealType } from '@/utils/helpers.js'

const state = reactive({ list: getRecords(), loading: false })

export const useRecords = () => {
  const publicList = computed(() => state.list.filter(r => r.isPublic))
  const favoriteList = computed(() => state.list.filter(r => r.isFavorite))
  const warningList = computed(() => state.list.filter(r => r.isWarning))
  const count = computed(() => state.list.length)

  const refresh = () => { state.list = getRecords() }

  const add = (data) => {
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

  const update = (id, data) => {
    const existing = getRecord(id)
    if (!existing) return null
    const updated = { ...existing, ...data, updatedAt: Date.now() }
    state.list = saveRecord(updated)
    return updated
  }

  const remove = (id) => {
    state.list = delRecord(id)
  }

  const getById = (id) => getRecord(id)

  return { state, publicList, favoriteList, warningList, count, refresh, add, update, remove, getById }
}
