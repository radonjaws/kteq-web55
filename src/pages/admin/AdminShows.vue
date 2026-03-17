<script setup lang="ts">
import { ref, computed, onMounted, reactive, toRaw } from 'vue'
import { useContentStore } from '@/stores/content'
import { useGitHub } from '@/composables/useGitHub'

const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

const { saving, error, lastSaved, save, getContent } = useGitHub()

// ─── Types ────────────────────────────────────────────────────────────────────
interface Show {
  slug:         string
  name:         string
  tagline:      string
  description:  string
  djSlugs:      string[]
  image:        string
  genre:        string
  isActive:     boolean
  isAutomation: boolean
  socialLinks:  Record<string, string>
}

interface DJ {
  slug: string
  name: string
}

// ─── State ────────────────────────────────────────────────────────────────────
const loading    = ref(true)
const loadError  = ref<string | null>(null)
const sha        = ref('')
const shows      = ref<Show[]>([])
const allDjs     = ref<DJ[]>([])
const expandedId    = ref<string | null>(null)   // slug of open show, or '__new__'
const originalSlug  = ref<string>('')            // slug at the time edit was opened
const confirmDeleteSlug = ref<string | null>(null)

// ─── Edit form ────────────────────────────────────────────────────────────────
function blankShow(): Show {
  return {
    slug: '', name: '', tagline: '', description: '',
    djSlugs: [], image: '', genre: '',
    isActive: true, isAutomation: false, socialLinks: {},
  }
}

const editForm = reactive<Show>(blankShow())
const isNew    = ref(false)

