import { ref, onMounted, onUnmounted } from 'vue'
import { useContentStore } from '@/stores/content'

export function useNowOnAir() {
  const content = useContentStore()
  const currentShow = ref(content.getCurrentShow())
  let interval: ReturnType<typeof setInterval> | null = null

  function update() {
    currentShow.value = content.getCurrentShow()
  }

  onMounted(() => {
    update()
    // Re-check every 30 seconds
    interval = setInterval(update, 30_000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return {
    currentShow
  }
}
