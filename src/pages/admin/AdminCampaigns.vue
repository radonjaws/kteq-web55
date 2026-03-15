<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useGitHub } from '@/composables/useGitHub'

const { saving, error, lastSaved, save, getContent } = useGitHub()

const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
// Full loaded settings — spread into save payload so other editors' fields are preserved
const rawContent = ref<any>(null)

// countdownTarget is stored as an ISO 8601 string; we split it into editable parts
const countdownDate = ref('2026-09-25')
const countdownTime = ref('18:00')
const countdownOffset = ref('-06:00') // Mountain Time (MDT = -06:00, MST = -07:00)

const form = reactive({
  campaignName: '',
  campaignHeroImage: '',
  campaignHeadline: '',
  campaignSubhead: '',
  campaignCtaPrimary: '',
  campaignCtaSecondary: ''
})

// Split ISO timestamp into editable date/time parts, preserving the original offset
function parseCountdown(iso: string) {
  if (!iso) return
  countdownDate.value = iso.slice(0, 10)             // "2026-09-25"
  countdownTime.value = iso.slice(11, 16)            // "18:00"
  const offsetMatch = iso.match(/([+-]\d{2}:\d{2})$/)
  countdownOffset.value = offsetMatch ? offsetMatch[1] : '-06:00'
}

function buildCountdownTarget(): string {
  return `${countdownDate.value}T${countdownTime.value}:00${countdownOffset.value}`
}

onMounted(async () => {
  try {
    const { content, sha: fileSha } = await getContent('content/settings.json')
    sha.value = fileSha
    rawContent.value = content
    parseCountdown(content.countdownTarget)
    Object.assign(form, {
      campaignName: content.campaignName || '',
      campaignHeroImage: content.campaignHeroImage || '',
      campaignHeadline: content.campaignHeadline || '',
      campaignSubhead: content.campaignSubhead || '',
      campaignCtaPrimary: content.campaignCtaPrimary || '',
      campaignCtaSecondary: content.campaignCtaSecondary || ''
    })
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  const newSha = await save('content/settings.json', {
    // Preserve all fields owned by other editors (Settings, Menu, etc.)
    ...rawContent.value,
    // Override with this editor's fields
    countdownTarget: buildCountdownTarget(),
    campaignName: form.campaignName,
    campaignHeroImage: form.campaignHeroImage,
    campaignHeadline: form.campaignHeadline,
    campaignSubhead: form.campaignSubhead,
    campaignCtaPrimary: form.campaignCtaPrimary,
    campaignCtaSecondary: form.campaignCtaSecondary
  }, sha.value, 'Update campaign settings')
  if (newSha) sha.value = newSha
}

// Phase defaults for placeholder hints — keeps the form self-documenting
const phaseDefaults = computed(() => {
  const phase = rawContent.value?.campaignPhase || 'rediscover'
  const map: Record<string, { headline: string; subhead: string; ctaPrimary: string; ctaSecondary: string }> = {
    rediscover: {
      headline: 'Still Here. Still Weird.',
      subhead: '55 years of alternative radio in the Black Hills',
      ctaPrimary: 'Share Your Memories',
      ctaSecondary: 'Listen Now'
    },
    kteqlive: {
      headline: 'Welcome Back!',
      subhead: 'Live from the Black Hills — KTEQ returns to the studio',
      ctaPrimary: 'Listen Live',
      ctaSecondary: 'Our History'
    },
    kteq100: {
      headline: 'Black Hills Alternative Radio',
      subhead: 'KTEQ-FM 91.3 — Rapid City, South Dakota',
      ctaPrimary: 'Explore Our History',
      ctaSecondary: 'Listen Now'
    }
  }
  return map[phase] || map.rediscover
})
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
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Campaigns</h1>
          <p class="mt-1 text-sm text-kteq-muted">Countdown target, campaign identity, and hero text overrides.</p>
        </div>

        <!-- Save button + status -->
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">
            Saved {{ lastSaved.toLocaleTimeString() }}
          </span>
          <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Loading / error states -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <form v-else @submit.prevent="handleSave" class="mt-8 space-y-6">

        <!-- Countdown Timer -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">Countdown Timer</h2>
          <p class="mb-5 text-xs text-kteq-muted">
            Displayed automatically when days &gt; 0 in the
            <span class="text-kteq-light">Rediscover</span> and <span class="text-kteq-light">KTEQ Live</span> phases.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Target Date</label>
              <input
                type="date"
                v-model="countdownDate"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Target Time</label>
              <input
                type="time"
                v-model="countdownTime"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>
          </div>
          <p class="mt-3 text-xs text-kteq-muted">
            Mountain Time (MDT/MST). Stored as
            <code class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-kteq-yellow">{{ buildCountdownTarget() }}</code>
          </p>
        </section>

        <!-- Campaign Identity -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Campaign Identity</h2>
          <div class="space-y-4">

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Campaign Name</label>
              <input
                type="text"
                v-model="form.campaignName"
                placeholder="e.g. (Re)Discover KTEQ"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Internal label — shown in admin and documentation, not displayed on the public site.</p>
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Hero Image URL <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
              <input
                type="url"
                v-model="form.campaignHeroImage"
                placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Reserved for a campaign-specific hero image. Leave empty to use the default gradient background.</p>
            </div>

          </div>
        </section>

        <!-- Hero Text Overrides -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">Hero Text Overrides</h2>
          <p class="mb-5 text-xs text-kteq-muted">
            Leave any field empty to use the phase default.
            Current phase: <code class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-kteq-yellow">{{ rawContent?.campaignPhase }}</code>
          </p>
          <div class="space-y-4">

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Headline</label>
              <input
                type="text"
                v-model="form.campaignHeadline"
                :placeholder="`Phase default: ${phaseDefaults.headline}`"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Subhead</label>
              <input
                type="text"
                v-model="form.campaignSubhead"
                :placeholder="`Phase default: ${phaseDefaults.subhead}`"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Primary CTA Text</label>
                <input
                  type="text"
                  v-model="form.campaignCtaPrimary"
                  :placeholder="`Phase default: ${phaseDefaults.ctaPrimary}`"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Secondary CTA Text</label>
                <input
                  type="text"
                  v-model="form.campaignCtaSecondary"
                  :placeholder="`Phase default: ${phaseDefaults.ctaSecondary}`"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>
            <p class="text-xs text-kteq-muted">Only button text is overrideable — route and action type (play, mailto, link) follow the phase config.</p>

          </div>
        </section>

        <!-- Bottom save -->
        <div class="flex items-center justify-end gap-3 pb-8">
          <span v-if="error" class="text-xs text-kteq-red">{{ error }}</span>
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
          <button
            type="submit"
            :disabled="saving || loading"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
