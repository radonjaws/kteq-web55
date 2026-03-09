import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useContentStore } from './content'

export const usePlayerStore = defineStore('player', () => {
  // Audio element — created once, never destroyed
  const audio = new Audio()
  audio.preload = 'none'

  // Reactive state
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const volume = ref(parseFloat(localStorage.getItem('kteq-volume') || '0.8'))

  // Apply saved volume
  audio.volume = volume.value

  // Audio event listeners
  audio.addEventListener('playing', () => {
    isPlaying.value = true
    isLoading.value = false
    hasError.value = false
  })

  audio.addEventListener('pause', () => {
    isPlaying.value = false
    isLoading.value = false
  })

  audio.addEventListener('waiting', () => {
    isLoading.value = true
  })

  audio.addEventListener('error', () => {
    isPlaying.value = false
    isLoading.value = false
    hasError.value = true
    errorMessage.value = 'Stream unavailable'
  })

  // Persist volume preference
  watch(volume, (v) => {
    audio.volume = v
    localStorage.setItem('kteq-volume', v.toString())
  })

  function play() {
    const content = useContentStore()
    const url = content.settings.streamUrl

    if (!url) {
      hasError.value = true
      errorMessage.value = 'No stream URL configured'
      return
    }

    hasError.value = false
    isLoading.value = true

    // Always reload the stream to get a fresh connection
    audio.src = url
    audio.load()
    audio.play().catch((err) => {
      // User gesture required — browser blocked autoplay
      isLoading.value = false
      hasError.value = true
      errorMessage.value = err.name === 'NotAllowedError'
        ? 'Click play to start listening'
        : 'Could not connect to stream'
    })
  }

  function stop() {
    audio.pause()
    audio.src = ''
    audio.removeAttribute('src')
    isPlaying.value = false
    isLoading.value = false
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
    play,
    stop,
    toggle,
    setVolume
  }
})
