/**
 * KTEQ Stream Proxy — Cloudflare Worker
 *
 * Proxies the university Icecast server (HTTP-only) to HTTPS so the site
 * can load the stream without mixed-content errors.
 *
 * Routes:
 *   GET /          → audio stream proxy
 *   GET /metadata  → current track info from Icecast JSON stats
 *   OPTIONS *      → CORS preflight
 *
 * Deploy:
 *   wrangler deploy  (or paste into the Cloudflare dashboard editor)
 *
 * Wrangler config: see wrangler.toml
 */

const UPSTREAM_STREAM = 'http://kteq-streamer.sdsmt.edu:8000/kteq'
const UPSTREAM_STATS  = 'http://kteq-streamer.sdsmt.edu:8000/status-json.xsl'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Icy-MetaData',
  'Access-Control-Expose-Headers': [
    'icy-br', 'icy-description', 'icy-genre', 'icy-metaint',
    'icy-name', 'icy-pub', 'icy-sr', 'icy-url', 'Content-Type',
  ].join(', '),
}

export default {
  async fetch(request) {
    const url = new URL(request.url)

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // ── /metadata — current track info from Icecast stats ────────────────────
    if (url.pathname === '/metadata') {
      try {
        const statsRes = await fetch(UPSTREAM_STATS, {
          headers: { 'User-Agent': 'KTEQ-Proxy/1.0' },
          // Cache for 10 seconds at the edge to reduce upstream load
          cf: { cacheEverything: true, cacheTtl: 10 },
        })

        const data = await statsRes.json()

        // Icecast returns source as an object (single mount) or array (multiple)
        const src = Array.isArray(data?.icestats?.source)
          ? data.icestats.source.find(s => s.listenurl?.endsWith('/kteq')) ?? data.icestats.source[0]
          : data?.icestats?.source ?? null

        const rawTitle = src?.title ?? src?.song ?? ''
        // Most automation systems encode as "Artist - Title"
        const dashIdx = rawTitle.indexOf(' - ')
        const artist = dashIdx > -1 ? rawTitle.slice(0, dashIdx).trim() : ''
        const song   = dashIdx > -1 ? rawTitle.slice(dashIdx + 3).trim() : rawTitle.trim()

        return new Response(
          JSON.stringify({
            title:     rawTitle,
            artist,
            song,
            listeners: src?.listeners ?? 0,
            bitrate:   src?.['ice-bitrate'] ?? src?.bitrate ?? 0,
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type':  'application/json',
              'Cache-Control': 'no-store',
            },
          }
        )
      } catch (err) {
        return new Response(
          JSON.stringify({ title: '', artist: '', song: '', listeners: 0, error: String(err) }),
          {
            status: 200, // don't surface 5xx to the player
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // ── Default — proxy the audio stream ─────────────────────────────────────
    try {
      const upstreamReq = new Request(UPSTREAM_STREAM, {
        method:  request.method,
        headers: {
          // Request inline ICY metadata so the browser can parse track titles
          // (the Audio element ignores it, but it's there for future custom parsers)
          'Icy-MetaData':  request.headers.get('Icy-MetaData') ?? '1',
          'User-Agent':    'KTEQ-Proxy/1.0',
        },
      })

      const upstream = await fetch(upstreamReq)

      const headers = new Headers(CORS_HEADERS)
      for (const [key, value] of upstream.headers.entries()) {
        const lower = key.toLowerCase()
        if (
          lower === 'content-type'        ||
          lower === 'transfer-encoding'   ||
          lower.startsWith('icy-')
        ) {
          headers.set(key, value)
        }
      }

      return new Response(upstream.body, {
        status:     upstream.status,
        statusText: upstream.statusText,
        headers,
      })
    } catch (err) {
      return new Response(`Upstream error: ${err}`, { status: 502, headers: CORS_HEADERS })
    }
  },
}
