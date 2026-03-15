<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'

const router = useRouter()
const { saving, error, save, getContent, listContent } = useGitHub()

interface CampaignMeta {
  filename: string   // slug — stem of the JSON filename
  name: string
  phase: string
  countdownTarget: string
}

const loading = ref(true)
const loadError = ref<string | null>(null)

// Settings — needed to know which campaign is active and to update it
const settingsSha = ref('')
const settingsRaw = ref<any>(null)
const activeCampaignSlug = ref('')

const campaigns = ref<CampaignMeta[]>([])
const activatingSlug = ref<string | null>(null)

const phaseLabel: Record<string, string> = {
  rediscover: 'Rediscover',
  kteqlive: 'KTEQ Live',
  kteq100: 'KTEQ 100'
}

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
          const { content } = await getContent(f.path)
          return {
            filename: f.name.replace('.json', ''),
            name: content.name,
            phase: content.phase,
            countdownTarget: content.countdownTarget
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
  } catch {
    return ''
  }
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
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/admin"
            class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black"
          >K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Campaigns</span>
        </div>
        <RouterLink
          to="/admin"
          class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
        >← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Campaigns</h1>
          <p class="mt-1 text-sm text-kteq-muted">Manage campaign configurations. The active campaign drives site phase, hero, and countdown.</p>
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

      <!-- Save error (from Set Active) -->
      <div v-if="error" class="mt-4 rounded-lg border border-kteq-red/30 bg-kteq-dark px-4 py-3 text-sm text-kteq-red">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading campaigns…</div>

      <!-- Load error -->
      <div
        v-else-if="loadError"
        class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red"
      >{{ loadError }}</div>

      <!-- Empty state -->
      <div
        v-else-if="campaigns.length === 0"
        class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-12 text-center"
      >
        <p class="text-kteq-muted">No campaigns yet.</p>
        <button
          @click="router.push('/admin/campaigns/new')"
          class="mt-4 font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright"
        >Create the first one →</button>
      </div>

      <!-- Campaign list -->
      <div v-else class="mt-6 divide-y divide-kteq-gray/20 rounded-lg border border-kteq-gray/30 bg-kteq-dark">
        <div
          v-for="campaign in campaigns"
          :key="campaign.filename"
          class="flex items-center gap-4 px-5 py-4"
          :class="campaign.filename === activeCampaignSlug ? 'bg-kteq-yellow/5' : ''"
        >
          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="font-display text-sm font-semibold text-kteq-white">{{ campaign.name }}</p>
              <span
                v-if="campaign.filename === activeCampaignSlug"
                class="rounded-full bg-kteq-yellow/20 px-2 py-0.5 font-mono text-xs text-kteq-yellow"
              >active</span>
            </div>
            <p class="mt-0.5 font-mono text-xs text-kteq-muted">
              {{ phaseLabel[campaign.phase] || campaign.phase }}
              <span v-if="formatDate(campaign.countdownTarget)" class="ml-2">· countdown {{ formatDate(campaign.countdownTarget) }}</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex shrink-0 items-center gap-2">
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
</template>
