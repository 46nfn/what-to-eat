/**
 * API 请求封装层 — 标准 fetch 封装
 *
 * ══════════════════  路径拼接规则  ══════════════════
 *
 *   baseURL   = 纯域名:端口，**不含任何路径**（如 /api）
 *   endpoints = 始终以 /api 开头（如 /api/auth/login）
 *
 *   最终 URL = baseURL + endpoint
 *
 *   ┌──────────────────┬─────────────────────┬──────────────────────────────┐
 *   │ 场景              │ baseURL             │ endpoint                     │
 *   ├──────────────────┼─────────────────────┼──────────────────────────────┤
 *   │ Vite dev (代理)   │ '' (空字符串)       │ /api/auth/login              │
 *   │                   │                     │ → 浏览器发 /api/auth/login   │
 *   │                   │                     │ → Vite proxy 转发 3001       │
 *   ├──────────────────┼─────────────────────┼──────────────────────────────┤
 *   │ 直连后端           │ http://loc:3001    │ /api/auth/login              │
 *   │ (Electron/部署)   │                     │ → http://loc:3001/api/...    │
 *   ├──────────────────┼─────────────────────┼──────────────────────────────┤
 *   │ 生产环境           │ https://api.xxx.com│ /api/auth/login              │
 *   │                   │                     │ → https://api.xxx.com/api/.. │
 *   └──────────────────┴─────────────────────┴──────────────────────────────┘
 *
 *   核心约束：baseURL 绝不包含 /api 或任何路径段
 *   → 如果服务器 Nginx 把 /api 去掉了（裸端口直连），
 *     请设置 VITE_API_BASE=http://localhost:3001 而不带 /api
 *
 * ════════════════════════════════════════════════════
 */

// ── baseURL：只有 origin ──
const raw = import.meta.env.VITE_API_BASE;

/** 根据环境自动推算 baseURL（仅域名+端口，不含路径） */
function resolveBaseURL() {
  // 1. 显式设置了环境变量 → 直接用（用户需确保不含 /api）
  if (raw) return raw;

  // 2. Electron 桌面端 → 直连后端
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return 'http://localhost:3001';
  }

  // 3. Vite dev / build 部署（相对路径）→ 空，走 Vite 代理或同域
  return '';
}

const BASE_URL = resolveBaseURL();

// ── 全局事件 ──
export const authEvents = {
  _handlers: [],
  onExpired(fn) { this._handlers.push(fn); },
  emit() { this._handlers.forEach(fn => fn()); },
};

// ── 核心请求 ──
async function request(endpoint, options = {}) {
  const { method = 'GET', body, params, headers = {}, ...rest } = options;

  // ═══ 拼接规则：baseURL + endpoint，两端不重复带 /api ═══
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    // 剔除 undefined/null 值，防止 URLSearchParams 把 undefined → "undefined"
    const clean = {}
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) clean[k] = v
    }
    const qs = new URLSearchParams(clean).toString();
    if (qs) url += `?${qs}`;
  }

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const token = localStorage.getItem('eat_token');
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOpts = { method, headers: reqHeaders, ...rest };
  if (body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOpts);
  } catch (err) {
    throw new Error(`网络连接失败，请检查服务器是否运行 (${err.message})`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`服务器响应格式错误 (${response.status})`);
  }

  if (response.status === 401) {
    localStorage.removeItem('eat_token');
    localStorage.removeItem('eat_user');
    authEvents.emit();
    throw new Error(data.message || '登录已过期，请重新登录');
  }

  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `请求失败 (${response.status})`);
  }

  return data.data;
}

// ── 便捷方法 ──
export const api = {
  get: (endpoint, params) => request(endpoint, { method: 'GET', params }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  del: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
