<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'
import { useContentStore } from '@/stores/content'

const router = useRouter()
const { getContent, listContent } = useGitHub()
const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

interface ArticleMeta {
  slug:     string
  year:     number
  title:    string
  updatedAt: string
}

const loading   = ref(true)
const loadError = ref<string | null>(null)
const articles  = ref<ArticleMeta[]>([])

onMounted(async () => {
  try {
    const files = await listContent('content/history')
    const results = await Promise.all(
      files
        .filter(f => f.name.endsWith('.json'))
        .map(async (f) => {
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
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">History Articles</h1>
          <p class="mt-1 text-sm text-kteq-muted">Year-in-review articles — shown on the homepage and history page.</p>
        </div>
        <button
          @click="router.push('/admin/history/new')"
          class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Article
        </button>
      </div>

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading articles…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <div v-else-if="articles.length === 0" class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-12 text-center">
        <p class="text-kteq-muted">No history articles yet.</p>
        <button @click="router.push('/admin/history/new')"
          class="mt-4 font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright">
          Write the first one →
        </button>
      </div>

      <div v-else class="mt-6 divide-y divide-kteq-gray/20 rounded-lg border border-kteq-gray/30 bg-kteq-dark">
        <RouterLink
          v-for="article in articles"
          :key="article.slug"
          :to="`/admin/history/${article.slug}`"
          class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-kteq-void"
        >
          <span class="shrink-0 font-mono text-sm font-bold text-kteq-yellow w-12">{{ article.year }}</span>
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
    </div>
  </div>
</template>
