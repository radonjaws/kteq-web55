<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useContentStore } from '@/stores/content'
import { useGitHub } from '@/composables/useGitHub'

const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

const { saving, error, lastSaved, save, getContent } = useGitHub()

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimelineEntry {
  id:          string
  year:        number | ''
  month?:      number | ''
  title:       string
  description: string
  image:       string
  mediaUrl:    string
  category:    string
  sources:     string
  articleSlug: string
}

const CATEGORIES = ['milestone', 'technical', 'music', 'people']

// ─── State ────────────────────────────────────────────────────────────────────
const loading    = ref(true)
const loadError  = ref<string | null>(null)
const sha        = ref('')
const entries    = ref<TimelineEntry[]>([])
const expandedId = ref<string | null>(null)
const originalId = ref<string>('')
const confirmDeleteId = ref<string | null>(null)

// ─── Edit form ────────────────────────────────────────────────────────────────
function blankEntry(): TimelineEntry {
  return {
    id: '', year: new Date().getFullYear(), month: '',
    title: '', description: '', image: '', mediaUrl: '',
    category: 'milestone', sources: '', articleSlug: '',
  }
}

const editForm = reactive<TimelineEntry>(blankEntry())
const isNew    = ref(false)

// ─── ID auto-generation ───────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function autoId() {
  if (editForm.year && editForm.title) {
    editForm.id = `${editForm.year}-${slugify(editForm.title)}`.slice(0, 48)
  }
}
function onYearOrTitleInput() {
  if (isNew.value) autoId()
}

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res    = await getContent('content/timeline.json')
    sha.value    = res.sha
    entries.value = (res.content.entries ?? []) as TimelineEntry[]
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

// Sorted for display (chronological)
const sortedEntries = computed(() =>
  [...entries.value].sort((a, b) => {
    if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year)
    return (Number(a.month) || 0) - (Number(b.month) || 0)
  })
)

// ─── Expand helpers ───────────────────────────────────────────────────────────
function openEdit(entry: TimelineEntry) {
  isNew.value      = false
  originalId.value = entry.id
  expandedId.value = entry.id
  Object.assign(editForm, JSON.parse(JSON.stringify(entry)))
  // Normalise optional fields
  if (!editForm.month) editForm.month = ''
  if (!editForm.articleSlug) editForm.articleSlug = ''
  confirmDeleteId.value = null
}

function openNew() {
  isNew.value      = true
  originalId.value = ''
  expandedId.value = '__new__'
  Object.assign(editForm, blankEntry())
  confirmDeleteId.value = null
}

function closeEdit() {
  expandedId.value  = null
  confirmDeleteId.value = null
}

// ─── Save ─────────────────────────────────────────────────────────────────────
const formValid = computed(() =>
  String(editForm.year).length === 4 && editForm.title.length > 0 && editForm.id.length > 0
)

function cleanedEntry() {
  const e = JSON.parse(JSON.stringify(editForm)) as TimelineEntry
  e.year  = Number(e.year)
  e.month = e.month === '' || e.month == null ? undefined : Number(e.month)
  if (!e.articleSlug) delete (e as any).articleSlug
  if (!e.image)       e.image    = ''
  if (!e.mediaUrl)    e.mediaUrl = ''
  if (!e.sources)     e.sources  = ''
  return e
}

