<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'

const router = useRouter()
const { getContent, listContent } = useGitHub()

interface PostMeta {
  filename: string
  title: string
  status: string
  publishedAt: string
  author: string
}

const loading = ref(true)
const loadError = ref<string | null>(null)
const posts = ref<PostMeta[]>([])

onMounted(async () => {
  try {
    const files = await listContent('content/posts')
    const results = await Promise.all(
      files
        .filter(f => f.name.endsWith('.json'))
        .map(async (f) => {
          const { content } = await getContent(f.path)
          return {
            filename: f.name.replace('.json', ''),
            title: content.title,
            status: content.status,
            publishedAt: content.publishedAt,
            author: content.author
          } as PostMeta
        })
    )
    posts.value = results.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
          <span class="font-display text-sm text-kteq-muted">/ Posts</span>
        </div>
        <RouterLink
          to="/admin"
          class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
        >← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Posts</h1>
          <p class="mt-1 text-sm text-kteq-muted">Blog posts and news updates.</p>
        </div>
        <button
          @click="router.push('/admin/posts/new')"
          class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Post
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading posts…</div>

      <!-- Error -->
      <div
        v-else-if="loadError"
        class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red"
      >{{ loadError }}</div>

      <!-- Empty state -->
      <div
        v-else-if="posts.length === 0"
        class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-12 text-center"
      >
        <p class="text-kteq-muted">No posts yet.</p>
        <button
          @click="router.push('/admin/posts/new')"
          class="mt-4 font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright"
        >Write the first one →</button>
      </div>

      <!-- Post list -->
      <div v-else class="mt-6 divide-y divide-kteq-gray/20 rounded-lg border border-kteq-gray/30 bg-kteq-dark">
        <RouterLink
          v-for="post in posts"
          :key="post.filename"
          :to="`/admin/posts/${post.filename}`"
          class="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-kteq-void"
        >
          <div class="min-w-0">
            <p class="truncate font-display text-sm font-semibold text-kteq-white transition-colors group-hover:text-kteq-yellow">
              {{ post.title }}
            </p>
            <p class="mt-0.5 font-mono text-xs text-kteq-muted">
              {{ formatDate(post.publishedAt) }}
              <span v-if="post.author" class="ml-2">· {{ post.author }}</span>
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs"
            :class="post.status === 'published'
              ? 'bg-kteq-green/10 text-kteq-green'
              : 'bg-kteq-gray/30 text-kteq-muted'"
          >{{ post.status }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
