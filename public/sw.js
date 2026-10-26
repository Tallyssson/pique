// Service worker do Pique: guarda o app para abrir rápido e sem internet.
// Os dados do Supabase não passam por aqui (outro domínio), sempre vêm da rede.
const CACHE = 'pique-v1'
const ESSENCIAIS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const fontes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (url.origin !== self.location.origin && !fontes) return

  // Páginas: rede primeiro (para pegar versões novas), cache se estiver sem internet.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { guardar('/index.html', res.clone()); return res })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Arquivos do build têm hash no nome: cache primeiro.
  e.respondWith(
    caches.match(req).then((achado) => achado || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') guardar(req, res.clone())
      return res
    }))
  )
})

function guardar(chave, res) {
  caches.open(CACHE).then((c) => c.put(chave, res))
}
