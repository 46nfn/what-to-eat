/**
 * LocalStorage 封装
 * 所有数据持久化通过此层操作
 */
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } },
  del(k) { try { localStorage.removeItem(k); return true } catch { return false } },
}

// === 美食记录 ===
const KEY_RECORDS = 'eat_records'

export const getRecords = () => LS.get(KEY_RECORDS) || []
export const saveRecord = (r) => {
  const list = getRecords()
  const idx = list.findIndex(x => x.id === r.id)
  if (idx >= 0) list[idx] = r
  else list.unshift(r)
  LS.set(KEY_RECORDS, list)
  return list
}
export const delRecord = (id) => {
  const list = getRecords().filter(r => r.id !== id)
  LS.set(KEY_RECORDS, list)
  return list
}
export const getRecord = (id) => getRecords().find(r => r.id === id) || null
export const getPublicRecords = () => getRecords().filter(r => r.isPublic)

// === 用户资料 ===
const KEY_PROFILE = 'eat_profile'
const DEF_PROFILE = {
  nickname: '美食家', avatar: '🍜', bio: '唯美食与爱不可辜负',
  tastePrefs: [], allergies: [], addresses: [], budgetRange: [20, 50],
  altFoods: [], theme: 'light', fontSize: 'medium',
}
export const getProfile = () => {
  const s = LS.get(KEY_PROFILE)
  return s ? { ...DEF_PROFILE, ...s } : DEF_PROFILE
}
export const saveProfile = (p) => LS.set(KEY_PROFILE, p)

// === AI 对话 ===
const KEY_CHATS = 'eat_chats'
export const getChats = () => LS.get(KEY_CHATS) || []
export const saveChat = (c) => {
  const list = getChats()
  const idx = list.findIndex(x => x.id === c.id)
  if (idx >= 0) list[idx] = c
  else list.unshift(c)
  LS.set(KEY_CHATS, list)
  return list
}
export const delChat = (id) => {
  const list = getChats().filter(c => c.id !== id)
  LS.set(KEY_CHATS, list)
  return list
}

// === 社区交互 ===
const KEY_COMM = 'eat_comm'
export const getCommData = () => LS.get(KEY_COMM) || {}
export const toggleLike = (rid) => {
  const d = getCommData()
  if (!d[rid]) d[rid] = { likes: 0, likedBy: [], saves: 0, savedBy: [] }
  const u = 'me', liked = d[rid].likedBy.includes(u)
  if (liked) { d[rid].likes--; d[rid].likedBy = d[rid].likedBy.filter(x => x !== u) }
  else { d[rid].likes++; d[rid].likedBy.push(u) }
  LS.set(KEY_COMM, d)
  return { liked: !liked, likes: d[rid].likes }
}
export const toggleSave = (rid) => {
  const d = getCommData()
  if (!d[rid]) d[rid] = { likes: 0, likedBy: [], saves: 0, savedBy: [] }
  const u = 'me', saved = d[rid].savedBy.includes(u)
  if (saved) { d[rid].saves--; d[rid].savedBy = d[rid].savedBy.filter(x => x !== u) }
  else { d[rid].saves++; d[rid].savedBy.push(u) }
  LS.set(KEY_COMM, d)
  return { saved: !saved, saves: d[rid].saves }
}
export const getInteraction = (rid) => {
  const d = getCommData()
  const x = d[rid] || { likes: 0, likedBy: [], saves: 0, savedBy: [] }
  return { likes: x.likes, liked: x.likedBy.includes('me'), saves: x.saves, saved: x.savedBy.includes('me') }
}

// === 数据导出/导入 ===
export const exportAll = () => ({
  records: getRecords(), profile: getProfile(), chats: getChats(),
  comm: getCommData(), exportTime: new Date().toISOString(), version: '2.0',
})
export const importAll = (data) => {
  if (!data?.version) return false
  if (data.records) LS.set(KEY_RECORDS, data.records)
  if (data.profile) LS.set(KEY_PROFILE, data.profile)
  if (data.chats) LS.set(KEY_CHATS, data.chats)
  if (data.comm) LS.set(KEY_COMM, data.comm)
  return true
}
export const clearAll = () => {
  [KEY_RECORDS, KEY_PROFILE, KEY_CHATS, KEY_COMM].forEach(LS.del)
}
