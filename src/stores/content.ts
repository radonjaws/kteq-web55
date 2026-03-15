import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// Build-time imports — these get bundled into the app
import settingsData from '@content/settings.json'
import scheduleData from '@content/schedule.json'
import showsData from '@content/shows.json'
import djsData from '@content/djs.json'
import timelineData from '@content/timeline.json'

// Blog posts via glob import
const postModules = import.meta.glob('@content/posts/*.json', { eager: true }) as Record<string, { default: any }>

// Campaigns via glob import
const campaignModules = import.meta.glob('@content/campaigns/*.json', { eager: true }) as Record<string, { default: any }>

interface Show {
  slug: string
  name: string
  tagline: string
  description: string
  djSlugs: string[]
  image: string
  genre: string
  isActive: boolean
  isAutomation?: boolean
  socialLinks: Record<string, string>
}

interface DJ {
  slug: string
  name: string
  bio: string
  image: string
  showSlugs: string[]
  yearJoined: number
  isActive: boolean
  socialLinks: Record<string, string>
}

interface TimelineEntry {
  id: string
  year: number
  month?: number
  title: string
  description: string
  image: string
  mediaUrl: string
  category: string
  sources: string
}

interface ScheduleSlot {
  id: string
  startTime: string
  endTime: string
  showSlug: string
  isAutomation: boolean
  notes: string
}

export interface CampaignPhaseItem {
  name: string
  headline: string
  subhead: string
  ctaPrimaryText: string
  ctaPrimaryAction: string   // 'play' | 'mailto' | 'route'
  ctaPrimaryRoute: string
  ctaSecondaryText: string
  ctaSecondaryRoute: string
  phaseEnd: string           // ISO 8601; only used in 'dated' schedule mode
}

interface Campaign {
  slug: string
  name: string
  heroImage: string
  // Single-phase content (used when phases[] is absent or empty)
  headline: string
  subhead: string
  ctaPrimary: string
  ctaPrimaryAction: string   // 'play' | 'mailto' | 'route'
  ctaPrimaryRoute: string
  ctaSecondary: string
  ctaSecondaryRoute: string
  // Campaign date range (informational; not activation triggers)
  campaignStart: string
  campaignEnd: string
  // Phase scheduling
  scheduleType: string       // 'manual' | 'dated' | 'rotator'
  phases: CampaignPhaseItem[]
  activePhaseIndex: number   // used in manual multi-phase mode
  rotatorValue: number
  rotatorUnit: string        // 'minutes' | 'hours' | 'days'
  rotatorMode: string        // 'each' | 'cycle'
  // Countdown (campaign-level, not per-phase)
  countdownTarget: string
  countdownLabel: string
  countdownLabelPosition: string
  // Legacy field — kept for backward compat during migration; ignored by composable
  phase?: string
}

interface BlogPost {
  slug: string
  title: string
  body: string
  excerpt: string
  featuredImage: string
  author: string
  status: string
  publishedAt: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const useContentStore = defineStore('content', () => {
  // Settings
  const settings = ref(settingsData)

  // Schedule
  const schedule = ref(scheduleData)

  // Shows (keyed by slug for quick lookup)
  const shows = ref<Show[]>(showsData.shows)
  const showBySlug = computed(() => {
    const map: Record<string, Show> = {}
    for (const show of shows.value) {
      map[show.slug] = show
    }
    return map
  })

  // DJs
  const djs = ref<DJ[]>(djsData.djs)
  const djBySlug = computed(() => {
    const map: Record<string, DJ> = {}
    for (const dj of djs.value) {
      map[dj.slug] = dj
    }
    return map
  })

  // Timeline
  const timeline = ref<TimelineEntry[]>(timelineData.entries)
  const timelineSorted = computed(() =>
    [...timeline.value].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return (a.month || 0) - (b.month || 0)
    })
  )
  const timelineDecades = computed(() => {
    const decades = new Set<number>()
    for (const entry of timeline.value) {
      decades.add(Math.floor(entry.year / 10) * 10)
    }
    return [...decades].sort()
  })

  // Campaigns
  const campaigns = ref<Campaign[]>(
    Object.values(campaignModules).map((m: any) => m.default || m)
  )
  const activeCampaign = computed<Campaign | null>(() =>
    campaigns.value.find(c => c.slug === settings.value.activeCampaign) ?? campaigns.value[0] ?? null
  )

  // Blog posts
  const posts = ref<BlogPost[]>(
    Object.values(postModules)
      .map((m: any) => m.default || m)
      .filter((p: BlogPost) => p.status === 'published')
      .sort((a: BlogPost, b: BlogPost) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
  )

  // Schedule helpers
  function getScheduleForDay(day: string): ScheduleSlot[] {
    return schedule.value.days[day as keyof typeof schedule.value.days] || []
  }

  function getCurrentShow(): { slot: ScheduleSlot; show: Show } | null {
    const now = new Date()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const day = days[now.getDay()]
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const slots = getScheduleForDay(day)
    for (const slot of slots) {
      // Handle midnight-crossing shows
      if (slot.endTime === '00:00') {
        if (time >= slot.startTime) {
          return { slot, show: showBySlug.value[slot.showSlug] }
        }
      } else if (time >= slot.startTime && time < slot.endTime) {
        return { slot, show: showBySlug.value[slot.showSlug] }
      }
    }
    return null
  }

  return {
    settings,
    campaigns,
    activeCampaign,
    schedule,
    shows,
    showBySlug,
    djs,
    djBySlug,
    timeline,
    timelineSorted,
    timelineDecades,
    posts,
    getScheduleForDay,
    getCurrentShow
  }
})
