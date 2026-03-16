import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useContentStore } from './content'

interface NowPlaying {
  title:     string
  artist:    string
  song:      string
  listeners: number
}

const EMPTY_NOW_PLAYING: NowPlaying = { title: '', artist: '', song: '', listeners: 0 }

export const usePlayerStore = defineStore('player', () => {
  // Audio element — created once, never destroyed
  const audio = new Audio()
  audio.preload = 'none'

  // Reactive state
  const isPlaying      = ref(false)
  const isLoading      = ref(false)
  const hasError       = ref(false)
  const errorMessage   = ref('')
  const volume         = ref(parseFloat(localStorage.getItem('kteq-volume') || '0.8'))
  const nowPlaying     = ref<NowPlaying>({ ...EMPTY_NOW_PLAYING })

  // Apply saved volume
  audio.volume = volume.value

  // ── Audio event listeners ─────────────────────────────────────────────────
  audio.addEventListener('playing', () => {
    isPlaying.value  = true
    isLoading.value  = false
    hasError.value   = false
    // Fetch metadata immediately on connect
    fetchMetadata()
  })

  audio.addEventListener('pause', () => {
    isPlaying.value = false
    isLoading.value = false
    stopMetadataPolling()
  })

  audio.addEventListener('waiting', () => {
    isLoading.value = true
  })

  audio.addEventListener('error', () => {
    isPlaying.value  = false
    isLoading.value  = false
    hasError.value   = true
    errorMessage.value = 'Stream unavailable'
    stopMetadataPolling()
  })

  // Persist volume preference
  watch(volume, (v) => {
    audio.volume = v
    localStorage.setItem('kteq-volume', v.toString())
  })

  // ── Metadata polling ──────────────────────────────────────────────────────
  let metadataTimer: ReturnType<typeof setInterval> | null = null

  async function fetchMetadata() {
    const content = useContentStore()
    const streamUrl = (content.settings as any).streamUrl as string | undefined
    if (!streamUrl) return

    // The Worker exposes /metadata at the same origin as the stream proxy
    try {
      const url = new URL(streamUrl)
      url.pathname = '/metadata'
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.title !== undefined) {
          nowPlaying.value = {
            title:     data.title     ?? '',
            artist:    data.artist    ?? '',
            song:      data.song      ?? '',
            listeners: data.listeners ?? 0,
          }
        }
      }
    } catch {
      // Metadata is best-effort — never surface errors to the user
    }
  }

  function startMetadataPolling() {
    fetchMetadata()
    if (!metadataTimer) {
      metadataTimer = setInterval(fetchMetadata, 15_000)
    }
  }

  function stopMetadataPolling() {
    if (metadataTimer) {
      clearInterval(metadataTimer)
      metadataTimer = null
    }
    nowPlaying.value = { ...EMPTY_NOW_PLAYING }
  }

  // ── Playback ──────────────────────────────────────────────────────────────
  async function tryPlay(url: string): Promise<boolean> {
    audio.src = url
    audio.load()
    try {
      await audio.play()
      startMetadataPolling()
      return true
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        // Browser blocked autoplay — not a stream problem, surface it
        isLoading.value  = false
        hasError.value   = true
        errorMessage.value = 'Click play to start listening'
      }
      return false
    }
  }

  async function play() {
    const content = useContentStore()
    const primaryUrl  = (content.settings as any).streamUrl as string | undefined
    const fallbackUrl = (content.settings as any).streamFallbackUrl as string | undefined

    if (!primaryUrl) {
      hasError.value   = true
      errorMessage.value = 'No stream URL configured'
      return
    }

    hasError.value  = false
    isLoading.value = true

    // Try primary (HTTPS proxy)
    const ok = await tryPlay(primaryUrl)
    if (ok) return

    // Autoplay was blocked — don't attempt fallback
    if (errorMessage.value === 'Click play to start listening') return

    // Try fallback if defined (HTTP direct — works on local dev, blocked on HTTPS pages)
    if (fallbackUrl && fallbackUrl !== primaryUrl) {
      const fallbackOk = await tryPlay(fallbackUrl)
      if (fallbackOk) return
    }

    // Both failed
    isLoading.value  = false
    hasError.value   = true
    errorMessage.value = 'Could not connect to stream'
  }

  function stop() {
    audio.pause()
    audio.src = ''
    audio.removeAttribute('src')
    isPlaying.value = false
    isLoading.value = false
    stopMetadataPolling()
  }

  function toggle() {
    if (isPlaying.value || isLoading.value) {
      stop()
    } else {
      play()
    }
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
  }

  return {
    isPlaying,
    isLoading,
    hasError,
    errorMessage,
    volume,
    nowPlaying,
    play,
    stop,
    toggle,
    setVolume,
  }
})
