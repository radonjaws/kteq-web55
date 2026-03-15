<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'

const router = useRouter()
const { saving, error, save, getContent, listContent } = useGitHub()

interface CampaignMeta {
  filename: string          // slug — stem of the JSON filename
  name: string
  scheduleType: string      // 'manual' | 'dated' | 'rotator'
  phaseCount: number        // 0 = single-phase
  activePhaseIndex: number
  campaignStart: string
  campaignEnd: string
  countdownTarget: string
  rawContent: any           // full JSON for phase advancement saves
  rawSha: string
}

const loading = ref(true)
const loadError = ref<string | null>(null)

const settingsSha = ref('')
const settingsRaw = ref<any>(null)
const activeCampaignSlug = ref('')

const campaigns = ref<CampaignMeta[]>([])
const activatingSlug = ref<string | null>(null)
const advancingSlug = ref<string | null>(null)

onMounted(async () => {
  try {
    const [settingsResult, files] = await Promise.all([
      getContent('content/settings.json'),
      listContent('content/campaigns')
    ])
    settingsSha.value = settingsResult.sha
    settingsRaw.value = settingsResult.content
    activeCampaignSlug.value = settingsResult.content.activeCampaign || ''

    const results = await Promise.all(
      files
        .filter((f: any) => f.name.endsWith('.json'))
        .map(async (f: any) => {
          const { content, sha } = await getContent(f.path)
          const phases = Array.isArray(content.phases) ? content.phases : []
          return {
            filename:         f.name.replace('.json', ''),
            name:             content.name            || '',
            scheduleType:     content.scheduleType    || 'manual',
            phaseCount:       phases.length,
            activePhaseIndex: content.activePhaseIndex ?? 0,
            campaignStart:    content.campaignStart   || '',
            campaignEnd:      content.campaignEnd     || '',
            countdownTarget:  content.countdownTarget || '',
            rawContent:       content,
            rawSha:           sha
          } as CampaignMeta
        })
    )
    campaigns.value = results
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function phaseLabel(c: CampaignMeta): string {
  if (c.phaseCount === 0) return ''
  const mode = c.scheduleType === 'dated' ? 'Dated' : c.scheduleType === 'rotator' ? 'Rotator' : 'Manual'
  return `${c.phaseCount} phases · ${mode}`
}

function currentPhaseDisplay(c: CampaignMeta): string {
  if (c.phaseCount === 0 || c.scheduleType !== 'manual') return ''
  return `Phase ${c.activePhaseIndex + 1} of ${c.phaseCount}`
}

function canAdvancePhase(c: CampaignMeta): boolean {
  return c.phaseCount > 1
    && c.scheduleType === 'manual'
    && c.activePhaseIndex < c.phaseCount - 1
}

function canRewindPhase(c: CampaignMeta): boolean {
  return c.phaseCount > 1
    && c.scheduleType === 'manual'
    && c.activePhaseIndex > 0
}

async function setActive(slug: string) {
  if (activatingSlug.value) return
  activatingSlug.value = slug
  const newSha = await save(
    'content/settings.json',
    { ...settingsRaw.value, activeCampaign: slug },
    settingsSha.value,
    `Set active campaign: ${slug}`
  )
  if (newSha) {
    settingsSha.value = newSha
    settingsRaw.value = { ...settingsRaw.value, activeCampaign: slug }
    activeCampaignSlug.value = slug
  }
  activatingSlug.value = null
}

async function setPhase(c: CampaignMeta, newIndex: number) {
  if (advancingSlug.value) return
  advancingSlug.value = c.filename
  const updated = { ...c.rawContent, activePhaseIndex: newIndex }
  const newSha = await save(
    `content/campaigns/${c.filename}.json`,
    updated,
    c.rawSha,
    `Advance to phase ${newIndex + 1}: ${c.name}`
  )
  if (newSha) {
    c.activePhaseIndex = newIndex
    c.rawContent = updated
    c.rawSha = newSha
  }
  advancingSlug.value = null
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
          <span class="font-display text-sm text-kteq-muted">/ Campaigns</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Campaigns</h1>
          <p class="mt-1 text-sm text-kteq-muted">Manage campaign configurations. The active campaign drives the homepage hero and countdown.</p>
        </div>
        <button
          @click="router.push('/admin/campaigns/new')"
          class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Campaign
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="mt-4 rounded-lg border border-kteq-red/30 bg-kteq-dark px-4 py-3 text-sm text-kteq-red">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading campaigns…</div>

      <!-- Load error -->
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <!-- Empty state -->
      <div v-else-if="campaigns.length === 0" class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-12 text-center">
        <p class="text-kteq-muted">No campaigns yet.</p>
        <button @click="router.push('/admin/campaigns/new')" class="mt-4 font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright">Create the first one →</button>
      </div>

      <!-- Campaign list -->
      <div v-else class="mt-6 divide-y divide-kteq-gray/20 rounded-lg border border-kteq-gray/30 bg-kteq-dark">
        <div
          v-for="campaign in campaigns"
          :key="campaign.filename"
          class="px-5 py-4 transition-colors"
          :class="campaign.filename === activeCampaignSlug ? 'bg-kteq-yellow/5' : ''"
        >
          <div class="flex items-start gap-4">

            <!-- Info column -->
            <div class="min-w-0 flex-1">
              <!-- Name + active badge -->
              <div class="flex items-center gap-2">
                <p class="font-display text-sm font-semibold text-kteq-white">{{ campaign.name }}</p>
                <span
                  v-if="campaign.filename === activeCampaignSlug"
                  class="rounded-full bg-kteq-yellow/20 px-2 py-0.5 font-mono text-xs text-kteq-yellow"
                >active</span>
              </div>

              <!-- Meta row: date range + phase info -->
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <!-- Campaign date range -->
                <p v-if="formatDate(campaign.campaignStart) || formatDate(campaign.campaignEnd)" class="font-mono text-xs text-kteq-muted">
                  <span v-if="formatDate(campaign.campaignStart)">{{ formatDate(campaign.campaignStart) }}</span>
                  <span v-if="formatDate(campaign.campaignStart) && formatDate(campaign.campaignEnd)"> – </span>
                  <span v-if="formatDate(campaign.campaignEnd)">{{ formatDate(campaign.campaignEnd) }}</span>
                </p>

                <!-- Phase info -->
                <p v-if="phaseLabel(campaign)" class="font-mono text-xs text-kteq-muted">
                  {{ phaseLabel(campaign) }}
                </p>

                <!-- Countdown date -->
                <p v-if="formatDate(campaign.countdownTarget)" class="font-mono text-xs text-kteq-muted">
                  countdown {{ formatDate(campaign.countdownTarget) }}
                </p>
              </div>

              <!-- Manual phase advancement (shown only for active campaign with manual phases) -->
              <div
                v-if="campaign.filename === activeCampaignSlug && campaign.phaseCount > 1 && campaign.scheduleType === 'manual'"
                class="mt-3 flex items-center gap-2"
              >
                <span class="font-display text-xs text-kteq-muted">{{ currentPhaseDisplay(campaign) }}</span>
                <div class="flex items-center gap-1">
                  <!-- Previous phase -->
                  <button
                    type="button"
                    :disabled="!canRewindPhase(campaign) || !!advancingSlug"
                    @click="setPhase(campaign, campaign.activePhaseIndex - 1)"
                    class="flex h-6 w-6 items-center justify-center rounded border border-kteq-gray/50 font-mono text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow disabled:cursor-not-allowed disabled:opacity-30"
                    title="Previous phase"
                  >‹</button>
                  <!-- Phase dots -->
                  <div class="flex items-center gap-1 px-1">
                    <button
                      v-for="(_, i) in campaign.phaseCount"
                      :key="i"
                      type="button"
                      :disabled="!!advancingSlug"
                      @click="setPhase(campaign, i)"
                      class="h-2 w-2 rounded-full transition-colors disabled:cursor-not-allowed"
                      :class="i === campaign.activePhaseIndex
                        ? 'bg-kteq-yellow'
                        : 'bg-kteq-gray/50 hover:bg-kteq-muted'"
                      :title="`Go to phase ${i + 1}`"
                    />
                  </div>
                  <!-- Next phase -->
                  <button
                    type="button"
                    :disabled="!canAdvancePhase(campaign) || !!advancingSlug"
                    @click="setPhase(campaign, campaign.activePhaseIndex + 1)"
                    class="flex h-6 w-6 items-center justify-center rounded border border-kteq-gray/50 font-mono text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow disabled:cursor-not-allowed disabled:opacity-30"
                    title="Next phase"
                  >›</button>
                </div>
                <!-- Spinner while advancing -->
                <svg v-if="advancingSlug === campaign.filename" class="h-3 w-3 animate-spin text-kteq-yellow" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex shrink-0 items-center gap-2 pt-0.5">
              <!-- Set Active -->
              <button
                v-if="campaign.filename !== activeCampaignSlug"
                @click="setActive(campaign.filename)"
                :disabled="!!activatingSlug || saving"
                class="inline-flex items-center gap-1.5 rounded-md border border-kteq-gray/50 px-3 py-1.5 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg v-if="activatingSlug === campaign.filename" class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Set Active
              </button>

              <!-- Edit -->
              <RouterLink
                :to="`/admin/campaigns/${campaign.filename}`"
                class="inline-flex items-center rounded-md border border-kteq-gray/50 px-3 py-1.5 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow"
              >Edit →</RouterLink>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