const SOCIAL_KEYS = ['website', 'instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'spotify']
const customSocialKey   = ref('')
const customSocialValue = ref('')

// Extra keys already in the data that aren't in SOCIAL_KEYS
const extraSocialKeys = computed(() =>
  Object.keys(editForm.socialLinks).filter(k => !SOCIAL_KEYS.includes(k))
)

// ─── Slug auto-generation ─────────────────────────────────────────────────────
function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function onNameInput() {
  if (isNew.value) editForm.slug = slugify(editForm.name)
}

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [showsRes, djsRes] = await Promise.all([
      getContent('content/shows.json'),
      getContent('content/djs.json'),
    ])
    sha.value    = showsRes.sha
    shows.value  = showsRes.content.shows ?? []
    allDjs.value = (djsRes.content.djs ?? []) as DJ[]
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

// ─── Expand helpers ───────────────────────────────────────────────────────────
function openEdit(show: Show) {
  isNew.value = false
  originalSlug.value = show.slug
  expandedId.value = show.slug
  Object.assign(editForm, JSON.parse(JSON.stringify(show)))
  // Ensure all SOCIAL_KEYS are present in the form (as empty strings)
  for (const k of SOCIAL_KEYS) {
    if (!(k in editForm.socialLinks)) editForm.socialLinks[k] = ''
  }
  customSocialKey.value   = ''
  customSocialValue.value = ''
  confirmDeleteSlug.value = null
}

function openNew() {
  isNew.value = true
  originalSlug.value = ''
  expandedId.value = '__new__'
  const blank = blankShow()
  for (const k of SOCIAL_KEYS) blank.socialLinks[k] = ''
  Object.assign(editForm, blank)
  customSocialKey.value   = ''
  customSocialValue.value = ''
  confirmDeleteSlug.value = null
}

function closeEdit() {
  expandedId.value = null
  confirmDeleteSlug.value = null
}

// ─── DJ toggle ───────────────────────────────────────────────────────────────
function toggleDj(slug: string) {
  const idx = editForm.djSlugs.indexOf(slug)
  if (idx === -1) editForm.djSlugs.push(slug)
  else editForm.djSlugs.splice(idx, 1)
}

// ─── Social links ─────────────────────────────────────────────────────────────
function addCustomSocial() {
  const k = customSocialKey.value.trim()
  const v = customSocialValue.value.trim()
  if (k && v) {
    editForm.socialLinks[k] = v
    customSocialKey.value   = ''
    customSocialValue.value = ''
  }
}
function removeSocial(key: string) {
  delete editForm.socialLinks[key]
}

// ─── Save ─────────────────────────────────────────────────────────────────────
const formValid = computed(() => editForm.slug.length > 0 && editForm.name.length > 0)

// Strip empty social links before saving.
// toRaw() unwraps Vue's reactive proxy before serialising to avoid subtle
// proxy-induced stale-snapshot bugs when reactive objects are JSON-stringified.
function cleanedForm(): Show {
  const clean = JSON.parse(JSON.stringify(toRaw(editForm))) as Show
  for (const k of Object.keys(clean.socialLinks)) {
    if (!clean.socialLinks[k]) delete clean.socialLinks[k]
  }
  return clean
}

async function handleSave() {
  const data = cleanedForm()
  // Match on originalSlug so renaming the slug field doesn't orphan the entry.
  const updated = isNew.value
    ? [...shows.value, data]
    : shows.value.map(s => s.slug === originalSlug.value ? data : s)

  const newSha = await save(
    'content/shows.json',
    { lastUpdated: new Date().toISOString(), shows: updated },
    sha.value,
    isNew.value ? `Add show: ${data.name}` : `Update show: ${data.name}`,
  )
  if (newSha) {
    sha.value   = newSha
    shows.value = updated
    expandedId.value = null
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function handleDelete(slug: string) {
  const deletedName = shows.value.find(s => s.slug === slug)?.name ?? slug
  const updated = shows.value.filter(s => s.slug !== slug)
  const newSha = await save(
    'content/shows.json',
    { lastUpdated: new Date().toISOString(), shows: updated },
    sha.value,
    `Remove show: ${deletedName}`,
  )
  if (newSha) {
    sha.value   = newSha
    shows.value = updated
    expandedId.value     = null
    confirmDeleteSlug.value = null
  }
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <img v-if="adminLogoUrl" :src="adminLogoUrl" alt="KTEQ" class="h-8 w-auto object-contain" />
            <span v-else class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</span>
          </RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Shows</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title + add button -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Shows</h1>
          <p class="mt-1 text-sm text-kteq-muted">Manage show listings and descriptions.</p>
        </div>
        <button
          v-if="!loading && !loadError"
          @click="openNew"
          class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Show
        </button>
      </div>

      <!-- Loading / error -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <template v-else>

        <!-- ── New show form (top) ────────────────────────────────────────── -->
        <div v-if="expandedId === '__new__'" class="mt-6 rounded-lg border border-kteq-yellow/30 bg-kteq-dark">
          <div class="flex items-center justify-between border-b border-kteq-gray/20 px-5 py-4">
            <h2 class="font-display text-base font-semibold text-kteq-yellow">New Show</h2>
            <button @click="closeEdit" class="text-kteq-muted transition-colors hover:text-kteq-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <!-- ▼ Shared form body (new) -->
          <div class="px-5 py-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Show Name</label>
                <input type="text" v-model="editForm.name" @input="onNameInput"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Slug <span class="font-normal text-kteq-muted">(URL identifier)</span></label>
                <input type="text" v-model="editForm.slug"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Genre</label>
                <input type="text" v-model="editForm.genre" placeholder="e.g. Alternative / Freeform"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Image URL</label>
                <input type="url" v-model="editForm.image" placeholder="https://…"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
            </div>
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Tagline</label>
              <input type="text" v-model="editForm.tagline" placeholder="Short one-liner shown in listings"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Description</label>
              <textarea v-model="editForm.description" rows="3" placeholder="Full show description shown on the show detail page"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-6">
              <label class="flex cursor-pointer items-center gap-2">
                <button type="button" @click="editForm.isActive = !editForm.isActive" role="switch" :aria-checked="editForm.isActive"
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                  :class="editForm.isActive ? 'bg-kteq-green' : 'bg-kteq-gray'">
                  <span class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="editForm.isActive ? 'translate-x-4' : 'translate-x-0.5'" />
                </button>
                <span class="font-display text-xs text-kteq-muted">Active</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <button type="button" @click="editForm.isAutomation = !editForm.isAutomation" role="switch" :aria-checked="editForm.isAutomation"
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                  :class="editForm.isAutomation ? 'bg-kteq-yellow' : 'bg-kteq-gray'">
                  <span class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="editForm.isAutomation ? 'translate-x-4' : 'translate-x-0.5'" />
                </button>
                <span class="font-display text-xs text-kteq-muted">Automation</span>
              </label>
            </div>
            <div v-if="allDjs.length > 0" class="mt-5">
              <label class="mb-2 block font-display text-xs font-medium text-kteq-light">DJs</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="dj in allDjs" :key="dj.slug" type="button" @click="toggleDj(dj.slug)"
                  class="rounded-md border px-3 py-1 font-display text-xs transition-colors"
                  :class="editForm.djSlugs.includes(dj.slug)
                    ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                    : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'">
                  {{ dj.name }}
                </button>
              </div>
            </div>
            <div class="mt-5">
              <label class="mb-2 block font-display text-xs font-medium text-kteq-light">Social Links</label>
              <div class="grid gap-2 sm:grid-cols-2">
                <div v-for="key in SOCIAL_KEYS" :key="key" class="flex items-center gap-2">
                  <span class="w-20 shrink-0 font-display text-xs capitalize text-kteq-muted">{{ key }}</span>
                  <input type="url" v-model="editForm.socialLinks[key]" placeholder="https://…"
                    class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div v-for="key in extraSocialKeys" :key="key" class="flex items-center gap-2">
                  <span class="w-20 shrink-0 font-display text-xs text-kteq-muted">{{ key }}</span>
                  <input type="url" v-model="editForm.socialLinks[key]"
                    class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <button type="button" @click="removeSocial(key)" class="shrink-0 text-kteq-muted hover:text-kteq-red">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                  </button>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <input type="text" :value="customSocialKey" @input="customSocialKey = ($event.target as HTMLInputElement).value" placeholder="platform"
                  class="w-24 shrink-0 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none" />
                <input type="url" :value="customSocialValue" @input="customSocialValue = ($event.target as HTMLInputElement).value" placeholder="https://…"
                  class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none" />
                <button type="button" @click="addCustomSocial" :disabled="!customSocialKey.trim() || !customSocialValue.trim()"
                  class="shrink-0 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow disabled:cursor-not-allowed disabled:opacity-40">
                  Add
                </button>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-end gap-3 border-t border-kteq-gray/20 pt-4">
              <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
              <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
              <button type="button" @click="closeEdit" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</button>
              <button type="button" @click="handleSave" :disabled="saving || !formValid"
                class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving…' : 'Save Show' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Show list ─────────────────────────────────────────────────── -->
        <div class="mt-6 flex flex-col gap-2">

          <div v-if="shows.length === 0 && expandedId !== '__new__'"
            class="rounded-lg border border-kteq-gray/30 bg-kteq-dark px-5 py-10 text-center text-sm text-kteq-muted">
            No shows yet. Click <strong class="text-kteq-light">New Show</strong> to add one.
          </div>

          <div
            v-for="show in shows"
            :key="show.slug"
            class="rounded-lg border bg-kteq-dark transition-colors"
            :class="expandedId === show.slug ? 'border-kteq-yellow/30' : 'border-kteq-gray/30 hover:border-kteq-yellow/20'"
          >
            <!-- Collapsed row -->
            <button
              type="button"
              class="flex w-full items-center gap-4 px-5 py-4 text-left"
              @click="expandedId === show.slug ? closeEdit() : openEdit(show)"
            >
              <span class="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                :class="show.isActive ? 'bg-kteq-green' : 'bg-kteq-gray'"
                :title="show.isActive ? 'Active' : 'Inactive'" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-display text-sm font-semibold text-kteq-white">{{ show.name }}</span>
                  <span v-if="show.isAutomation" class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-[10px] text-kteq-muted">automation</span>
                </div>
                <p class="mt-0.5 truncate text-xs text-kteq-muted">
                  {{ show.genre || '—' }}<span v-if="show.tagline"> · {{ show.tagline }}</span>
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                class="h-4 w-4 shrink-0 text-kteq-muted transition-transform"
                :class="expandedId === show.slug ? 'rotate-180' : ''">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Expanded edit form -->
            <div v-if="expandedId === show.slug" class="border-t border-kteq-gray/20 px-5 py-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Show Name</label>
                  <input type="text" v-model="editForm.name" @input="onNameInput"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Slug <span class="font-normal text-kteq-muted">(fixed at creation)</span></label>
                  <div class="flex items-center gap-2 rounded-md border border-kteq-gray/30 bg-kteq-black px-3 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3 shrink-0 text-kteq-muted">
                      <path fill-rule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clip-rule="evenodd" />
                    </svg>
                    <span class="font-mono text-sm text-kteq-muted">{{ editForm.slug }}</span>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Genre</label>
                  <input type="text" v-model="editForm.genre" placeholder="e.g. Alternative / Freeform"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Image URL</label>
                  <input type="url" v-model="editForm.image" placeholder="https://…"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
              </div>
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Tagline</label>
                <input type="text" v-model="editForm.tagline" placeholder="Short one-liner shown in listings"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Description</label>
                <textarea v-model="editForm.description" rows="3" placeholder="Full show description"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div class="mt-4 flex flex-wrap items-center gap-6">
                <label class="flex cursor-pointer items-center gap-2">
                  <button type="button" @click="editForm.isActive = !editForm.isActive" role="switch" :aria-checked="editForm.isActive"
                    class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                    :class="editForm.isActive ? 'bg-kteq-green' : 'bg-kteq-gray'">
                    <span class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="editForm.isActive ? 'translate-x-4' : 'translate-x-0.5'" />
                  </button>
                  <span class="font-display text-xs text-kteq-muted">Active</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <button type="button" @click="editForm.isAutomation = !editForm.isAutomation" role="switch" :aria-checked="editForm.isAutomation"
                    class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                    :class="editForm.isAutomation ? 'bg-kteq-yellow' : 'bg-kteq-gray'">
                    <span class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="editForm.isAutomation ? 'translate-x-4' : 'translate-x-0.5'" />
                  </button>
                  <span class="font-display text-xs text-kteq-muted">Automation</span>
                </label>
              </div>

              <div v-if="allDjs.length > 0" class="mt-5">
                <label class="mb-2 block font-display text-xs font-medium text-kteq-light">DJs</label>
                <div class="flex flex-wrap gap-2">
                  <button v-for="dj in allDjs" :key="dj.slug" type="button" @click="toggleDj(dj.slug)"
                    class="rounded-md border px-3 py-1 font-display text-xs transition-colors"
                    :class="editForm.djSlugs.includes(dj.slug)
                      ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                      : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'">
                    {{ dj.name }}
                  </button>
                </div>
              </div>

              <div class="mt-5">
                <label class="mb-2 block font-display text-xs font-medium text-kteq-light">Social Links</label>
                <div class="grid gap-2 sm:grid-cols-2">
                  <div v-for="key in SOCIAL_KEYS" :key="key" class="flex items-center gap-2">
                    <span class="w-20 shrink-0 font-display text-xs capitalize text-kteq-muted">{{ key }}</span>
                    <input type="url" v-model="editForm.socialLinks[key]" placeholder="https://…"
                      class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  </div>
                  <div v-for="key in extraSocialKeys" :key="key" class="flex items-center gap-2">
                    <span class="w-20 shrink-0 font-display text-xs text-kteq-muted">{{ key }}</span>
                    <input type="url" v-model="editForm.socialLinks[key]"
                      class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                    <button type="button" @click="removeSocial(key)" class="shrink-0 text-kteq-muted hover:text-kteq-red">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    </button>
                  </div>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <input type="text" :value="customSocialKey" @input="customSocialKey = ($event.target as HTMLInputElement).value" placeholder="platform"
                    class="w-24 shrink-0 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none" />
                  <input type="url" :value="customSocialValue" @input="customSocialValue = ($event.target as HTMLInputElement).value" placeholder="https://…"
                    class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-body text-xs text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none" />
                  <button type="button" @click="addCustomSocial" :disabled="!customSocialKey.trim() || !customSocialValue.trim()"
                    class="shrink-0 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow disabled:cursor-not-allowed disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>

              <!-- Action row -->
              <div class="mt-6 flex items-center justify-between gap-4 border-t border-kteq-gray/20 pt-4">
                <div class="flex items-center gap-3">
                  <button v-if="confirmDeleteSlug !== show.slug" type="button" @click="confirmDeleteSlug = show.slug"
                    class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red">
                    Delete show
                  </button>
                  <template v-else>
                    <span class="font-display text-xs text-kteq-red">Delete "{{ show.name }}"?</span>
                    <button type="button" @click="handleDelete(show.slug)" :disabled="saving"
                      class="rounded-md bg-kteq-red/10 px-3 py-1 font-display text-xs font-semibold text-kteq-red transition-colors hover:bg-kteq-red/20 disabled:opacity-50">
                      Confirm Delete
                    </button>
                    <button type="button" @click="confirmDeleteSlug = null" class="font-display text-xs text-kteq-muted hover:text-kteq-white">Cancel</button>
                  </template>
                </div>
                <div class="flex items-center gap-3">
                  <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
                  <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
                  <button type="button" @click="closeEdit" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</button>
                  <button type="button" @click="handleSave" :disabled="saving || !formValid"
                    class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                    <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {{ saving ? 'Saving…' : 'Save Show' }}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </template>
    </div>
  </div>
</template>