async function handleSave() {
  const data    = cleanedEntry()
  const updated = isNew.value
    ? [...entries.value, data]
    : entries.value.map(e => e.id === originalId.value ? data : e)

  const newSha = await save(
    'content/timeline.json',
    { lastUpdated: new Date().toISOString(), entries: updated },
    sha.value,
    isNew.value ? `Add timeline entry: ${data.title} (${data.year})` : `Update timeline: ${data.title}`,
  )
  if (newSha) {
    sha.value     = newSha
    entries.value = updated
    expandedId.value = null
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function handleDelete(id: string) {
  const deleted  = entries.value.find(e => e.id === id)
  const updated  = entries.value.filter(e => e.id !== id)
  const newSha   = await save(
    'content/timeline.json',
    { lastUpdated: new Date().toISOString(), entries: updated },
    sha.value,
    `Remove timeline entry: ${deleted?.title ?? id}`,
  )
  if (newSha) {
    sha.value     = newSha
    entries.value = updated
    expandedId.value    = null
    confirmDeleteId.value = null
  }
}

// ─── Month name helper ────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function monthName(m: number | '' | undefined) {
  return m ? MONTHS[Number(m) - 1] : ''
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
          <span class="font-display text-sm text-kteq-muted">/ Timeline</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Timeline</h1>
          <p class="mt-1 text-sm text-kteq-muted">55th anniversary history entries. Add a few new years each week.</p>
        </div>
        <button
          v-if="!loading && !loadError"
          @click="openNew"
          class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Entry
        </button>
      </div>

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <template v-else>

        <!-- ── New entry form ─────────────────────────────────────────────── -->
        <div v-if="expandedId === '__new__'" class="mt-6 rounded-lg border border-kteq-yellow/30 bg-kteq-dark">
          <div class="flex items-center justify-between border-b border-kteq-gray/20 px-5 py-4">
            <h2 class="font-display text-base font-semibold text-kteq-yellow">New Entry</h2>
            <button @click="closeEdit" class="text-kteq-muted transition-colors hover:text-kteq-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
          </div>
          <div class="px-5 py-5">
            <!-- Year / Month / Category -->
            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Year <span class="text-kteq-red">*</span></label>
                <input type="number" v-model="editForm.year" min="1922" max="2099" @input="onYearOrTitleInput"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Month <span class="font-normal text-kteq-muted">(optional)</span></label>
                <select v-model="editForm.month"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50">
                  <option value="">— any —</option>
                  <option v-for="(name, i) in MONTHS" :key="i" :value="i + 1">{{ name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Category</label>
                <select v-model="editForm.category"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50">
                  <option v-for="cat in CATEGORIES" :key="cat" :value="cat" class="capitalize">{{ cat }}</option>
                </select>
              </div>
            </div>
            <!-- Title -->
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Title <span class="text-kteq-red">*</span></label>
              <input type="text" v-model="editForm.title" @input="onYearOrTitleInput" placeholder="Headline for this year"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <!-- ID -->
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Entry ID <span class="text-kteq-red">*</span> <span class="font-normal text-kteq-muted">(auto-generated, fixed after create)</span></label>
              <input type="text" v-model="editForm.id"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <!-- Description -->
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Short description <span class="font-normal text-kteq-muted">(shown on history page grid)</span></label>
              <textarea v-model="editForm.description" rows="3"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <!-- Article slug -->
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
                History article slug
                <span class="font-normal text-kteq-muted">(links this entry to a <code class="font-mono text-xs">content/history/</code> article; makes the card clickable)</span>
              </label>
              <input type="text" v-model="editForm.articleSlug" placeholder="e.g. 1971-first-broadcast"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <!-- Image / Media -->
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Image URL</label>
                <input type="url" v-model="editForm.image" placeholder="https://…"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Media URL <span class="font-normal text-kteq-muted">(audio/video embed)</span></label>
                <input type="url" v-model="editForm.mediaUrl" placeholder="https://…"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
            </div>
            <!-- Sources -->
            <div class="mt-4">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Sources</label>
              <input type="text" v-model="editForm.sources" placeholder="Citation, archive link, etc."
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
            </div>
            <div class="mt-6 flex items-center justify-end gap-3 border-t border-kteq-gray/20 pt-4">
              <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
              <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
              <button type="button" @click="closeEdit" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</button>
              <button type="button" @click="handleSave" :disabled="saving || !formValid"
                class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ saving ? 'Saving…' : 'Save Entry' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Entry list ─────────────────────────────────────────────────── -->
        <div class="mt-6 flex flex-col gap-2">

          <div v-if="entries.length === 0 && expandedId !== '__new__'"
            class="rounded-lg border border-kteq-gray/30 bg-kteq-dark px-5 py-10 text-center text-sm text-kteq-muted">
            No timeline entries yet.
          </div>

          <div
            v-for="entry in sortedEntries"
            :key="entry.id"
            class="rounded-lg border bg-kteq-dark transition-colors"
            :class="expandedId === entry.id ? 'border-kteq-yellow/30' : 'border-kteq-gray/30 hover:border-kteq-yellow/20'"
          >
            <!-- Collapsed row -->
            <button type="button"
              class="flex w-full items-center gap-4 px-5 py-4 text-left"
              @click="expandedId === entry.id ? closeEdit() : openEdit(entry)"
            >
              <!-- Year badge -->
              <span class="shrink-0 font-mono text-sm font-bold"
                :class="entry.articleSlug ? 'text-kteq-yellow' : 'text-kteq-muted'">
                {{ entry.year }}<span v-if="entry.month" class="font-normal text-kteq-muted"> {{ monthName(entry.month) }}</span>
              </span>
              <div class="min-w-0 flex-1">
                <span class="font-display text-sm font-semibold text-kteq-white">{{ entry.title }}</span>
                <div class="mt-0.5 flex items-center gap-2">
                  <span class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-[10px] text-kteq-muted capitalize">{{ entry.category }}</span>
                  <span v-if="entry.articleSlug" class="font-mono text-[10px] text-kteq-yellow">● article</span>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                class="h-4 w-4 shrink-0 text-kteq-muted transition-transform"
                :class="expandedId === entry.id ? 'rotate-180' : ''">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- Expanded form -->
            <div v-if="expandedId === entry.id" class="border-t border-kteq-gray/20 px-5 py-5">
              <!-- Year / Month / Category -->
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Year</label>
                  <input type="number" v-model="editForm.year" min="1922" max="2099"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Month <span class="font-normal text-kteq-muted">(optional)</span></label>
                  <select v-model="editForm.month"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50">
                    <option value="">— any —</option>
                    <option v-for="(name, i) in MONTHS" :key="i" :value="i + 1">{{ name }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Category</label>
                  <select v-model="editForm.category"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50">
                    <option v-for="cat in CATEGORIES" :key="cat" :value="cat" class="capitalize">{{ cat }}</option>
                  </select>
                </div>
              </div>
              <!-- Title -->
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Title</label>
                <input type="text" v-model="editForm.title"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <!-- ID (locked) -->
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Entry ID <span class="font-normal text-kteq-muted">(fixed at creation)</span></label>
                <div class="flex items-center gap-2 rounded-md border border-kteq-gray/30 bg-kteq-black px-3 py-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3 shrink-0 text-kteq-muted">
                    <path fill-rule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clip-rule="evenodd"/>
                  </svg>
                  <span class="font-mono text-sm text-kteq-muted">{{ editForm.id }}</span>
                </div>
              </div>
              <!-- Description -->
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Short description</label>
                <textarea v-model="editForm.description" rows="3"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>
              <!-- Article slug -->
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
                  History article slug
                  <span class="font-normal text-kteq-muted">— makes this card clickable once the article file exists</span>
                </label>
                <div class="flex items-center gap-2">
                  <input type="text" v-model="editForm.articleSlug" placeholder="e.g. 1971-first-broadcast"
                    class="min-w-0 flex-1 rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                  <RouterLink v-if="editForm.articleSlug" :to="`/history/${editForm.articleSlug}`" target="_blank"
                    class="shrink-0 rounded-md border border-kteq-gray/50 bg-kteq-void px-2 py-1.5 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow">
                    Preview ↗
                  </RouterLink>
                </div>
              </div>
              <!-- Image / Media -->
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Image URL</label>
                  <input type="url" v-model="editForm.image" placeholder="https://…"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
                <div>
                  <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Media URL</label>
                  <input type="url" v-model="editForm.mediaUrl" placeholder="https://…"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
                </div>
              </div>
              <!-- Sources -->
              <div class="mt-4">
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Sources</label>
                <input type="text" v-model="editForm.sources" placeholder="Citation, archive link, etc."
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
              </div>

              <!-- Action row -->
              <div class="mt-6 flex items-center justify-between gap-4 border-t border-kteq-gray/20 pt-4">
                <div class="flex items-center gap-3">
                  <button v-if="confirmDeleteId !== entry.id" type="button" @click="confirmDeleteId = entry.id"
                    class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red">
                    Delete entry
                  </button>
                  <template v-else>
                    <span class="font-display text-xs text-kteq-red">Delete "{{ entry.title }}"?</span>
                    <button type="button" @click="handleDelete(entry.id)" :disabled="saving"
                      class="rounded-md bg-kteq-red/10 px-3 py-1 font-display text-xs font-semibold text-kteq-red transition-colors hover:bg-kteq-red/20 disabled:opacity-50">
                      Confirm Delete
                    </button>
                    <button type="button" @click="confirmDeleteId = null" class="font-display text-xs text-kteq-muted hover:text-kteq-white">Cancel</button>
                  </template>
                </div>
                <div class="flex items-center gap-3">
                  <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
                  <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
                  <button type="button" @click="closeEdit" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</button>
                  <button type="button" @click="handleSave" :disabled="saving || !formValid"
                    class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                    <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {{ saving ? 'Saving…' : 'Save Entry' }}
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
