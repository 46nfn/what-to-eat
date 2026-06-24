/**
 * Service Worker — 这顿吃什么 PWA
 * 策略: Network First（在线时从网络获取最新，离线时使用缓存）
 * 缓存: 静态资源 + API 兜底
 */

const CACHE_VERSION = 'eat-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 安装时需要预缓存的静态资源路径
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
];

// ==================== Install ====================
self.addEventListener('install', (event) => {
  console.log('🍜 SW: installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('🍜 SW: precaching static files');
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('🍜 SW: precache failed (some files unavailable):', err.message);
      });
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// ==================== Activate ====================
self.addEventListener('activate', (event) => {
  console.log('🍜 SW: activated');
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => !key.startsWith(CACHE_VERSION))
          .map(key => {
            console.log('🍜 SW: deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // 让新的 SW 立即接管所有页面
  self.clients.claim();
});

// ==================== Fetch ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求和 chrome-extension URL
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API 请求 → Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 静态资源 (JS/CSS/图片/字体) → Cache First (带网络更新)
  if (
    url.pathname.match(/\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirstWithRefresh(request, DYNAMIC_CACHE));
    return;
  }

  // 导航请求 (HTML) → Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 其他请求 → Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ==================== 缓存策略 ====================

/** Network First — 在线返回网络，失败或用缓存兜底 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    // 仅缓存成功的 GET 响应
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 离线时尝试缓存
    const cached = await caches.match(request);
    if (cached) return cached;

    // API 请求离线兜底
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ code: -1, message: '离线模式，数据不可用', data: null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw err;
  }
}

/** Cache First — 先用缓存，同时更新缓存（Stale-While-Revalidate 变体） */
async function cacheFirstWithRefresh(request, cacheName) {
  const cached = await caches.match(request);
  // 后台更新缓存
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(cacheName).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  // 有缓存就直接返回，同时后台刷新
  if (cached) {
    // 不等待后台刷新
    return cached;
  }

  // 无缓存则等待网络
  const networkResponse = await fetchPromise;
  return networkResponse || new Response('Offline', { status: 503 });
}

// ==================== 消息处理 ====================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHES') {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
});
