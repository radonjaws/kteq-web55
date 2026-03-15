<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'

const route = useRoute()
const router = useRouter()
const { saving, error, lastSaved, save, create, destroy, getContent } = useGitHub()

const isNew = computed(() => route.params.id === 'new')
const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
const activeCampaignSlug = ref('')

// ─── Countdown (campaign-level) ───────────────────────────────────────────────
const countdownDate = ref('')
const countdownTime = ref('')
const countdownOffset = ref('-06:00')

// ─── Campaign dates ────────────────────────────────────────────────────────────
const campaignStartDate = ref('')
const campaignStartTime = ref('')
const campaignEndDate = ref('')
const campaignEndTime = ref('')

// ─── Phase form type ───────────────────────────────────────────────────────────
interface PhaseFormItem {
  name: string
  heroImage: string
  headline: string
  subhead: string
  ctaPrimary: string
  ctaPrimaryAction: 'play' | 'mailto' | 'route'
  ctaPrimaryRoute: string
  ctaSecondary: string
  ctaSecondaryRoute: string
  phaseEndDate: string
  phaseEndTime: string
}

// ─── Main form ────────────────────────────────────────────────────────────────
const form = reactive({
  slug: '',
  name: '',
  heroImage: '',
  // Single-phase content fields
  headline: '',
  subhead: '',
  ctaPrimary: '',
  ctaPrimaryAction: 'route' as 'play' | 'mailto' | 'route',
  ctaPrimaryRoute: '/listen',
  ctaSecondary: '',
  ctaSecondaryRoute: '/listen',
  // Phase scheduling
  scheduleType: 'manual' as 'manual' | 'dated' | 'rotator',
  activePhaseIndex: 0,
  rotatorValue: 7,
  rotatorUnit: 'days' as 'minutes' | 'hours' | 'days',
  rotatorMode: 'each' as 'each' | 'cycle',
  phases: [] as PhaseFormItem[],
  // Countdown
  countdownLabel: '',
  countdownLabelPosition: 'after' as 'before' | 'after'
})

// ─── Phase UI state ────────────────────────────────────────────────────────────
const usePhases = ref(false)
const activePhaseTab = ref(0)
const phaseReorderWarning = ref(false)
const slugManuallyEdited = ref(false)
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const isActive = computed(() => !isNew.value && form.slug === activeCampaignSlug.value)

const previewIso = computed(() => buildIso(countdownDate.value, countdownTime.value))

const campaignPreviewStart = computed(() => buildIso(campaignStartDate.value, campaignStartTime.value))
const campaignPreviewEnd   = computed(() => buildIso(campaignEndDate.value,   campaignEndTime.value))

const allPhasesExpired = computed(() => {
  if (!usePhases.value || form.scheduleType !== 'dated' || form.phases.length === 0) return false
  const now = Date.now()
  return form.phases.every(p => {
    if (!p.phaseEndDate) return false
    return new Date(buildIso(p.phaseEndDate, p.phaseEndTime)).getTime() <= now
  })
})

const scheduleTypeOptions = [
  { value: 'manual',  label: 'Manual' },
  { value: 'dated',   label: 'Dated' },
  { value: 'rotator', label: 'Rotator' }
] as const

const scheduleTypeHint: Record<string, string> = {
  manual:  'Advance phases by hand from the Campaigns list.',
  dated:   'Each phase runs until its end date, then the next begins automatically. The last phase holds until you change the campaign.',
  rotator: 'Phases cycle automatically on a fixed schedule, computed from the campaign start date.'
}

const rotatorModeOptions = [
  { value: 'each',  label: 'Show each phase for' },
  { value: 'cycle', label: 'Full cycle repeats every' }
] as const

