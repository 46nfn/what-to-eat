/**
 * DeepSeek AI 美食对话服务 — 读取本地日记数据，个性化推荐
 */
import { getRecords, getProfile } from './storage.js'
import { recommendFoods, parseUserInput } from './foodDatabase.js'
import { getMealType } from './helpers.js'

const API_URL = 'https://api.deepseek.com/chat/completions'

/** 构建注入用户饮食记录的系统提示词 */
const systemPrompt = () => {
  const records = getRecords(), p = getProfile(), meal = getMealType()
  const recent = records.slice(0, 30).map(r =>
    `· ${r.name}｜${r.mealType}｜${r.rating ? '⭐'.repeat(Math.floor(r.rating)) : '未评'}｜${r.isWarning ? '⚠️避雷' : ''}｜${r.location?.name || r.location?.address || ''}｜${(r.note || '').slice(0, 40)}`
  ).join('\n')
  return `你是「天帮我选」AI美食助手。你完全了解用户的饮食记录，用温暖贴心的朋友语气推荐。

【当前】${meal.emoji} ${meal.label} ${new Date().toLocaleString('zh-CN')}
【口味】${p.tastePrefs?.join('、') || '未设'}
【忌口】${p.allergies?.join('、') || '无'}
【地址】${(p.addresses||[]).map(a=>a.name+':'+a.address).join('；')||'未设'}
【预算】¥${p.budgetRange?.[0]||20}-${p.budgetRange?.[1]||50}/人
【近期记录】\n${recent || '暂无'}
【避雷】${records.filter(r=>r.isWarning).map(r=>r.name).join('、')||'无'}
【收藏】${records.filter(r=>r.isFavorite).map(r=>r.name).join('、')||'无'}

规则：避开忌口和避雷；优先偏好口味；适配当前时段；输出2-4套方案, 每套含: 菜名/菜系/理由/预算/场景；语气温暖日常。`
}

/** 调用 DeepSeek API 或降级本地引擎 */
export const sendToAI = async (userMsg, history = [], apiKey = '') => {
  if (apiKey.trim()) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
        body: JSON.stringify({
          model: 'deepseek-chat', temperature: 0.8, max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt() },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const d = await res.json()
      return { text: d.choices?.[0]?.message?.content || 'AI 暂时无法回复', mealPlans: null, source: 'deepseek' }
    } catch (e) {
      console.warn('DeepSeek 降级本地:', e.message)
    }
  }
  return localRecommend(userMsg)
}

/** 本地推荐引擎（离线降级） */
const localRecommend = (userMsg) => {
  const params = parseUserInput(userMsg)
  const p = getProfile(), records = getRecords(), meal = getMealType()
  const list = recommendFoods({
    mealType: meal.type,
    budget: params.budget || p.budgetRange,
    tastePrefs: params.tastePrefs || p.tastePrefs,
    allergies: params.allergies || p.allergies,
    scene: params.scene, cuisine: params.cuisine,
    history: records.map(r => ({ name: r.n, cuisine: r.tags?.join(' '), rating: r.rating || 3 })),
    keywords: params.keywords || '', count: Math.floor(Math.random() * 2) + 3,
  })
  if (!list.length) return { text: '😅 没找到特别匹配的推荐。试试放宽预算、换个菜系或口味？', mealPlans: null, source: 'local' }
  const plans = list.map(r => ({
    name: r.n, cuisine: r.c, budget: `¥${r.p[0]}-${r.p[1]}`, scene: r.s?.[0] || '堂食/外卖', reason: r.d,
  }))
  let intro = params.cuisine ? `帮你找了 ${plans.length} 个${params.cuisine}选择 👇`
    : params.keywords?.includes('减脂') ? `健康美味兼得！${plans.length} 个轻负担选择 👇`
    : `根据你的口味，${meal.label}推荐 ${plans.length} 个选择 👇`
  return { text: intro, mealPlans: plans, source: 'local' }
}
