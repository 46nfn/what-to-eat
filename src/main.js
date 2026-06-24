import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

// 捕获启动错误
try {
  const app = createApp(App)
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err)
    const el = document.getElementById('app')
    if (el) {
      el.innerHTML += `<div style="color:red;padding:20px;font-family:monospace;"><h3>Vue Error</h3><pre>${err.stack || err.message || err}</pre><p>Info: ${info}</p></div>`
    }
  }
  app.use(router)
  app.mount('#app')
  console.log('🍜 这顿吃什么 - Vue mounted successfully')
} catch (e) {
  console.error('App init error:', e)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;"><h3>Init Error</h3><pre>${e.stack || e.message}</pre></div>`
  }
}
