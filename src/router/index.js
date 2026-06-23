import { createRouter, createWebHashHistory } from 'vue-router'

/** 懒加载所有独立分页 */
const DrawPage = () => import('@/views/DrawPage.vue')
const AiChatPage = () => import('@/views/AiChatPage.vue')
const RecordPage = () => import('@/views/RecordPage.vue')
const DiaryPage = () => import('@/views/DiaryPage.vue')
const FoodDetailPage = () => import('@/views/FoodDetailPage.vue')
const CommunityPage = () => import('@/views/CommunityPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')

const routes = [
  { path: '/', redirect: '/draw' },
  { path: '/draw', name: 'draw', component: DrawPage },
  { path: '/ai-chat', name: 'ai-chat', component: AiChatPage },
  { path: '/record', name: 'record', component: RecordPage },
  { path: '/diary', name: 'diary', component: DiaryPage },
  { path: '/diary/:id', name: 'detail', component: FoodDetailPage },
  { path: '/community', name: 'community', component: CommunityPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
]

export default createRouter({ history: createWebHashHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
