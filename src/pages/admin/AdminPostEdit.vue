<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { useGitHub } from '@/composables/useGitHub'
import { useContentStore } from '@/stores/content'

const route = useRoute()
const router = useRouter()
const { saving, error, lastSaved, save, create, destroy, getContent } = useGitHub()
const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

const isNew = computed(() => route.params.id === 'new')
const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
const bodyTab = ref<'write' | 'preview'>('write')

const form = reactive({
  title: '',
  slug: '',
  body: '',
  excerpt: '',
  featuredImage: '',
  author: 'KTEQ Staff',
  status: 'draft',
  tags: '',           // comma-separated in UI, split to array on save
  createdAt: '',
  _publishedDate: '',
  _publishedTime: '09:00'
})

// Auto-slug from title on new posts only
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(() => form.title, (val) => {
  if (isNew.value) form.slug = slugify(val)
})

function parseDate(iso: string) {
  const match = iso?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return match ? { date: match[1], time: match[2] } : { date: '', time: '09:00' }
}

function buildDate(date: string, time: string): string {
  if (!date) return new Date().toISOString()
  return `${date}T${time || '09:00'}:00-06:00`
}

const renderedPreview = computed(() =>
  form.body
    ? (marked(form.body) as string)
    : '<p style="color: var(--color-kteq-muted)">Nothing to preview yet.</p>'
)

