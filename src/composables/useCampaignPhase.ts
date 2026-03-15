import { computed } from 'vue'
import { useContentStore } from '@/stores/content'
import type { CampaignPhaseItem } from '@/stores/content'

/**
 * Campaign Phase System
 *
 * Campaigns drive the homepage hero, CTA buttons, and countdown. One campaign
 * is active at a time (set via settings.activeCampaign). Each campaign can be:
 *
 *   Single-phase — uses root-level headline/subhead/cta fields directly.
 *
 *   Multi-phase  — has a phases[] array. The active phase is determined by
 *                  scheduleType:
 *
 *     'manual'   — admin advances phases by hand (activePhaseIndex).
 *     'dated'    — phases auto-advance when their phaseEnd date passes.
 *                  The last phase holds indefinitely after all end dates pass.
 *     'rotator'  — phases cycle on a fixed schedule computed from campaignStart
 *                  and rotator settings; all client-side, no deploys needed.
 */

interface HeroConfig {
  headline: string
  subhead: string
  cta: { text: string; route?: string; action?: 'play' | 'mailto' }
  secondaryCta?: { text: string; route: string }
}

// Bot-proofed station email — assembled at runtime, never in source as a literal
function getStationEmail(): string {
  const user = 'kteq'
  const domain = 'mines.sdsmt.edu'
  return `${user}@${domain}`
}

// Resolve which phase item is active for a multi-phase campaign.
// Returns null when there are no phases (single-phase campaign).
function resolveActivePhase(campaign: any): CampaignPhaseItem | null {
  const phases: CampaignPhaseItem[] = campaign.phases || []
  if (phases.length === 0) return null

  const scheduleType: string = campaign.scheduleType || 'manual'
  const now = Date.now()

  if (scheduleType === 'dated') {
    // Sort phases by phaseEnd ascending (matches what the editor enforces on save)
    const sorted = [...phases].sort(
      (a, b) => new Date(a.phaseEnd).getTime() - new Date(b.phaseEnd).getTime()
    )
    // First phase whose end date hasn't passed yet; fall through to last if all expired
    return sorted.find(p => p.phaseEnd && new Date(p.phaseEnd).getTime() > now)
      ?? sorted[sorted.length - 1]
  }

  if (scheduleType === 'rotator') {
    const n = phases.length
    const start = campaign.campaignStart ? new Date(campaign.campaignStart).getTime() : 0
    const unit: string = campaign.rotatorUnit || 'days'
    const value: number = campaign.rotatorValue || 1
    const ms: Record<string, number> = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 }
    let msPerPhase: number
    if (campaign.rotatorMode === 'cycle') {
      // Total cycle duration divided equally among phases
      msPerPhase = (value * ms[unit]) / n
    } else {
      // Each phase gets its own duration ('each' mode)
      msPerPhase = value * ms[unit]
    }
    const elapsed = Math.max(0, now - start)
    const idx = msPerPhase > 0 ? Math.floor(elapsed / msPerPhase) % n : 0
    return phases[idx]
  }

  // manual — use the stored activePhaseIndex
  const idx = Math.min(campaign.activePhaseIndex ?? 0, phases.length - 1)
  return phases[Math.max(0, idx)]
}

// Build a HeroConfig from a resolved phase item
function phaseToHeroConfig(phase: CampaignPhaseItem): HeroConfig {
  const action = (phase.ctaPrimaryAction || 'route') as 'play' | 'mailto' | 'route'
  return {
    headline: phase.headline,
    subhead: phase.subhead,
    cta: {
      text: phase.ctaPrimaryText || 'Listen Now',
      action: action !== 'route' ? action : undefined,
      route: action === 'route' ? (phase.ctaPrimaryRoute || '/listen') : undefined
    },
    secondaryCta: phase.ctaSecondaryText
      ? { text: phase.ctaSecondaryText, route: phase.ctaSecondaryRoute || '/listen' }
      : undefined
  }
}

// Absolute fallback when no campaign is configured at all
const EMPTY_CONFIG: HeroConfig = {
  headline: 'KTEQ-FM 91.3',
  subhead: 'Alternative Radio from the Black Hills',
  cta: { text: 'Listen Now', route: '/listen' }
}

export function useCampaignPhase() {
  const content = useContentStore()

  const heroConfig = computed<HeroConfig>(() => {
    const c = content.activeCampaign
    if (!c) return EMPTY_CONFIG

    // Multi-phase path
    const activePhase = resolveActivePhase(c)
    if (activePhase) return phaseToHeroConfig(activePhase)

    // Single-phase path — use root campaign fields
    const action = ((c as any).ctaPrimaryAction || 'route') as 'play' | 'mailto' | 'route'
    return {
      headline: c.headline || EMPTY_CONFIG.headline,
      subhead: c.subhead || EMPTY_CONFIG.subhead,
      cta: {
        text: c.ctaPrimary || 'Listen Now',
        action: action !== 'route' ? action : undefined,
        route: action === 'route' ? ((c as any).ctaPrimaryRoute || '/listen') : undefined
      },
      secondaryCta: c.ctaSecondary
        ? { text: c.ctaSecondary, route: (c as any).ctaSecondaryRoute || '/listen' }
        : undefined
    }
  })

  // mailto link assembled at runtime for bot protection
  const memoriesMailto = computed(() => {
    const email = getStationEmail()
    const subject = encodeURIComponent('My KTEQ Memories')
    const body = encodeURIComponent(
      'Hi KTEQ,\n\nI wanted to share some memories from my time with the station:\n\n'
    )
    return `mailto:${email}?subject=${subject}&body=${body}`
  })

  // Countdown — campaign-level, not per-phase
  const countdownTarget = computed(() =>
    content.activeCampaign?.countdownTarget
      ? new Date(content.activeCampaign.countdownTarget)
      : null
  )
  const daysUntilCountdown = computed(() => {
    if (!countdownTarget.value) return 0
    const diff = countdownTarget.value.getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1_000 * 60 * 60 * 24)))
  })
  const showCountdown = computed(
    () => !!countdownTarget.value && daysUntilCountdown.value > 0
  )
  const countdownLabel = computed(
    () => content.activeCampaign?.countdownLabel ?? ''
  )
  const countdownLabelPosition = computed(() =>
    content.activeCampaign?.countdownLabelPosition === 'before' ? 'before' : 'after'
  )

  return {
    heroConfig,
    memoriesMailto,
    countdownTarget,
    daysUntilCountdown,
    showCountdown,
    countdownLabel,
    countdownLabelPosition
  }
}
