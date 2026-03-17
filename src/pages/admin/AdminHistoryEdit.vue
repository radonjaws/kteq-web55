<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
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
const bodyTab   = ref<'write' | 'preview'>('write')
const confirmDelete = ref(false)

const form = reactive({
  slug:         '',
  year:         new Date().getFullYear() as number | '',
  title:        '',
  body:         '',
  featuredImage:'',
  sources:      '',
  createdAt:    '',
  updatedAt:    '',
})

// Auto-slug from year on new articles only
function yearToSlug(y: number | ''): string {
  return y ? String(y) : ''
}
watch(() => form.year, (val) => {
  if (isNew.value) form.slug = yearToSlug(val)
})

const renderedPreview = computed(() =>
  form.body
    ? (marked(form.body) as string)
    : '<p style="color:var(--color-kteq-muted)">Nothing to preview yet.</p>'
)

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
    Object.assign(form, content)
    if (!form.slug) form.slug = slug
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

const formValid = computed(() =>
  form.slug.length > 0 &&
  String(form.year).length === 4 &&
  form.title.length > 0
)

async function handleSave() {
  const data = {
    slug:          form.slug,
    year:          Number(form.year),
    title:         form.title,
    body:          form.body,
    featuredImage: form.featuredImage,
    sources:       form.sources,
    createdAt:     form.createdAt || new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  }

  let newSha: string | null = null
  if (isNew.value) {
    newSha = await create(
      `content/history/${form.slug}.json`,
      data,
      `Add history article: ${data.year} — ${data.title}`,
    )
  } else {
    newSha = await save(
      `content/history/${form.slug}.json`,
      data,
      sha.value,
      `Update history article: ${data.year} — ${data.title}`,
    )
  }

  if (newSha) {
    sha.value = newSha
    if (isNew.value) router.replace(`/admin/history/${form.slug}`)
  }
}

async function handleDelete() {
  if (!sha.value) return
  const ok = await destroy(
    `content/history/${form.slug}.json`,
    sha.value,
    `Remove history article: ${form.year} — ${form.title}`,
  )
  if (ok) router.push('/admin/history')
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
          <span class="font-display text-sm text-kteq-muted">/ History Articles</span>
        </div>
        <RouterLink to="/admin/history" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← All Articles</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title -->
      <h1 class="font-display text-2xl font-bold text-kteq-white">
        {{ isNew ? 'New History Article' : `Edit: ${form.year}` }}
      </h1>

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <template v-else>
        <div class="mt-6 space-y-5 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">

          <!-- Year + Slug row -->
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
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
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
            <input type="text" v-model="form.title" placeholder="e.g. KTEQ Goes On Air"
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
          </div>

          <!-- Featured image -->
          <div>
            <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Featured Image URL</label>
            <input type="url" v-model="form.featuredImage" placeholder="https://…"
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
          </div>

          <!-- Body — write / preview tabs -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="font-display text-xs font-medium text-kteq-light">Body <span class="font-normal text-kteq-muted">(Markdown)</span></label>
              <div class="flex rounded-md border border-kteq-gray/50 bg-kteq-void text-xs font-display overflow-hidden">
                <button type="button" @click="bodyTab = 'write'"
                  class="px-3 py-1 transition-colors"
                  :class="bodyTab === 'write' ? 'bg-kteq-yellow text-kteq-black font-semibold' : 'text-kteq-muted hover:text-kteq-white'">
                  Write
                </button>
                <button type="button" @click="bodyTab = 'preview'"
                  class="px-3 py-1 transition-colors"
                  :class="bodyTab === 'preview' ? 'bg-kteq-yellow text-kteq-black font-semibold' : 'text-kteq-muted hover:text-kteq-white'">
                  Preview
                </button>
              </div>
            </div>
            <textarea v-if="bodyTab === 'write'"
              v-model="form.body" rows="18"
              placeholder="Write the year-in-review article in Markdown..."
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 resize-y"
            />
            <div v-else
              class="min-h-64 rounded-md border border-kteq-gray/50 bg-kteq-void px-4 py-3
                prose prose-invert prose-yellow max-w-none
                prose-headings:font-display prose-headings:text-kteq-white
                prose-p:text-kteq-light prose-p:leading-relaxed
                prose-a:text-kteq-yellow prose-a:no-underline
                prose-strong:text-kteq-white
                prose-code:font-mono prose-code:text-kteq-yellow prose-code:text-sm
                prose-blockquote:border-kteq-yellow/50 prose-blockquote:text-kteq-muted"
              v-html="renderedPreview"
            />
          </div>

          <!-- Sources -->
          <div>
            <label class="mb-1 block font-display text-xs font-medium text-kteq-light">Sources</label>
            <input type="text" v-model="form.sources" placeholder="Citation, archive link, etc."
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50" />
          </div>

          <!-- Action row -->
          <div class="flex items-center justify-between gap-4 border-t border-kteq-gray/20 pt-4">
            <!-- Delete -->
            <div v-if="!isNew" class="flex items-center gap-3">
              <button v-if="!confirmDelete" type="button" @click="confirmDelete = true"
                class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red">
                Delete article
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
              <RouterLink to="/admin/history" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Cancel</RouterLink>
              <button type="button" @click="handleSave" :disabled="saving || !formValid"
                class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50">
                <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving…' : (isNew ? 'Publish Article' : 'Save Changes') }}
              </button>
            </div>
          </div>

        </div>

        <!-- Preview link -->
        <div v-if="!isNew" class="mt-4 text-right">
          <RouterLink :to="`/history/${form.slug}`"
            class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-yellow">
            View article on site ↗
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>
