<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'
import { useContentStore } from '@/stores/content'

const router = useRouter()
const { saving, error, lastSaved, save, getContent, listContent } = useGitHub()
const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

interface ArticleMeta {
  slug:      string
  year:      number
  title:     string
  updatedAt: string
}

const loading   = ref(true)
const loadError = ref<string | null>(null)
const articles  = ref<ArticleMeta[]>([])

// Settings state
const sha         = ref('')
const rawSettings = ref<any>(null)

const form = reactive({
  yearbookDefaultImage: '',
  homepageHistory:      false,
})

onMounted(async () => {
  try {
    // Load settings.json for default image + homepage toggle
    const { content: s, sha: sSha } = await getContent('content/settings.json')
    sha.value         = sSha
    rawSettings.value = s
    form.yearbookDefaultImage = s.yearbookDefaultImage || ''
    form.homepageHistory      = s.homepageElements?.history ?? true

    // Load yearbook entries list
    const files = await listContent('content/history')
    const results = await Promise.all(
      (files as any[])
        .filter((f: any) => f.name.endsWith('.json'))
        .map(async (f: any) => {
          const { content } = await getContent(f.path)
          return {
            slug:      content.slug || f.name.replace('.json', ''),
            year:      content.year,
            title:     content.title,
            updatedAt: content.updatedAt,
          } as ArticleMeta
        })
    )
    articles.value = results.sort((a, b) => a.year - b.year)
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  const newSha = await save(
    'content/settings.json',
    {
      ...rawSettings.value,
      yearbookDefaultImage: form.yearbookDefaultImage,
      homepageElements: {
        ...rawSettings.value?.homepageElements,
        history: form.homepageHistory,
      },
    },
    sha.value,
    'Update yearbook settings',
  )
  if (newSha) sha.value = newSha
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
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title + new button -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Yearbook</h1>
          <p class="mt-1 text-sm text-kteq-muted">Year-in-review entries — shown on the homepage and history page.</p>
        </div>
        <button
          @click="router.push('/admin/yearbook/new')"
          class="inline-flex shrink-0 items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
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

        <!-- Yearbook settings panel -->
        <div class="mt-6 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5">
          <div class="flex items-center justify-between gap-4">
            <h2 class="font-display text-sm font-semibold text-kteq-white">Yearbook Settings</h2>
            <div class="flex items-center gap-3">
              <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
              <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
              <button
                @click="handleSave"
                :disabled="saving"
                class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-3 py-1.5 font-display text-xs font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg v-if="saving" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>

          <!-- Default image -->
          <div class="mt-4 flex items-center gap-4">
            <div class="shrink-0">
              <img
                v-if="form.yearbookDefaultImage"
                :src="form.yearbookDefaultImage"
                alt="Default image preview"
                class="h-14 w-24 rounded-md object-cover"
              />
              <div v-else class="flex h-14 w-24 items-center justify-center rounded-md border border-kteq-gray/30 bg-kteq-void">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-kteq-muted">
                  <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
                Default Featured Image URL
                <span class="ml-1 font-normal text-kteq-muted">— fallback for entries without their own image</span>
              </label>
              <input
                type="url"
                v-model="form.yearbookDefaultImage"
                placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
              />
            </div>
          </div>

          <!-- Homepage toggle -->
          <div class="mt-4 flex items-center gap-3 border-t border-kteq-gray/20 pt-4">
            <button
              type="button"
              @click="form.homepageHistory = !form.homepageHistory"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
              :class="form.homepageHistory ? 'bg-kteq-yellow' : 'bg-kteq-gray'"
              role="switch"
              :aria-checked="form.homepageHistory"
            >
              <span
                class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                :class="form.homepageHistory ? 'translate-x-4' : 'translate-x-0.5'"
              />
            </button>
            <span class="font-display text-xs text-kteq-muted">Show yearbook section on homepage</span>
          </div>
        </div>

        <!-- Entry list -->
        <div v-if="articles.length === 0" class="mt-6 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-12 text-center">
          <p class="text-kteq-muted">No yearbook entries yet.</p>
          <button
            @click="router.push('/admin/yearbook/new')"
            class="mt-4 font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright"
          >
            Write the first one →
          </button>
        </div>

        <div v-else class="mt-4 divide-y divide-kteq-gray/20 rounded-lg border border-kteq-gray/30 bg-kteq-dark">
          <RouterLink
            v-for="article in articles"
            :key="article.slug"
            :to="`/admin/yearbook/${article.slug}`"
            class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-kteq-void"
          >
            <span class="w-12 shrink-0 font-mono text-sm font-bold text-kteq-yellow">{{ article.year }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-display text-sm font-semibold text-kteq-white transition-colors group-hover:text-kteq-yellow">
                {{ article.title }}
              </p>
              <p v-if="article.updatedAt" class="mt-0.5 font-mono text-xs text-kteq-muted">
                Updated {{ new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              class="h-4 w-4 shrink-0 text-kteq-muted transition-colors group-hover:text-kteq-yellow">
              <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clip-rule="evenodd"/>
            </svg>
          </RouterLink>
        </div>

      </template>
    </div>
  </div>
</template>
