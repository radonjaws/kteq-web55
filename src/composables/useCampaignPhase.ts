import { computed } from 'vue'
import { useContentStore } from '@/stores/content'

interface HeroConfig {
  headline: string
  subhead: string
  cta: { text: string; route: string }
}

export function useCampaignPhase() {
  const content = useContentStore()

  const phase = computed(() => content.settings.campaignPhase)

  const isRediscover = computed(() => phase.value === 'rediscover')
  const is55Years = computed(() => phase.value === '55years')
  const isKteqLive = computed(() => phase.value === 'kteqlive')
  const isKteq2071 = computed(() => phase.value === 'kteq2071')

  const heroConfig = computed<HeroConfig>(() => {
    const configs: Record<string, HeroConfig> = {
      rediscover: {
        headline: 'Still Here. Still Independent. Still Weird.',
        subhead: 'Black Hills alternative radio since 1971',
        cta: { text: 'Listen Now', route: '/listen' }
      },
      '55years': {
        headline: '55 Years of Freeform Radio',
        subhead: 'Celebrating five decades on the Black Hills airwaves',
        cta: { text: 'Explore Our History', route: '/history' }
      },
      kteqlive: {
        headline: 'KTEQ Is Back',
        subhead: 'Grand reopening — September 25, 2026',
        cta: { text: 'Listen Live', route: '/listen' }
      },
      kteq2071: {
        headline: 'Black Hills Alternative Radio',
        subhead: 'KTEQ-FM 91.3 — Rapid City, South Dakota',
        cta: { text: 'Listen Now', route: '/listen' }
      }
    }
    return configs[phase.value] || configs.rediscover
  })

  // Countdown to reopening
  const reopeningDate = computed(() => new Date(content.settings.reopeningDate))
  const daysUntilReopening = computed(() => {
    const now = new Date()
    const diff = reopeningDate.value.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  return {
    phase,
    isRediscover,
    is55Years,
    isKteqLive,
    isKteq2071,
    heroConfig,
    reopeningDate,
    daysUntilReopening
  }
}
