/**
 * 用户资料响应式 Store
 * 登录后从后端同步，未登录时使用 localStorage
 */
import { reactive } from 'vue'
import { getProfile, saveProfile } from '@/utils/storage.js'
import api from '@/api/index.js'

const DEF_PROFILE = {
  nickname: '美食家', avatar: '🍜', bio: '唯美食与爱不可辜负',
  tastePrefs: [], allergies: [], addresses: [], budgetRange: [20, 50],
  altFoods: [], theme: 'light', fontSize: 'medium',
}

const state = reactive(getProfile())

export const useProfile = () => {
  const save = () => { saveProfile({ ...state }) }
  const update = (patch) => { Object.assign(state, patch); save() }

  /** 从后端同步用户资料到本地 state */
  const syncFromServer = async (userData) => {
    if (!userData) return
    // 合并后端数据到 state
    if (userData.nickname !== undefined) state.nickname = userData.nickname
    if (userData.avatar !== undefined) state.avatar = userData.avatar
    if (userData.bio !== undefined) state.bio = userData.bio
    if (userData.taste_prefs !== undefined) state.tastePrefs = userData.taste_prefs || []
    if (userData.allergies !== undefined) state.allergies = userData.allergies || []
    if (userData.addresses !== undefined) state.addresses = userData.addresses || []
    if (userData.budget_range !== undefined) state.budgetRange = userData.budget_range || [20, 50]
    if (userData.alt_foods !== undefined) state.altFoods = userData.alt_foods || []
    if (userData.theme !== undefined) state.theme = userData.theme
    if (userData.font_size !== undefined) state.fontSize = userData.font_size
    save()
  }

  /** 同步本地 state 到后端 */
  const syncToServer = async () => {
    const token = localStorage.getItem('eat_token')
    if (!token) return
    try {
      const body = {
        nickname: state.nickname,
        avatar: state.avatar,
        bio: state.bio,
        taste_prefs: state.tastePrefs,
        allergies: state.allergies,
        addresses: state.addresses,
        budget_range: state.budgetRange,
        alt_foods: state.altFoods,
        theme: state.theme,
        font_size: state.fontSize,
      }
      await api.put('/api/user/profile', body)
    } catch (err) {
      console.warn('同步资料到服务器失败:', err.message)
    }
  }

  return { state, save, update, syncFromServer, syncToServer }
}
