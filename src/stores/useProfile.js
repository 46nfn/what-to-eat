/**
 * 用户资料响应式 Store
 */
import { reactive } from 'vue'
import { getProfile, saveProfile } from '@/utils/storage.js'

const state = reactive(getProfile())

export const useProfile = () => {
  const save = () => { saveProfile({ ...state }) }
  const update = (patch) => { Object.assign(state, patch); save() }
  return { state, save, update }
}
