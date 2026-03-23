<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'
import { useContentStore } from '@/stores/content'

const route  = useRoute()
const router = useRouter()
const { saving, error, lastSaved, save, create, destroy, getContent } = useGitHub()
const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

const isNew     = computed(() => route.params.id === 'new')
const loading   = ref(true)
const loadError = ref<string | null>(null)
const sha       = ref('')
const confirmDelete = ref(false)

interface Person {
  name:    string
  role:    string
  bio:     string
  image:   string
  caption: string
}

interface Photo {
  url:     string
  caption: string
}

const form = reactive({
  slug:          '',
  year:          new Date().getFullYear() as number | '',
  title:         '',
  featuredImage: '',
  intro:         '',
  news:          '',
  people:        [] as Person[],
  music:         '',
  photos:        [] as Photo[],
  sources:       '',
  createdAt:     '',
  updatedAt:     '',
})

// Auto-slug from year on new entries only
function yearToSlug(y: number | ''): string {
  return y ? String(y) : ''
}
watch(() => form.year, (val) => {
  if (isNew.value) form.slug = yearToSlug(val)
})

onMounted(async () => {
  if (isNew.value) {
    form.createdAt = new Date().toISOString()
    loading.value = false
    return
  }
  try {
    const slug = route.params.id as string
    const { content, sha: fileSha } = await getContent(`content/history/${slug}.json`)
    sha.value = fileSha
    form.slug          = content.slug || slug
    form.year          = content.year
    form.title         = content.title || ''
    form.featuredImage = content.featuredImage || ''
    form.intro         = content.intro || content.body || ''  // legacy body fallback
    form.news          = content.news || ''
    form.people        = content.people ? content.people.map((p: Person) => ({ ...p })) : []
    form.music         = content.music || ''
    form.photos        = content.photos ? content.photos.map((p: Photo) => ({ ...p })) : []
    form.sources       = content.sources || ''
    form.createdAt     = content.createdAt || ''
    form.updatedAt     = content.updatedAt || ''
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

const formValid = computed(() =>
  form.slug.length > 0 &&
  String(form.year).length === 4 &&
  form.title.length > 0 &&
  form.intro.length > 0
)

// People helpers
function addPerson() {
  form.people.push({ name: '', role: '', bio: '', image: '', caption: '' })
}
function removePerson(i: number) {
  form.people.splice(i, 1)
}

// Photo helpers
function addPhoto() {
  form.photos.push({ url: '', caption: '' })
}
function removePhoto(i: number) {
  form.photos.splice(i, 1)
}

async function handleSave() {
  const data = {
    slug:          form.slug,
    year:          Number(form.year),
    title:         form.title,
    featuredImage: form.featuredImage,
    intro:         form.intro,
    news:          form.news,
    people:        toRaw(form.people).map(p => ({ ...p })),
    music:         form.music,
    photos:        toRaw(form.photos).map(p => ({ ...p })),
    sources:       form.sources,
    createdAt:     form.createdAt || new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  }

  let newSha: string | null = null
  if (isNew.value) {
    newSha = await create(
      `content/history/${form.slug}.json`,
      data,
      `Add yearbook entry: ${data.year} — ${data.title}`,
    )
  } else {
    newSha = await save(
      `content/history/${form.slug}.json`,
      data,
      sha.value,
      `Update yearbook entry: ${data.year} — ${data.title}`,
    )
  }

  if (newSha) {
    sha.value = newSha
    if (isNew.value) router.replace(`/admin/yearbook/${form.slug}`)
  }
}

async function handleDelete() {
  if (!sha.value) return
  const ok = await destroy(
    `content/history/${form.slug}.json`,
    sha.value,
    `Remove yearbook entry: ${form.year} — ${form.title}`,
  )
  if (ok) router.push('/admin/yearbook')
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
          <span class="font-display text-sm text-kteq-muted">/ Yearbook</span>
        </div>
        <RouterLink to="/admin/yearbook" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← All Entries</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title -->
      <h1 class="font-display text-2xl font-bold text-kteq-white">
        {{ isNew ? 'New Yearbook Entry' : `Edit: ${form.year}` }}
      </h1>

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <template v-else>
        <div class="mt-6 space-y-8">

          <!-- ── Metadata ──────────────────────────────────────────────────── -->
          <div class="space-y-5 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Entry Info</h2>

            <!-- Year + Slug -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Year <span class="text-kteq-red">*</span></label>
                <input
                  type="number" v-model="form.year"
                  min="1922" :max="new Date().getFullYear() + 1"
                  :disabled="!isNew"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
                  Slug <span class="font-normal text-kteq-muted">({{ isNew ? 'auto from year' : 'fixed at creation' }})</span>
                </label>
                <template v-if="isNew">
                  <input type="text" v-model="form.slug"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                  />
                </template>
                <template v-else>
                  <div class="flex items-center gap-2 rounded-md border border-kteq-gray/30 bg-kteq-black px-3 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3 shrink-0 text-kteq-muted">
                      <path fill-rule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clip-rule="evenodd"/>
                    </svg>
                    <span class="font-mono text-sm text-kteq-muted">{{ form.slug }}</span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Title <span class="text-kteq-red">*</span></label>
              <input type="text" v-model="form.title" placeholder="e.g. The Year it all Began"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
              />
            </div>

            <!-- Featured image -->
            <div>
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
                Featured Image URL
                <span class="ml-1 font-normal text-kteq-muted">— leave empty to use the yearbook default</span>
              </label>
              <input type="url" v-model="form.featuredImage" placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
              />
            </div>
          </div>

          <!-- ── Intro ──────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <label class="mb-3 block font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
              Intro <span class="text-kteq-red normal-case font-normal">*</span>
              <span class="ml-2 font-normal normal-case text-kteq-muted/60">(Markdown)</span>
            </label>
            <textarea
              v-model="form.intro"
              rows="8"
              placeholder="Opening paragraph(s) for this year's entry — required."
              class="w-full resize-y rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
            />
          </div>

          <!-- ── News ───────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <label class="mb-1 block font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
              News
              <span class="ml-2 font-normal normal-case text-kteq-muted/60">(Markdown — optional, hidden if empty)</span>
            </label>
            <p class="mb-3 text-xs text-kteq-muted">Brief list of things that were happening around the world for context.</p>
            <textarea
              v-model="form.news"
              rows="6"
              placeholder="- Item one&#10;- Item two&#10;&#10;Or a short paragraph..."
              class="w-full resize-y rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
            />
          </div>

          <!-- ── People ─────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <div class="flex items-center justify-between gap-4 mb-1">
              <label class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
                People
                <span class="ml-2 font-normal normal-case text-kteq-muted/60">(optional, hidden if empty)</span>
              </label>
              <button
                type="button"
                @click="addPerson"
                class="inline-flex items-center gap-1.5 rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
                Add Entry
              </button>
            </div>
            <p class="mb-4 text-xs text-kteq-muted">People behind the station — their jobs, photos, and stories.</p>

            <p v-if="form.people.length === 0" class="rounded-md border border-dashed border-kteq-gray/30 py-6 text-center text-sm text-kteq-muted">
              No people added yet.
            </p>

            <div v-else class="space-y-4">
              <div
                v-for="(person, i) in form.people"
                :key="i"
                class="rounded-md border border-kteq-gray/30 bg-kteq-void p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="font-display text-xs font-medium text-kteq-muted">Entry {{ i + 1 }}</span>
                  <button
                    type="button"
                    @click="removePerson(i)"
                    class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red"
                  >
                    Remove
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block font-display text-xs text-kteq-light">Name <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <input type="text" v-model="person.name" placeholder="Jane Doe"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block font-display text-xs text-kteq-light">Role / Title <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <input type="text" v-model="person.role" placeholder="Station Manager"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                    />
                  </div>
                </div>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block font-display text-xs text-kteq-light">Photo URL <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <input type="url" v-model="person.image" placeholder="https://…"
                      class="w-full rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block font-display text-xs text-kteq-light">Caption <span class="font-normal text-kteq-muted">(optional)</span></label>
                    <textarea v-model="person.bio" rows="2" placeholder="A brief description or caption for this photo…"
                      class="w-full resize-y rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Music ──────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <label class="mb-1 block font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
              Music
              <span class="ml-2 font-normal normal-case text-kteq-muted/60">(Markdown — optional, hidden if empty)</span>
            </label>
            <p class="mb-3 text-xs text-kteq-muted">What was spinning at the station — local concerts, CMJ chart-toppers, playlists.</p>
            <textarea
              v-model="form.music"
              rows="6"
              placeholder="- **Artist** — *Album* (year)&#10;- Local show: Artist at venue..."
              class="w-full resize-y rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
            />
          </div>

          <!-- ── Photos ─────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <div class="flex items-center justify-between gap-4 mb-1">
              <label class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
                Photos
                <span class="ml-2 font-normal normal-case text-kteq-muted/60">(optional, hidden if empty)</span>
              </label>
              <button
                type="button"
                @click="addPhoto"
                class="inline-flex items-center gap-1.5 rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1 font-display text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/50 hover:text-kteq-yellow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
                Add Photo
              </button>
            </div>
            <p class="mb-4 text-xs text-kteq-muted">Miscellaneous photo gallery with optional captions.</p>

            <p v-if="form.photos.length === 0" class="rounded-md border border-dashed border-kteq-gray/30 py-6 text-center text-sm text-kteq-muted">
              No photos added yet.
            </p>

            <div v-else class="space-y-3">
              <div
                v-for="(photo, i) in form.photos"
                :key="i"
                class="flex items-start gap-3 rounded-md border border-kteq-gray/30 bg-kteq-void p-3"
              >
                <!-- Thumbnail preview -->
                <div class="shrink-0">
                  <img v-if="photo.url" :src="photo.url" alt="" class="h-12 w-16 rounded object-cover" />
                  <div v-else class="flex h-12 w-16 items-center justify-center rounded border border-kteq-gray/30 bg-kteq-black">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 text-kteq-muted">
                      <path fill-rule="evenodd" d="M.75 2a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h14.5a.75.75 0 0 0 .75-.75V2.75A.75.75 0 0 0 15.25 2H.75ZM1.5 3.5h13v7.695l-1.97-1.97a.75.75 0 0 0-1.06 0l-2.44 2.44-2.47-2.47a.75.75 0 0 0-1.06 0L1.5 13.31V3.5Zm4.25 2.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                <!-- Inputs -->
                <div class="flex-1 min-w-0 space-y-2">
                  <input type="url" v-model="photo.url" placeholder="Image URL — https://…"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                  />
                  <input type="text" v-model="photo.caption" placeholder="Caption (optional)"
                    class="w-full rounded-md border border-kteq-gray/50 bg-kteq-black px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
                  />
                </div>
                <!-- Remove -->
                <button type="button" @click="removePhoto(i)" class="shrink-0 text-kteq-muted transition-colors hover:text-kteq-red mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- ── Sources ─────────────────────────────────────────────────────── -->
          <div class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
            <label class="mb-1 block font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
              Sources
              <span class="ml-2 font-normal normal-case text-kteq-muted/60">(optional)</span>
            </label>
            <input type="text" v-model="form.sources" placeholder="Citation, archive link, personal interview, etc."
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
            />
          </div>

          <!-- ── Action row ──────────────────────────────────────────────────── -->
          <div class="flex items-center justify-between gap-4 rounded-lg border border-kteq-gray/30 bg-kteq-dark px-6 py-4">
            <!-- Delete -->
            <div v-if="!isNew" class="flex items-center gap-3">
              <button v-if="!confirmDelete" type="button" @click="confirmDelete = true"
                class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red">
                Delete entry
              </button>
              <template v-else>
                <span class="font-display text-xs text-kteq-red">Delete "{{ form.year }}"?</span>
                <button type="button" @click="handleDelete" :disabled="saving"
                  class="rounded-md bg-kteq-red/10 px-3 py-1 font-display text-xs font-semibold text-kteq-red transition-colors hover:bg-kteq-red/20 disabled:opacity-50">
                  Confirm Delete
                </button>
                <button type="button" @click="confirmDelete = false" class="font-display text-xs text-kteq-muted hover:text-kteq-white">Cancel</button>
              </template>
            </div>
            <div v-else />

            <!-- Save -->
            <div class="flex items-center gap-3">
              <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
              <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
              <RouterLink to="/admin/yearbook" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</RouterLink>
              <button type="button" @click="handleSave" :disabled="saving || !formValid"
                class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving…' : (isNew ? 'Publish Entry' : 'Save Changes') }}
              </button>
            </div>
          </div>

          <!-- Preview link -->
          <div v-if="!isNew" class="text-right">
            <RouterLink :to="`/history/${form.slug}`"
              class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-yellow">
              View entry on site ↗
            </RouterLink>
          </div>

        </div>
      </template>
    </div>
  </div>
</template>
