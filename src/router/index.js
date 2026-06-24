import { createRouter, createWebHashHistory } from 'vue-router'

/** 懒加载所有独立分页 */
const DrawPage = () => import('@/views/DrawPage.vue')
const AiChatPage = () => import('@/views/AiChatPage.vue')
const RecordPage = () => import('@/views/RecordPage.vue')
const DiaryPage = () => import('@/views/DiaryPage.vue')
const FoodDetailPage = () => import('@/views/FoodDetailPage.vue')
const CommunityPage = () => import('@/views/CommunityPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')
const LoginPage = () => import('@/views/LoginPage.vue')
const RegisterPage = () => import('@/views/RegisterPage.vue')

const routes = [
  { path: '/', redirect: '/draw' },
  { path: '/draw', name: 'draw', component: DrawPage },
  { path: '/ai-chat', name: 'ai-chat', component: AiChatPage, meta: { requiresAuth: true } },
  { path: '/record', name: 'record', component: RecordPage, meta: { requiresAuth: true } },
  { path: '/diary', name: 'diary', component: DiaryPage, meta: { requiresAuth: true } },
  { path: '/diary/:id', name: 'detail', component: FoodDetailPage, meta: { requiresAuth: true } },
  { path: '/community', name: 'community', component: CommunityPage, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guest: true } },
]

const router = createRouter({ history: createWebHashHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

// ==================== 路由守卫 ====================
router.beforeEach((to, from, next) => {
  // 从 localStorage 检查登录状态（避免依赖尚未初始化的 store）
  const token = localStorage.getItem('eat_token')

  // 需要登录的页面
  if (to.meta.requiresAuth && !token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // 已登录用户访问登录/注册页，重定向到日记页
  if (to.meta.guest && token) {
    return next({ path: '/diary' })
  }

  next()
})

export default router
