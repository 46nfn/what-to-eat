/**
 * AI 对话 Store
 */
import { reactive } from 'vue'
import { getChats, saveChat, delChat } from '@/utils/storage.js'
import { uid } from '@/utils/helpers.js'

const state = reactive({
  sessions: getChats(),
  activeId: null,
  sending: false,
})

export const useChat = () => {
  const activeSession = () => {
    if (state.activeId) {
      const s = state.sessions.find(c => c.id === state.activeId)
      if (s) return s
    }
    // 创建新会话
    const s = { id: uid(), title: '美食对话', msgs: [], createdAt: Date.now(), updatedAt: Date.now() }
    state.sessions = saveChat(s)
    state.activeId = s.id
    return s
  }

  const addMsg = (role, content, mealPlans = null) => {
    const s = activeSession()
    s.msgs.push({ role, content, mealPlans, time: Date.now() })
    s.updatedAt = Date.now()
    if (s.msgs.length === 2 && !s.title) {
      s.title = (content || '').slice(0, 20) || '美食对话'
    }
    state.sessions = saveChat(s)
    return s
  }

  const switchSession = (id) => {
    state.activeId = id
  }

  const newSession = () => {
    state.activeId = null
  }

  const removeSession = (id) => {
    state.sessions = delChat(id)
    if (state.activeId === id) state.activeId = null
  }

  return { state, activeSession, addMsg, switchSession, newSession, removeSession }
}