onMounted(async () => {
  if (isNew.value) {
    form._publishedDate = new Date().toISOString().slice(0, 10)
    form.createdAt = new Date().toISOString()
    loading.value = false
    return
  }
  try {
    const filename = route.params.id as string
    const { content, sha: fileSha } = await getContent(`content/posts/${filename}.json`)
    sha.value = fileSha
    const { date, time } = parseDate(content.publishedAt)
    Object.assign(form, {
      ...content,
      tags: Array.isArray(content.tags) ? content.tags.join(', ') : (content.tags ?? ''),
      _publishedDate: date,
      _publishedTime: time
    })
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  const now = new Date().toISOString()
  const payload = {
    slug: form.slug,
    title: form.title,
    body: form.body,
    excerpt: form.excerpt,
    featuredImage: form.featuredImage,
    author: form.author,
    status: form.status,
    publishedAt: buildDate(form._publishedDate, form._publishedTime),
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    createdAt: form.createdAt || now,
    updatedAt: now
  }

  if (isNew.value) {
    const newSha = await create(
      `content/posts/${form.slug}.json`,
      payload,
      `Create post: ${payload.title}`
    )
    if (newSha) {
      sha.value = newSha
      // Switch to edit mode so subsequent saves work as PUT
      router.replace(`/admin/posts/${form.slug}`)
    }
  } else {
    const filename = route.params.id as string
    const newSha = await save(
      `content/posts/${filename}.json`,
      payload,
      sha.value,
      `Update post: ${payload.title}`
    )
    if (newSha) sha.value = newSha
  }
}

async function handleDelete() {
  if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return
  const filename = route.params.id as string
  const ok = await destroy(
    `content/posts/${filename}.json`,
    sha.value,
    `Delete post: ${form.title}`
  )
  if (ok) router.push('/admin/posts')
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink to="/admin">
            <img v-if="adminLogoUrl" :src="adminLogoUrl" alt="KTEQ" class="h-8 w-auto object-contain" />
            <span v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</span>
          </RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Posts /</span>
          <span class="truncate font-display text-sm text-kteq-muted">{{ isNew ? 'New Post' : (form.title || '…') }}</span>
        </div>
        <RouterLink
          to="/admin/posts"
          class="ml-4 shrink-0 font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
        >← Posts</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Top bar: heading + save -->
      <div class="flex items-start justify-between gap-4">
        <h1 class="font-display text-2xl font-bold text-kteq-white">
          {{ isNew ? 'New Post' : (form.title || 'Edit Post') }}
        </h1>
        <div class="flex shrink-0 items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">
            Saved {{ lastSaved.toLocaleTimeString() }}
          </span>
          <span v-if="error" class="max-w-[200px] truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading || !form.title || !form.slug"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- Loading / error -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <form v-else @submit.prevent="handleSave" class="mt-6 space-y-6">

        <!-- Title -->
        <div>
          <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Title</label>
          <input
            type="text"
            v-model="form.title"
            placeholder="Post title"
            class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2.5 font-display text-lg text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
          />
        </div>

        <!-- Slug -->
        <div>
          <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
            Slug
            <span v-if="!isNew" class="ml-2 font-normal text-xs text-kteq-muted">(readonly — changing would break the public URL)</span>
          </label>
          <input
            type="text"
            v-model="form.slug"
            :readonly="!isNew"
            placeholder="post-slug"
            class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
            :class="{ 'cursor-not-allowed opacity-60': !isNew }"
          />
        </div>

        <!-- Body editor -->
        <div class="overflow-hidden rounded-lg border border-kteq-gray/30">
          <!-- Tab bar -->
          <div class="flex items-center border-b border-kteq-gray/30 bg-kteq-dark px-1 pt-1">
            <button
              type="button"
              @click="bodyTab = 'write'"
              class="rounded-t px-4 py-2 font-display text-xs font-medium transition-colors"
              :class="bodyTab === 'write'
                ? 'bg-kteq-void text-kteq-white'
                : 'text-kteq-muted hover:text-kteq-light'"
            >Write</button>
            <button
              type="button"
              @click="bodyTab = 'preview'"
              class="rounded-t px-4 py-2 font-display text-xs font-medium transition-colors"
              :class="bodyTab === 'preview'
                ? 'bg-kteq-void text-kteq-white'
                : 'text-kteq-muted hover:text-kteq-light'"
            >Preview</button>
            <span class="ml-auto px-3 font-mono text-xs text-kteq-muted">Markdown</span>
          </div>

          <!-- Write tab -->
          <textarea
            v-if="bodyTab === 'write'"
            v-model="form.body"
            placeholder="Write your post in Markdown…"
            rows="24"
            class="w-full bg-kteq-void px-4 py-3 font-mono text-sm leading-relaxed text-kteq-light placeholder-kteq-muted/50 focus:outline-none resize-y"
          />

          <!-- Preview tab -->
          <div
            v-else
            class="min-h-96 bg-kteq-void px-6 py-4
              prose prose-invert max-w-none
              text-kteq-light
              [&_h1]:font-display [&_h1]:text-kteq-white
              [&_h2]:font-display [&_h2]:text-kteq-white
              [&_h3]:font-display [&_h3]:text-kteq-white
              [&_a]:text-kteq-yellow [&_a:hover]:text-kteq-yellow-bright
              [&_strong]:text-kteq-white
              [&_code]:font-mono [&_code]:text-kteq-yellow [&_code]:bg-kteq-dark [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
            v-html="renderedPreview"
          />
        </div>

        <!-- Post details -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Post Details</h2>
          <div class="space-y-4">

            <!-- Status + Author -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Status</label>
                <select
                  v-model="form.status"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Author</label>
                <input
                  type="text"
                  v-model="form.author"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>

            <!-- Publish date + time -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Publish Date</label>
                <input
                  type="date"
                  v-model="form._publishedDate"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Publish Time</label>
                <input
                  type="time"
                  v-model="form._publishedTime"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>
            <p class="-mt-2 text-xs text-kteq-muted">Mountain Time (CDT, −6:00).</p>

            <!-- Tags -->
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Tags</label>
              <input
                type="text"
                v-model="form.tags"
                placeholder="announcement, rediscover-kteq"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Comma-separated.</p>
            </div>

            <!-- Excerpt -->
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Excerpt</label>
              <textarea
                v-model="form.excerpt"
                rows="2"
                placeholder="Short summary shown in post listings."
                class="w-full resize-none rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <!-- Featured image -->
            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Featured Image URL <span class="font-normal text-xs text-kteq-muted">(optional)</span>
              </label>
              <input
                type="text"
                v-model="form.featuredImage"
                placeholder="/images/…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

          </div>
        </section>

        <!-- Bottom actions -->
        <div class="flex items-center justify-between pb-8">
          <button
            v-if="!isNew"
            type="button"
            @click="handleDelete"
            :disabled="saving"
            class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-red disabled:opacity-50"
          >Delete post</button>
          <div v-else />

          <div class="flex items-center gap-3">
            <span v-if="error" class="text-xs text-kteq-red">{{ error }}</span>
            <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
            <button
              type="submit"
              :disabled="saving || !form.title || !form.slug"
              class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>
