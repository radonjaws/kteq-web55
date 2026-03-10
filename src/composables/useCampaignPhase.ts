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
 * "(Re)Discover KTEQ" is the internal campaign name — the umbrella for the
 * full 2026 effort. The public-facing messaging is different at each phase
 * because the website's job changes as the campaign progresses.
 *
 * Phases:
 *
 *   "rediscover"  — Still Here. Still Weird.
 *                    The opening phase. Social media carries the chronological
 *                    anniversary storytelling (yearly milestones, alumni engagement).
 *                    The website's job is simpler: establish that KTEQ exists, has
 *                    55 years of history, and invite alumni/listeners to share
 *                    their memories. The stream is live, the vibe is warm and
 *                    welcoming, the CTA is about connection, not consumption.
 *                    Runs through summer 2026 while content is being collected.
 *
 *   "kteqlive"    — Welcome Back!
 *                    Late August through homecoming. Does double duty: welcomes
 *                    students returning to campus AND previews the return to live
 *                    broadcasts from the renovated studio. Also welcomes homecoming
 *                    visitors and alumni. The grand reopening (Sept 25, M-Week) is
 *                    the centerpiece event. Short, high-energy phase.
 *
 *   "kteq100"     — KTEQ 100 (Standard Operations)
 *                    Post-campaign steady state. By this point, the summer's
 *                    history content (photos, stories, timeline entries) has been
 *                    built out, so "Explore Our History" becomes meaningful as a
 *                    CTA. Consistent programming, underwriting, regular fundraising
 *                    intervals, alumni engagement — all focused on long-term
 *                    sustainability. "100" = KTEQ's 100th anniversary in 2071,
 *                    the horizon we're building toward. The next campaign evolves
 *                    into inviting new students — now familiar with the station's
 *                    history and context — to contribute.
 */

interface HeroConfig {
  headline: string
  subhead: string
  cta: { text: string; route?: string; action?: 'play' | 'mailto' }
  secondaryCta?: { text: string; route: string }
}

// Bot-proofed mailto: assembled at runtime so it's not scrapable from source
function getStationEmail(): string {
  const user = 'kteq'
  const domain = 'mines.sdsmt.edu'
  return `${user}@${domain}`
}

export function useCampaignPhase() {
  const content = useContentStore()

  const phase = computed(() => content.settings.campaignPhase)

  const isRediscover = computed(() => phase.value === 'rediscover')
  const isKteqLive = computed(() => phase.value === 'kteqlive')
  const isKteq100 = computed(() => phase.value === 'kteq100')

  const heroConfig = computed<HeroConfig>(() => {
    const configs: Record<string, HeroConfig> = {
      rediscover: {
        headline: 'Still Here. Still Weird.',
        subhead: '55 years of alternative radio in the Black Hills',
        cta: {
          text: 'Share Your Memories',
          action: 'mailto'
        },
        secondaryCta: { text: 'Listen Now', route: '/listen' }
      },
      kteqlive: {
        headline: 'Welcome Back!',
        subhead: 'Live from the Black Hills — KTEQ returns to the studio',
        cta: { text: 'Listen Live', action: 'play' },
        secondaryCta: { text: 'Our History', route: '/history' }
      },
      kteq100: {
        headline: 'Black Hills Alternative Radio',
        subhead: 'KTEQ-FM 91.3 — Rapid City, South Dakota',
        cta: { text: 'Explore Our History', route: '/history' },
        secondaryCta: { text: 'Listen Now', route: '/listen' }
      }
    }
    return configs[phase.value] || configs.rediscover
  })

  // mailto link for "Share Your Memories" CTA
  const memoriesMailto = computed(() => {
    const email = getStationEmail()
    const subject = encodeURIComponent('My KTEQ Memories')
    const body = encodeURIComponent(
      'Hi KTEQ,\n\nI wanted to share some memories from my time with the station:\n\n'
    )
    return `mailto:${email}?subject=${subject}&body=${body}`
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
    isKteq100,
    heroConfig,
    memoriesMailto,
    reopeningDate,
    daysUntilReopening,
    showCountdown
  }
}