const ctaActionOptions = [
  { value: 'play',   label: 'Play Stream' },
  { value: 'mailto', label: 'Send Email' },
  { value: 'route',  label: 'Go to…' },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildIso(date: string, time: string): string {
  if (!date) return ''
  return `${date}T${time || '00:00'}:00${countdownOffset.value}`
}

function parseIso(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const m = iso.match(/([+-]\d{2}:\d{2})$/)
  if (m) countdownOffset.value = m[1]
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

function newPhaseItem(fallback?: Partial<PhaseFormItem>): PhaseFormItem {
  return {
    name: '',
    heroImage: fallback?.heroImage ?? '',
    headline: fallback?.headline ?? '',
    subhead: fallback?.subhead ?? '',
    ctaPrimary: fallback?.ctaPrimary ?? '',
    ctaPrimaryAction: fallback?.ctaPrimaryAction ?? 'route',
    ctaPrimaryRoute: fallback?.ctaPrimaryRoute ?? '/listen',
    ctaSecondary: fallback?.ctaSecondary ?? '',
    ctaSecondaryRoute: fallback?.ctaSecondaryRoute ?? '/listen',
    phaseEndDate: '',
    phaseEndTime: ''
  }
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(() => form.name, (name) => {
  if (isNew.value && !slugManuallyEdited.value) form.slug = slugify(name)
})

// ─── Phase management ─────────────────────────────────────────────────────────
function enablePhases() {
  form.phases = [newPhaseItem({
    heroImage: form.heroImage,
    headline: form.headline,
    subhead: form.subhead,
    ctaPrimary: form.ctaPrimary,
    ctaPrimaryAction: form.ctaPrimaryAction,
    ctaPrimaryRoute: form.ctaPrimaryRoute,
    ctaSecondary: form.ctaSecondary,
    ctaSecondaryRoute: form.ctaSecondaryRoute
  })]
  form.phases[0].name = 'Phase 1'
  usePhases.value = true
  activePhaseTab.value = 0
}

function disablePhases() {
  if (form.phases.length > 0) {
    const p = form.phases[0]
    form.heroImage     = p.heroImage
    form.headline      = p.headline
    form.subhead       = p.subhead
    form.ctaPrimary    = p.ctaPrimary
    form.ctaPrimaryAction = p.ctaPrimaryAction
    form.ctaPrimaryRoute  = p.ctaPrimaryRoute
    form.ctaSecondary     = p.ctaSecondary
    form.ctaSecondaryRoute = p.ctaSecondaryRoute
  }
  form.phases = []
  form.scheduleType = 'manual'
  form.activePhaseIndex = 0
  usePhases.value = false
}

function addPhase() {
  form.phases.push(newPhaseItem())
  form.phases[form.phases.length - 1].name = `Phase ${form.phases.length}`
  activePhaseTab.value = form.phases.length - 1
}

function removePhase(idx: number) {
  form.phases.splice(idx, 1)
  if (activePhaseTab.value >= form.phases.length) {
    activePhaseTab.value = form.phases.length - 1
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const settingsResult = await getContent('content/settings.json')
    activeCampaignSlug.value = settingsResult.content.activeCampaign || ''

    if (!isNew.value) {
      const { content, sha: fileSha } = await getContent(`content/campaigns/${route.params.id}.json`)
      sha.value = fileSha

      form.slug      = content.slug      || (route.params.id as string)
      form.name      = content.name      || ''
      form.heroImage = content.heroImage || ''

      form.headline          = content.headline          || ''
      form.subhead           = content.subhead           || ''
      form.ctaPrimary        = content.ctaPrimary        || ''
      form.ctaPrimaryAction  = content.ctaPrimaryAction  || 'route'
      form.ctaPrimaryRoute   = content.ctaPrimaryRoute   || '/listen'
      form.ctaSecondary      = content.ctaSecondary      || ''
      form.ctaSecondaryRoute = content.ctaSecondaryRoute || '/listen'

      const cs = parseIso(content.campaignStart || '')
      campaignStartDate.value = cs.date
      campaignStartTime.value = cs.time
      const ce = parseIso(content.campaignEnd || '')
      campaignEndDate.value = ce.date
      campaignEndTime.value = ce.time

      form.scheduleType     = content.scheduleType     || 'manual'
      form.activePhaseIndex = content.activePhaseIndex ?? 0
      form.rotatorValue     = content.rotatorValue     || 7
      form.rotatorUnit      = content.rotatorUnit      || 'days'
      form.rotatorMode      = content.rotatorMode      || 'each'

      if (Array.isArray(content.phases) && content.phases.length > 0) {
        form.phases = content.phases.map((p: any) => {
          const end = parseIso(p.phaseEnd || '')
          return {
            name:             p.name             || '',
            heroImage:        p.heroImage        || '',
            headline:         p.headline         || '',
            subhead:          p.subhead          || '',
            ctaPrimary:       p.ctaPrimaryText   || '',
            ctaPrimaryAction: p.ctaPrimaryAction || 'route',
            ctaPrimaryRoute:  p.ctaPrimaryRoute  || '/listen',
            ctaSecondary:     p.ctaSecondaryText || '',
            ctaSecondaryRoute:p.ctaSecondaryRoute|| '/listen',
            phaseEndDate:     end.date,
            phaseEndTime:     end.time
          } as PhaseFormItem
        })
        usePhases.value = true
        activePhaseTab.value = 0
      }

      const cd = parseIso(content.countdownTarget || '')
      countdownDate.value = cd.date
      countdownTime.value = cd.time
      form.countdownLabel         = content.countdownLabel         || ''
      form.countdownLabelPosition = content.countdownLabelPosition === 'before' ? 'before' : 'after'
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

// ─── Payload ──────────────────────────────────────────────────────────────────
function buildPayload() {
  const base: Record<string, any> = {
    slug:      form.slug,
    name:      form.name,
    heroImage: form.heroImage,
    campaignStart: buildIso(campaignStartDate.value, campaignStartTime.value),
    campaignEnd:   buildIso(campaignEndDate.value,   campaignEndTime.value),
    countdownTarget:        buildIso(countdownDate.value, countdownTime.value),
    countdownLabel:         form.countdownLabel,
    countdownLabelPosition: form.countdownLabelPosition
  }

  if (usePhases.value && form.phases.length > 0) {
    let phases = form.phases.map(p => ({
      name:             p.name,
      heroImage:        p.heroImage,
      headline:         p.headline,
      subhead:          p.subhead,
      ctaPrimaryText:   p.ctaPrimary,
      ctaPrimaryAction: p.ctaPrimaryAction,
      ctaPrimaryRoute:  p.ctaPrimaryRoute,
      ctaSecondaryText: p.ctaSecondary,
      ctaSecondaryRoute:p.ctaSecondaryRoute,
      phaseEnd: form.scheduleType === 'dated' ? buildIso(p.phaseEndDate, p.phaseEndTime) : ''
    }))

    if (form.scheduleType === 'dated') {
      const before = phases.map(p => p.name)
      phases = [...phases].sort((a, b) => {
        if (!a.phaseEnd) return 1
        if (!b.phaseEnd) return -1
        return new Date(a.phaseEnd).getTime() - new Date(b.phaseEnd).getTime()
      })
      const after = phases.map(p => p.name)
      phaseReorderWarning.value = !before.every((n, i) => n === after[i])
    } else {
      phaseReorderWarning.value = false
    }

    base.scheduleType     = form.scheduleType
    base.phases           = phases
    base.activePhaseIndex = form.activePhaseIndex
    base.rotatorValue     = form.rotatorValue
    base.rotatorUnit      = form.rotatorUnit
    base.rotatorMode      = form.rotatorMode
    base.headline = base.subhead = base.ctaPrimary = base.ctaSecondary = ''
    base.ctaPrimaryAction = 'route'
    base.ctaPrimaryRoute = base.ctaSecondaryRoute = ''
  } else {
    base.scheduleType     = 'manual'
    base.phases           = []
    base.activePhaseIndex = 0
    base.rotatorValue     = form.rotatorValue
    base.rotatorUnit      = form.rotatorUnit
    base.rotatorMode      = form.rotatorMode
    base.headline          = form.headline
    base.subhead           = form.subhead
    base.ctaPrimary        = form.ctaPrimary
    base.ctaPrimaryAction  = form.ctaPrimaryAction
    base.ctaPrimaryRoute   = form.ctaPrimaryRoute
    base.ctaSecondary      = form.ctaSecondary
    base.ctaSecondaryRoute = form.ctaSecondaryRoute
  }

  return base
}

// ─── Save / Delete ────────────────────────────────────────────────────────────
async function handleSave() {
  if (isNew.value) {
    const newSha = await create(
      `content/campaigns/${form.slug}.json`,
      buildPayload(),
      `Add campaign: ${form.name}`
    )
    if (newSha) {
      sha.value = newSha
      router.replace(`/admin/campaigns/${form.slug}`)
    }
  } else {
    const newSha = await save(
      `content/campaigns/${route.params.id}.json`,
      buildPayload(),
      sha.value,
      `Update campaign: ${form.name}`
    )
    if (newSha) sha.value = newSha
  }
}

async function handleDelete() {
  if (!confirmingDelete.value) { confirmingDelete.value = true; return }
  deleting.value = true
  deleteError.value = null
  try {
    const ok = await destroy(
      `content/campaigns/${route.params.id}.json`,
      sha.value,
      `Delete campaign: ${form.name}`
    )
    if (ok) router.push('/admin/campaigns')
    else deleteError.value = 'Delete failed — try again.'
  } catch (e: any) {
    deleteError.value = e.message
  } finally {
    deleting.value = false
    confirmingDelete.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin" class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Campaigns /</span>
          <span class="font-display text-sm text-kteq-muted">{{ isNew ? 'New' : (form.name || route.params.id) }}</span>
        </div>
        <RouterLink to="/admin/campaigns" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Campaigns</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Page title + save button -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">
            {{ isNew ? 'New Campaign' : (form.name || 'Edit Campaign') }}
          </h1>
          <p v-if="isActive" class="mt-1 flex items-center gap-1.5 text-sm text-kteq-yellow">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-kteq-yellow"></span>
            This is the active campaign
          </p>
          <p v-else class="mt-1 text-sm text-kteq-muted">
            Set it as active from the <RouterLink to="/admin/campaigns" class="text-kteq-yellow/70 transition-colors hover:text-kteq-yellow">campaigns list</RouterLink>.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
          <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading || !form.slug || !form.name"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : (isNew ? 'Create Campaign' : 'Save Changes') }}
          </button>
        </div>
      </div>

      <!-- Loading / error states -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <form v-else @submit.prevent="handleSave" class="mt-8 space-y-6">

        <!-- ── Campaign Settings ──────────────────────────────────────────── -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Campaign Settings</h2>
          <div class="space-y-4">

            <!-- Name + Slug -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Campaign Name <span class="text-kteq-red">*</span></label>
                <input type="text" v-model="form.name" placeholder="e.g. (Re)Discover KTEQ" required
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                <p class="mt-1.5 text-xs text-kteq-muted">Shown in admin only. Not displayed on the public site.</p>
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Slug <span class="text-kteq-red">*</span></label>
                <input type="text" v-model="form.slug" :readonly="!isNew" placeholder="e.g. rediscover-2026" required
                  @input="slugManuallyEdited = true"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                  :class="!isNew ? 'cursor-not-allowed opacity-50' : ''" />
                <p class="mt-1.5 text-xs text-kteq-muted">{{ isNew ? 'Auto-generated from name. Used as the filename.' : 'Filename stem — cannot be changed after creation.' }}</p>
              </div>
            </div>

            <!-- Campaign date range -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                  Campaign Start <span class="font-normal text-kteq-muted">(optional)</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <input type="date" v-model="campaignStartDate"
                    class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <input type="time" v-model="campaignStartTime"
                    class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <p v-if="campaignPreviewStart" class="mt-1.5 text-xs text-kteq-muted">
                  <code class="rounded bg-kteq-void px-1 font-mono text-kteq-yellow">{{ campaignPreviewStart }}</code>
                </p>
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                  Campaign End <span class="font-normal text-kteq-muted">(optional)</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <input type="date" v-model="campaignEndDate"
                    class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <input type="time" v-model="campaignEndTime"
                    class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <p v-if="campaignPreviewEnd" class="mt-1.5 text-xs text-kteq-muted">
                  <code class="rounded bg-kteq-void px-1 font-mono text-kteq-yellow">{{ campaignPreviewEnd }}</code>
                </p>
              </div>
            </div>
            <p class="text-xs text-kteq-muted">Campaign dates are for your reference — displayed on the campaigns list but don't activate or deactivate the campaign automatically.</p>

            <!-- Use Phases toggle -->
            <div class="flex items-center justify-between rounded-md border border-kteq-gray/20 bg-kteq-void/50 px-4 py-3">
              <div>
                <p class="font-display text-sm font-medium text-kteq-light">Use Phases</p>
                <p class="text-xs text-kteq-muted">Divide this campaign into sequential messaging phases</p>
              </div>
              <button
                type="button"
                @click="usePhases ? disablePhases() : enablePhases()"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-2 focus:ring-offset-kteq-void"
                :class="usePhases ? 'bg-kteq-yellow' : 'bg-kteq-gray'"
                role="switch"
                :aria-checked="usePhases"
              >
                <span
                  class="pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow transition-transform"
                  :class="usePhases ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- ── Phase tabs (when usePhases is on) ──────────────────────── -->
            <template v-if="usePhases && form.phases.length > 0">
              <!-- Tab bar -->
              <div class="-mx-6 border-y border-kteq-gray/20 bg-kteq-void/50">
                <div class="flex items-center overflow-x-auto px-6">
                  <button
                    v-for="(phase, i) in form.phases"
                    :key="i"
                    type="button"
                    @click="activePhaseTab = i"
                    class="relative flex shrink-0 items-center gap-1.5 px-4 py-3 font-display text-xs transition-colors"
                    :class="activePhaseTab === i
                      ? '-mb-px border-b-2 border-kteq-yellow text-kteq-yellow'
                      : 'text-kteq-muted hover:text-kteq-light'"
                  >
                    {{ phase.name || `Phase ${i + 1}` }}
                    <span
                      v-if="form.phases.length > 1"
                      @click.stop="removePhase(i)"
                      class="ml-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-kteq-muted/60 transition-colors hover:bg-kteq-gray/50 hover:text-kteq-light"
                      title="Remove phase"
                    >×</span>
                  </button>
                  <button
                    type="button"
                    @click="addPhase"
                    class="flex shrink-0 items-center gap-1 px-4 py-3 font-display text-xs text-kteq-muted/60 transition-colors hover:text-kteq-yellow"
                    title="Add phase"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5">
                      <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
                    </svg>
                    Add phase
                  </button>
                </div>
              </div>

              <!-- Active phase content -->
              <div v-if="form.phases[activePhaseTab]" class="space-y-4 pt-1">

                <!-- Phase name -->
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Phase Name</label>
                  <input type="text" v-model="form.phases[activePhaseTab].name"
                    :placeholder="`e.g. Phase ${activePhaseTab + 1}`"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <p class="mt-1.5 text-xs text-kteq-muted">Used as the tab label in the admin. Not shown publicly.</p>
                </div>

                <!-- Hero Image (per-phase) -->
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                    Hero Image URL <span class="font-normal text-kteq-muted">(optional)</span>
                  </label>
                  <input type="url" v-model="form.phases[activePhaseTab].heroImage" placeholder="https://…"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <p class="mt-1.5 text-xs text-kteq-muted">Background image for this phase's hero. Leave empty to use the campaign default gradient.</p>
                </div>

                <!-- Headline + Subhead -->
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Headline <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <input type="text" v-model="form.phases[activePhaseTab].headline" placeholder="e.g. Still Here. Still Weird."
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  </div>
                  <div>
                    <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Subhead <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <input type="text" v-model="form.phases[activePhaseTab].subhead" placeholder="e.g. 55 years of alternative radio"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  </div>
                </div>

                <!-- Primary CTA -->
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Primary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                  <input type="text" v-model="form.phases[activePhaseTab].ctaPrimary" placeholder="e.g. Listen Now"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <!-- Action type -->
                  <div class="mt-2 flex gap-1.5">
                    <button
                      v-for="opt in ctaActionOptions"
                      :key="opt.value"
                      type="button"
                      @click="form.phases[activePhaseTab].ctaPrimaryAction = opt.value"
                      class="flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-display text-xs transition-colors"
                      :class="form.phases[activePhaseTab].ctaPrimaryAction === opt.value
                        ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                        : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                    >
                      <!-- Play icon -->
                      <svg v-if="opt.value === 'play'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                        <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53l-6.706 4.268A1.5 1.5 0 0 1 3 12.268V3.732Z" />
                      </svg>
                      <!-- Mail icon -->
                      <svg v-else-if="opt.value === 'mailto'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                        <path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v.736a.75.75 0 0 0 .421.671L8 9.044l7.579-3.887A.75.75 0 0 0 16 4.486V3.75A1.75 1.75 0 0 0 14.25 2H1.75ZM16 6.937l-6.99 3.585a1.75 1.75 0 0 1-1.02 0L1 6.937V12.25c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 12.25V6.937Z" />
                      </svg>
                      <!-- Link icon -->
                      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                        <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                        <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
                      </svg>
                      {{ opt.label }}
                    </button>
                  </div>
                  <!-- Route input (route action only) -->
                  <div v-if="form.phases[activePhaseTab].ctaPrimaryAction === 'route'" class="mt-2">
                    <input type="text" v-model="form.phases[activePhaseTab].ctaPrimaryRoute" placeholder="/listen"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                    <p class="mt-1 text-xs text-kteq-muted">Use a site path like <code class="font-mono text-kteq-yellow/80">/listen</code> or a full URL for external links.</p>
                  </div>
                </div>

                <!-- Secondary CTA -->
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Secondary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                  <input type="text" v-model="form.phases[activePhaseTab].ctaSecondary" placeholder="e.g. Our History"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <div v-if="form.phases[activePhaseTab].ctaSecondary" class="mt-2">
                    <input type="text" v-model="form.phases[activePhaseTab].ctaSecondaryRoute" placeholder="/history"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                    <p class="mt-1 text-xs text-kteq-muted">Site path or external URL for the secondary button.</p>
                  </div>
                </div>

                <!-- Phase end date (dated mode only) -->
                <div v-if="form.scheduleType === 'dated'">
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Phase Ends On</label>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <input type="date" v-model="form.phases[activePhaseTab].phaseEndDate"
                      class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                    <input type="time" v-model="form.phases[activePhaseTab].phaseEndTime"
                      class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  </div>
                  <p class="mt-1.5 text-xs text-kteq-muted">Mountain Time. The next phase begins immediately after this date/time passes.</p>
                </div>

              </div><!-- /active phase content -->

              <!-- Phase advancement (campaign-level, below the tabs) -->
              <div class="space-y-4 border-t border-kteq-gray/20 pt-4">
                <div>
                  <label class="mb-2 block font-display text-sm font-medium text-kteq-light">Phase Advancement</label>
                  <div class="flex gap-2">
                    <button
                      v-for="opt in scheduleTypeOptions"
                      :key="opt.value"
                      type="button"
                      @click="form.scheduleType = opt.value"
                      class="rounded-md border px-4 py-2 font-display text-xs transition-colors"
                      :class="form.scheduleType === opt.value
                        ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                        : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                    >{{ opt.label }}</button>
                  </div>
                  <p class="mt-1.5 text-xs text-kteq-muted">{{ scheduleTypeHint[form.scheduleType] }}</p>
                </div>

                <!-- Rotator settings -->
                <div v-if="form.scheduleType === 'rotator'" class="space-y-4">
                  <div>
                    <label class="mb-2 block font-display text-sm font-medium text-kteq-light">Rotation Mode</label>
                    <div class="flex gap-2">
                      <button
                        v-for="m in rotatorModeOptions"
                        :key="m.value"
                        type="button"
                        @click="form.rotatorMode = m.value"
                        class="rounded-md border px-4 py-2 font-display text-xs transition-colors"
                        :class="form.rotatorMode === m.value
                          ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                          : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                      >{{ m.label }}</button>
                    </div>
                  </div>
                  <div class="flex items-end gap-3">
                    <div>
                      <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Duration</label>
                      <input
                        type="number"
                        v-model.number="form.rotatorValue"
                        min="1"
                        class="w-24 rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Unit</label>
                      <select
                        v-model="form.rotatorUnit"
                        class="rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                      >
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                      </select>
                    </div>
                    <p class="pb-2 text-xs text-kteq-muted">
                      <template v-if="form.rotatorMode === 'each'">
                        Each phase shows for {{ form.rotatorValue }} {{ form.rotatorUnit }}.
                      </template>
                      <template v-else>
                        All {{ form.phases.length }} phase{{ form.phases.length !== 1 ? 's' : '' }} complete one full cycle every {{ form.rotatorValue }} {{ form.rotatorUnit }}.
                      </template>
                    </p>
                  </div>
                </div>

                <!-- FYI: phases reordered on save -->
                <div v-if="phaseReorderWarning" class="flex items-start gap-2.5 rounded-md border border-kteq-yellow/25 bg-kteq-yellow/5 px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="mt-0.5 h-4 w-4 shrink-0 text-kteq-yellow/70">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-sm text-kteq-yellow/90">Phases were reordered to match their end dates when saving.</p>
                </div>

                <!-- FYI: all phases expired -->
                <div v-if="allPhasesExpired" class="flex items-start gap-2.5 rounded-md border border-kteq-yellow/25 bg-kteq-yellow/5 px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="mt-0.5 h-4 w-4 shrink-0 text-kteq-yellow/70">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-sm text-kteq-yellow/90">All phase end dates are in the past — the last phase will continue showing until the campaign is changed. This is fine if this campaign has run its course.</p>
                </div>
              </div><!-- /phase advancement -->

            </template>

            <!-- ── Single-phase content (usePhases off) ───────────────────── -->
            <template v-else>

              <!-- Hero Image -->
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                  Hero Image URL <span class="font-normal text-kteq-muted">(optional)</span>
                </label>
                <input type="url" v-model="form.heroImage" placeholder="https://…"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                <p class="mt-1.5 text-xs text-kteq-muted">Background image for the homepage hero. Leave empty for the default gradient.</p>
              </div>

              <!-- Headline + Subhead -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Headline <span class="font-normal text-kteq-muted">(optional)</span></label>
                  <input type="text" v-model="form.headline" placeholder="e.g. Still Here. Still Weird."
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div>
                  <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Subhead <span class="font-normal text-kteq-muted">(optional)</span></label>
                  <input type="text" v-model="form.subhead" placeholder="e.g. 55 years of alternative radio"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
              </div>

              <!-- Primary CTA -->
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Primary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input type="text" v-model="form.ctaPrimary" placeholder="e.g. Listen Now"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                <!-- Action type -->
                <div class="mt-2 flex gap-1.5">
                  <button
                    v-for="opt in ctaActionOptions"
                    :key="opt.value"
                    type="button"
                    @click="form.ctaPrimaryAction = opt.value"
                    class="flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-display text-xs transition-colors"
                    :class="form.ctaPrimaryAction === opt.value
                      ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                      : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                  >
                    <svg v-if="opt.value === 'play'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                      <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53l-6.706 4.268A1.5 1.5 0 0 1 3 12.268V3.732Z" />
                    </svg>
                    <svg v-else-if="opt.value === 'mailto'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                      <path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v.736a.75.75 0 0 0 .421.671L8 9.044l7.579-3.887A.75.75 0 0 0 16 4.486V3.75A1.75 1.75 0 0 0 14.25 2H1.75ZM16 6.937l-6.99 3.585a1.75 1.75 0 0 1-1.02 0L1 6.937V12.25c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 12.25V6.937Z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
                    </svg>
                    {{ opt.label }}
                  </button>
                </div>
                <!-- Route input (route action only) -->
                <div v-if="form.ctaPrimaryAction === 'route'" class="mt-2">
                  <input type="text" v-model="form.ctaPrimaryRoute" placeholder="/listen"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <p class="mt-1 text-xs text-kteq-muted">Use a site path like <code class="font-mono text-kteq-yellow/80">/listen</code> or a full URL for external links.</p>
                </div>
              </div>

              <!-- Secondary CTA -->
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Secondary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input type="text" v-model="form.ctaSecondary" placeholder="e.g. Our History"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                <div v-if="form.ctaSecondary" class="mt-2">
                  <input type="text" v-model="form.ctaSecondaryRoute" placeholder="/history"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/40 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <p class="mt-1 text-xs text-kteq-muted">Site path or external URL for the secondary button.</p>
                </div>
              </div>

            </template>

          </div>
        </section>

        <!-- ── Countdown ──────────────────────────────────────────────────── -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">
            Countdown <span class="ml-2 text-sm font-normal text-kteq-muted">(optional)</span>
          </h2>
          <p class="mb-5 text-xs text-kteq-muted">Shows a number of days remaining on the homepage hero. Clear the date to hide it.</p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Target Date</label>
              <input type="date" v-model="countdownDate"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Target Time <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
              <input type="time" v-model="countdownTime"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
          </div>
          <p class="mb-5 mt-2 text-xs text-kteq-muted">
            Mountain Time (MDT/MST).
            <span v-if="previewIso">Stored as <code class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-kteq-yellow">{{ previewIso }}</code></span>
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Label Text</label>
              <input type="text" v-model="form.countdownLabel" placeholder="e.g. days until reopening"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Label Position</label>
              <div class="flex gap-3">
                <label
                  class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 font-display text-sm transition-colors"
                  :class="form.countdownLabelPosition === 'before'
                    ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                    : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                >
                  <input type="radio" v-model="form.countdownLabelPosition" value="before" class="sr-only" />
                  <span class="font-mono text-xs opacity-70">abc</span>
                  <span class="font-mono font-bold">42</span>
                </label>
                <label
                  class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 font-display text-sm transition-colors"
                  :class="form.countdownLabelPosition === 'after'
                    ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                    : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
                >
                  <input type="radio" v-model="form.countdownLabelPosition" value="after" class="sr-only" />
                  <span class="font-mono font-bold">42</span>
                  <span class="font-mono text-xs opacity-70">abc</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Countdown preview -->
          <div v-if="form.countdownLabel || countdownDate" class="mt-4 rounded-md border border-kteq-gray/20 bg-kteq-void px-4 py-3">
            <p class="mb-1.5 font-display text-xs text-kteq-muted">Preview</p>
            <div class="inline-flex items-baseline gap-2">
              <span v-if="form.countdownLabelPosition === 'before' && form.countdownLabel" class="text-sm text-kteq-muted">{{ form.countdownLabel }}</span>
              <span class="font-mono text-3xl font-bold text-kteq-yellow">42</span>
              <span v-if="form.countdownLabelPosition === 'after' && form.countdownLabel" class="text-sm text-kteq-muted">{{ form.countdownLabel }}</span>
            </div>
          </div>
        </section>

        <!-- ── Bottom: save + delete ──────────────────────────────────────── -->
        <div class="flex items-center justify-between gap-3 pb-8">
          <div v-if="!isNew" class="flex items-center gap-3">
            <button
              v-if="!confirmingDelete"
              type="button"
              :disabled="isActive"
              @click="confirmingDelete = true"
              :title="isActive ? 'Cannot delete the active campaign' : ''"
              class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red disabled:cursor-not-allowed disabled:opacity-40"
            >Delete campaign</button>
            <template v-else>
              <span class="text-xs text-kteq-muted">Delete "{{ form.name }}"?</span>
              <button type="button" @click="handleDelete" :disabled="deleting"
                class="font-display text-xs text-kteq-red transition-colors hover:text-red-400 disabled:opacity-50"
              >{{ deleting ? 'Deleting…' : 'Yes, delete' }}</button>
              <button type="button" @click="confirmingDelete = false"
                class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
              >Cancel</button>
            </template>
            <span v-if="deleteError" class="text-xs text-kteq-red">{{ deleteError }}</span>
            <span v-if="isActive" class="text-xs text-kteq-muted">Cannot delete the active campaign.</span>
          </div>
          <div v-else />

          <div class="flex items-center gap-3">
            <span v-if="error" class="text-xs text-kteq-red">{{ error }}</span>
            <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
            <button
              type="submit"
              :disabled="saving || loading || !form.slug || !form.name"
              class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ saving ? 'Saving…' : (isNew ? 'Create Campaign' : 'Save Changes') }}
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>
