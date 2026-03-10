import { computed } from 'vue'
import { useContentStore } from '@/stores/content'

/**
 * Campaign Phase System
 *
 * KTEQ uses "campaigns" to change the website's tone, messaging, and calls to
 * action based on what the station is currently focused on. A campaign phase
 * is a single setting that ripples across the site — changing the homepage hero,
 * adjusting CTAs, and shifting visual emphasis — without touching any code.
 *
 * Current campaign: (Re)Discover KTEQ (55th Anniversary, 2026)
 *
 * Phases:
 *
 *   "rediscover"  — (Re)Discover KTEQ / 55th Anniversary
 *                    The main campaign. Reconnecting with alumni, celebrating
 *                    55 years of history, fundraising, and building toward the
 *                    grand reopening. The history/timeline is the centerpiece.
 *                    This is the active phase for most of 2026.
 *
 *   "kteqlive"    — KTEQ Live (Grand Reopening)
 *                    The culmination of the (Re)Discover campaign. Centered on
 *                    the September 25, 2026 M-Week reopening and anniversary
 *                    concert. High-energy countdown. Short-duration phase.
 *
 *   "kteq2071"    — KTEQ 2071 (Standard Operations)
 *                    Post-campaign steady state. Consistent programming,
 *                    underwriting support, regular fundraising intervals,
 *                    alumni engagement — all focused on long-term sustainability.
 *                    "2071" = KTEQ's 100th anniversary, the horizon we're
 *                    building toward.
 */

interface HeroConfig {
  headline: string
  subhead: string
  cta: { text: string; route: string }
  secondaryCta?: { text: string; route: string }
}

export function useCampaignPhase() {
  const content = useContentStore()

  const phase = computed(() => content.settings.campaignPhase)

  const isRediscover = computed(() => phase.value === 'rediscover')
  const isKteqLive = computed(() => phase.value === 'kteqlive')
  const isKteq2071 = computed(() => phase.value === 'kteq2071')

  const heroConfig = computed<HeroConfig>(() => {
    const configs: Record<string, HeroConfig> = {
      rediscover: {
        headline: '(Re)Discover KTEQ',
        subhead: '55 years of freeform radio in the Black Hills',
        cta: { text: 'Explore Our History', route: '/history' },
        secondaryCta: { text: 'Listen Now', route: '/listen' }
      },
      kteqlive: {
        headline: 'KTEQ Is Back',
        subhead: 'Grand reopening — September 25, 2026',
        cta: { text: 'Listen Live', route: '/listen' },
        secondaryCta: { text: 'Our History', route: '/history' }
      },
      kteq2071: {
        headline: 'Black Hills Alternative Radio',
        subhead: 'KTEQ-FM 91.3 — Rapid City, South Dakota',
        cta: { text: 'Listen Now', route: '/listen' },
        secondaryCta: { text: 'View Schedule', route: '/schedule' }
      }
    }
    return configs[phase.value] || configs.rediscover
  })

  // Countdown to reopening (relevant during rediscover and kteqlive)
  const reopeningDate = computed(() => new Date(content.settings.reopeningDate))
  const daysUntilReopening = computed(() => {
    const now = new Date()
    const diff = reopeningDate.value.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })
  const showCountdown = computed(() =>
    (isRediscover.value || isKteqLive.value) && daysUntilReopening.value > 0
  )

  return {
    phase,
    isRediscover,
    isKteqLive,
    isKteq2071,
    heroConfig,
    reopeningDate,
    daysUntilReopening,
    showCountdown
  }
}
