/**
 * 通用工具函数
 */

// 生成唯一 ID
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

// 防抖
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }

// 获取餐段
export const getMealType = (iso) => {
  const h = (iso ? new Date(iso) : new Date()).getHours()
  if (h >= 5 && h < 10) return { type: 'breakfast', label: '早餐', emoji: '🌅' }
  if (h >= 10 && h < 14) return { type: 'lunch', label: '午餐', emoji: '☀️' }
  if (h >= 14 && h < 21) return { type: 'dinner', label: '晚餐', emoji: '🌇' }
  return { type: 'supper', label: '夜宵', emoji: '🌙' }
}

// 问候语
export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 6) return { text: '夜深了 🌙', sub: '注意休息，别吃太多夜宵' }
  if (h < 10) return { text: '早上好 ☀️', sub: '早餐要吃好，元气满满一整天' }
  if (h < 14) return { text: '中午好 🌤️', sub: '午餐时间到，今天想吃什么？' }
  if (h < 18) return { text: '下午好 🌻', sub: '下午茶时间，来点甜的吧' }
  if (h < 21) return { text: '晚上好 🌆', sub: '晚餐要吃得像国王一样' }
  return { text: '晚上好 🌙', sub: '夜宵虽好，可不要贪吃哦' }
}

// 格式化日期
export const fmtDate = (iso, fmt = 'full') => {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0')
  if (fmt === 'date') return `${y}-${m}-${dd}`
  if (fmt === 'time') return `${hh}:${mm}`
  if (fmt === 'short') return `${m}/${dd} ${hh}:${mm}`
  return `${y}-${m}-${dd} ${hh}:${mm}`
}

// 相对时间
export const relativeTime = (iso) => {
  const diff = new Date() - new Date(iso)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return fmtDate(iso, 'date')
}

// 日期分组
export const dateGroup = (iso) => {
  const diff = new Date() - new Date(iso)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return '本周'
  return fmtDate(iso, 'date')
}

// 截断
export const truncate = (s, n = 50) => s && s.length > n ? s.slice(0, n) + '...' : s || ''

// 价格格式化
export const fmtPrice = (p) => p ? `¥${Number(p).toFixed(p % 1 === 0 ? 0 : 1)}` : ''

// 图片压缩
export const compressImage = (file, maxW = 800, quality = 0.7) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxW) { h = (h * maxW) / w; w = maxW }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = e.target.result
  }
  reader.onerror = reject
  reader.readAsDataURL(file)
})

// GPS 定位
export const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('不支持定位'))
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    reject, { timeout: 10000, enableHighAccuracy: false }
  )
})

// 星级 HTML
export const starHtml = (r) => {
  const full = Math.floor(r), half = r - full >= 0.5
  let h = ''
  for (let i = 0; i < 5; i++) h += i < full ? '⭐' : (i === full && half ? '✨' : '☆')
  return h
}

// 餐段 emoji
export const mealEmoji = (t) => ({ breakfast: '🌅', lunch: '☀️', dinner: '🌇', supper: '🌙' }[t] || '🍽️')

// 自动标签生成（基于名称）
export const autoTagsFromName = (name) => {
  const tags = []
  if (/面|粉|米线/.test(name)) tags.push('面食')
  if (/饭|盖浇|炒饭|煲仔/.test(name)) tags.push('米饭')
  if (/火锅|涮|麻辣烫|冒菜/.test(name)) tags.push('火锅')
  if (/汤|粥/.test(name)) tags.push('汤粥')
  if (/鸡/.test(name)) tags.push('鸡肉')
  if (/猪|肉/.test(name)) tags.push('猪肉')
  if (/牛/.test(name)) tags.push('牛肉')
  if (/鱼|虾|蟹|海鲜/.test(name)) tags.push('海鲜')
  if (/辣|麻辣/.test(name)) tags.push('辣')
  if (/素|蔬/.test(name)) tags.push('素食')
  if (/炸|烤/.test(name)) tags.push('炸烤')
  if (/甜|糖|奶茶/.test(name)) tags.push('甜食')
  return [...new Set(tags)]
}
