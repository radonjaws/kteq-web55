<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useGitHub } from '@/composables/useGitHub'

const { saving, error, lastSaved, save, getContent } = useGitHub()

const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
// Full loaded settings — spread into save payload so other editors' fields are preserved
const rawContent = ref<any>(null)

// countdownTarget is stored as ISO 8601; we split it for editing
const countdownDate = ref('')
const countdownTime = ref('')
const countdownOffset = ref('-06:00') // Mountain Time (MDT = -06:00, MST = -07:00)

const form = reactive({
  campaignName: '',
  campaignHeroImage: '',
  campaignHeadline: '',
  campaignSubhead: '',
  campaignCtaPrimary: '',
  campaignCtaSecondary: '',
  countdownLabel: '',
  countdownLabelPosition: 'after' as 'before' | 'after'
})

// Split ISO timestamp into editable date/time parts, preserving the original offset
function parseCountdown(iso: string) {
  if (!iso) return
  countdownDate.value = iso.slice(0, 10)              // "2026-09-25"
  countdownTime.value = iso.slice(11, 16)             // "18:00"
  const offsetMatch = iso.match(/([+-]\d{2}:\d{2})$/)
  countdownOffset.value = offsetMatch ? offsetMatch[1] : '-06:00'
}

// Returns empty string when no date is set — downstream treats that as "no countdown"
function buildCountdownTarget(): string {
  if (!countdownDate.value) return ''
  const time = countdownTime.value || '00:00'
  return `${countdownDate.value}T${time}:00${countdownOffset.value}`
}

const previewIso = computed(() => buildCountdownTarget())

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
      campaignCtaSecondary: content.campaignCtaSecondary || '',
      countdownLabel: content.countdownLabel || '',
      countdownLabelPosition: content.countdownLabelPosition === 'before' ? 'before' : 'after'
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
    campaignName: form.campaignName,
    campaignHeroImage: form.campaignHeroImage,
    campaignHeadline: form.campaignHeadline,
    campaignSubhead: form.campaignSubhead,
    campaignCtaPrimary: form.campaignCtaPrimary,
    campaignCtaSecondary: form.campaignCtaSecondary,
    countdownTarget: buildCountdownTarget(),
    countdownLabel: form.countdownLabel,
    countdownLabelPosition: form.countdownLabelPosition
  }, sha.value, 'Update campaign settings')
  if (newSha) sha.value = newSha
}

// Phase defaults for placeholder hints — keeps override fields self-documenting
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
          <p class="mt-1 text-sm text-kteq-muted">Campaign identity, hero text overrides, and an optional countdown.</p>
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
            <p class="text-xs text-kteq-muted">Only button text is overrideable — route and action type follow the phase config.</p>

          </div>
        </section>

        <!-- Countdown (optional) -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">Countdown <span class="ml-2 font-normal text-kteq-muted text-sm">(optional)</span></h2>
          <p class="mb-5 text-xs text-kteq-muted">Shows a number of days remaining on the homepage hero. Clear the date to hide it.</p>

          <!-- Date + time -->
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
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Target Time <span class="font-normal text-kteq-muted">(optional)</span></label>
              <input
                type="time"
                v-model="countdownTime"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>
          </div>
          <p class="mt-2 mb-5 text-xs text-kteq-muted">
            Mountain Time (MDT/MST).
            <span v-if="previewIso">Stored as <code class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-kteq-yellow">{{ previewIso }}</code></span>
          </p>

          <!-- Label text + position -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Label Text</label>
              <input
                type="text"
                v-model="form.countdownLabel"
                placeholder="e.g. days until reopening"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
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

          <!-- Live preview -->
          <div v-if="form.countdownLabel || countdownDate" class="mt-4 rounded-md border border-kteq-gray/20 bg-kteq-void px-4 py-3">
            <p class="mb-1.5 font-display text-xs text-kteq-muted">Preview</p>
            <div class="inline-flex items-baseline gap-2">
              <span v-if="form.countdownLabelPosition === 'before' && form.countdownLabel" class="text-sm text-kteq-muted">{{ form.countdownLabel }}</span>
              <span class="font-mono text-3xl font-bold text-kteq-yellow">42</span>
              <span v-if="form.countdownLabelPosition === 'after' && form.countdownLabel" class="text-sm text-kteq-muted">{{ form.countdownLabel }}</span>
            </div>
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
