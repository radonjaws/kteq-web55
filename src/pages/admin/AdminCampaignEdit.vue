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

// Settings needed to check if this campaign is active (blocks delete)
const activeCampaignSlug = ref('')

// countdownTarget stored as ISO 8601; split for editing
const countdownDate = ref('')
const countdownTime = ref('')
const countdownOffset = ref('-06:00')

const form = reactive({
  slug: '',
  name: '',
  phase: 'rediscover',
  heroImage: '',
  headline: '',
  subhead: '',
  ctaPrimary: '',
  ctaSecondary: '',
  countdownLabel: '',
  countdownLabelPosition: 'after' as 'before' | 'after'
})

const slugManuallyEdited = ref(false)
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Auto-fill slug from name on new campaigns (unless user has edited it)
watch(() => form.name, (name) => {
  if (isNew.value && !slugManuallyEdited.value) {
    form.slug = slugify(name)
  }
})

function parseCountdown(iso: string) {
  if (!iso) return
  countdownDate.value = iso.slice(0, 10)
  countdownTime.value = iso.slice(11, 16)
  const m = iso.match(/([+-]\d{2}:\d{2})$/)
  countdownOffset.value = m ? m[1] : '-06:00'
}

function buildCountdownTarget(): string {
  if (!countdownDate.value) return ''
  const time = countdownTime.value || '00:00'
  return `${countdownDate.value}T${time}:00${countdownOffset.value}`
}

const previewIso = computed(() => buildCountdownTarget())

const isActive = computed(() => !isNew.value && form.slug === activeCampaignSlug.value)

onMounted(async () => {
  try {
    // Load settings to check active campaign (needed for delete guard)
    const settingsResult = await getContent('content/settings.json')
    activeCampaignSlug.value = settingsResult.content.activeCampaign || ''

    if (!isNew.value) {
      const { content, sha: fileSha } = await getContent(`content/campaigns/${route.params.id}.json`)
      sha.value = fileSha
      Object.assign(form, {
        slug: content.slug || route.params.id,
        name: content.name || '',
        phase: content.phase || 'rediscover',
        heroImage: content.heroImage || '',
        headline: content.headline || '',
        subhead: content.subhead || '',
        ctaPrimary: content.ctaPrimary || '',
        ctaSecondary: content.ctaSecondary || '',
        countdownLabel: content.countdownLabel || '',
        countdownLabelPosition: content.countdownLabelPosition === 'before' ? 'before' : 'after'
      })
      parseCountdown(content.countdownTarget)
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

function buildPayload() {
  return {
    slug: form.slug,
    name: form.name,
    phase: form.phase,
    heroImage: form.heroImage,
    headline: form.headline,
    subhead: form.subhead,
    ctaPrimary: form.ctaPrimary,
    ctaSecondary: form.ctaSecondary,
    countdownTarget: buildCountdownTarget(),
    countdownLabel: form.countdownLabel,
    countdownLabelPosition: form.countdownLabelPosition
  }
}

async function handleSave() {
  if (isNew.value) {
    const newSha = await create(
      `content/campaigns/${form.slug}.json`,
      buildPayload(),
      `Add campaign: ${form.name}`
    )
    if (newSha) {
      sha.value = newSha
      // Switch to edit mode
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
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    return
  }
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
          <RouterLink
            to="/admin"
            class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black"
          >K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Campaigns /</span>
          <span class="font-display text-sm text-kteq-muted">{{ isNew ? 'New' : form.name || route.params.id }}</span>
        </div>
        <RouterLink
          to="/admin/campaigns"
          class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
        >← Campaigns</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">
            {{ isNew ? 'New Campaign' : (form.name || 'Edit Campaign') }}
          </h1>
          <p v-if="isActive" class="mt-1 flex items-center gap-1.5 text-sm text-kteq-yellow">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-kteq-yellow"></span>
            This is the active campaign
          </p>
          <p v-else class="mt-1 text-sm text-kteq-muted">Campaign configuration. Set it as active from the campaigns list.</p>
        </div>

        <!-- Save button + status -->
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

        <!-- Campaign Settings -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Campaign Settings</h2>
          <div class="space-y-4">

            <!-- Name + Slug -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Campaign Name <span class="text-kteq-red">*</span></label>
                <input
                  type="text"
                  v-model="form.name"
                  placeholder="e.g. (Re)Discover KTEQ"
                  required
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
                <p class="mt-1.5 text-xs text-kteq-muted">Shown in admin only. Not displayed on the public site.</p>
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Slug <span class="text-kteq-red">*</span></label>
                <input
                  type="text"
                  v-model="form.slug"
                  :readonly="!isNew"
                  placeholder="e.g. rediscover-2026"
                  required
                  @input="slugManuallyEdited = true"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                  :class="!isNew ? 'opacity-50 cursor-not-allowed' : ''"
                />
                <p class="mt-1.5 text-xs text-kteq-muted">{{ isNew ? 'Auto-generated from name. Used as the filename.' : 'Filename stem — cannot be changed after creation.' }}</p>
              </div>
            </div>

            <!-- Hero Image -->
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Hero Image URL <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
              <input
                type="url"
                v-model="form.heroImage"
                placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Background image for the homepage hero. Leave empty for the default gradient.</p>
            </div>

            <!-- Headline + Subhead -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Headline <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input
                  type="text"
                  v-model="form.headline"
                  placeholder="Override headline"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Subhead <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input
                  type="text"
                  v-model="form.subhead"
                  placeholder="Override subhead"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>

            <!-- CTA text -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Primary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input
                  type="text"
                  v-model="form.ctaPrimary"
                  placeholder="Override primary button text"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Secondary CTA Text <span class="font-normal text-kteq-muted">(optional)</span></label>
                <input
                  type="text"
                  v-model="form.ctaSecondary"
                  placeholder="Override secondary button text"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>
            <p class="text-xs text-kteq-muted">Headline, subhead, and CTA text are all optional — leave any field empty to use the campaign defaults. Button routing and action type are set in code and are not configurable here.</p>

          </div>
        </section>

        <!-- Countdown (optional, last) -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">
            Countdown <span class="ml-2 font-normal text-kteq-muted text-sm">(optional)</span>
          </h2>
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
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Target Time <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
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

        <!-- Bottom save + delete -->
        <div class="flex items-center justify-between gap-3 pb-8">

          <!-- Delete (edit mode only) -->
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
              <button
                type="button"
                @click="handleDelete"
                :disabled="deleting"
                class="font-display text-xs text-kteq-red transition-colors hover:text-red-400 disabled:opacity-50"
              >{{ deleting ? 'Deleting…' : 'Yes, delete' }}</button>
              <button
                type="button"
                @click="confirmingDelete = false"
                class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
              >Cancel</button>
            </template>
            <span v-if="deleteError" class="text-xs text-kteq-red">{{ deleteError }}</span>
            <span v-if="isActive" class="text-xs text-kteq-muted">Cannot delete the active campaign.</span>
          </div>
          <div v-else />

          <!-- Save -->
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
