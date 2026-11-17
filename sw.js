const C = 'gonit-gram-v11';
const FILES = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/icons-twemoji.js', 'js/visuals.js', 'js/content.js', 'js/content2.js', 'js/app.js', 'fonts/kalpurush.woff2', 'icon.svg', 'manifest.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
