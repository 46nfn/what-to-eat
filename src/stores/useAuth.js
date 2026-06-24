/**
 * 认证状态管理 Store
 * 管理登录/注册/登出、token 持久化、用户信息
 */
import { reactive, computed } from 'vue';
import api, { authEvents } from '@/api/index.js';

const state = reactive({
  user: loadUser(),
  token: localStorage.getItem('eat_token') || null,
  loading: false,
  initDone: false,
});

function loadUser() {
  try {
    const raw = localStorage.getItem('eat_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(token, user) {
  if (!token) {
    console.error('[useAuth] saveAuth: token 为空，拒绝存储');
    return;
  }
  state.token = token;
  state.user = user;
  try {
    localStorage.setItem('eat_token', token);
    if (user) {
      localStorage.setItem('eat_user', JSON.stringify(user));
    }
  } catch (e) {
    console.error('[useAuth] localStorage 写入失败:', e.message);
  }
}

function clearAuth() {
  state.token = null;
  state.user = null;
  try {
    localStorage.removeItem('eat_token');
    localStorage.removeItem('eat_user');
  } catch (e) {
    console.error('[useAuth] localStorage 清除失败:', e.message);
  }
}

export const useAuth = () => {
  const isLoggedIn = computed(() => !!state.token && !!state.user);

  /** 初始化：检查 token 有效性 */
  const init = async () => {
    if (!state.token) {
      state.initDone = true;
      return;
    }
    try {
      state.loading = true;
      const user = await api.get('/api/auth/me');
      state.user = user;
      localStorage.setItem('eat_user', JSON.stringify(user));
    } catch {
      // token 无效，清除
      clearAuth();
    } finally {
      state.loading = false;
      state.initDone = true;
    }
  };

  /** 注册 */
  const register = async (username, password) => {
    state.loading = true;
    try {
      const data = await api.post('/api/auth/register', { username, password });
      // 防御：确保响应包含 token
      if (!data || !data.token) {
        throw new Error('注册响应缺少认证令牌，请重试');
      }
      saveAuth(data.token, data.user);
      // 验证存储成功（同步读取，localStorage 立即可用）
      if (!localStorage.getItem('eat_token')) {
        console.error('[useAuth] 注册后 token 存储验证失败');
      }
      return data;
    } catch (err) {
      // 接口报错时不清除已有 token（防止覆盖之前有效的登录态）
      throw err;
    } finally {
      state.loading = false;
    }
  };

  /** 登录 */
  const login = async (username, password) => {
    state.loading = true;
    try {
      const data = await api.post('/api/auth/login', { username, password });
      // 防御：确保响应包含 token
      if (!data || !data.token) {
        throw new Error('登录响应缺少认证令牌，请重试');
      }
      saveAuth(data.token, data.user);
      // 验证存储成功
      if (!localStorage.getItem('eat_token')) {
        console.error('[useAuth] 登录后 token 存储验证失败');
      }
      return data;
    } catch (err) {
      // 登录失败时清除残留（可能是过期 token 导致的其他接口报错）
      throw err;
    } finally {
      state.loading = false;
    }
  };

  /** 登出 */
  const logout = () => {
    clearAuth();
  };

  /** 刷新用户信息 */
  const refreshUser = async () => {
    try {
      const user = await api.get('/api/auth/me');
      state.user = user;
      localStorage.setItem('eat_user', JSON.stringify(user));
    } catch { /* 静默失败，不影响主流程 */ }
  };

  // 监听全局 401 过期事件（由 api/index.js 的响应拦截器触发）
  authEvents.onExpired(() => {
    console.warn('[useAuth] 收到 401 过期事件，清除登录状态');
    clearAuth();
  });

  return { state, isLoggedIn, init, register, login, logout, refreshUser, clearAuth };
};
