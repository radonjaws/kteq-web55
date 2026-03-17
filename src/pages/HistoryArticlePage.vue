<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { useContentStore } from '@/stores/content'

const route  = useRoute()
const content = useContentStore()

const article = computed(() => content.historyBySlug[route.params.slug as string] ?? null)

const renderedBody = computed(() =>
  article.value?.body ? (marked.parse(article.value.body) as string) : ''
)
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Not found -->
    <div v-if="!article" class="mx-auto max-w-2xl px-4 py-24 text-center">
      <p class="font-mono text-xs text-kteq-muted">404</p>
      <h1 class="mt-2 font-display text-2xl font-bold text-kteq-white">Article not found</h1>
      <p class="mt-4 text-sm text-kteq-muted">This history article hasn't been written yet.</p>
      <RouterLink to="/history" class="mt-6 inline-block font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">
        ← Back to history
      </RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="border-b border-kteq-gray/30 bg-kteq-void px-4 py-12">
        <div class="mx-auto max-w-2xl">
          <RouterLink to="/history" class="font-display text-xs text-kteq-muted hover:text-kteq-yellow transition-colors">
            ← more 55th anniversary
          </RouterLink>
          <p class="mt-6 font-mono text-sm text-kteq-yellow">{{ article.year }}</p>
          <h1 class="mt-2 font-display text-3xl font-bold leading-tight text-kteq-white sm:text-4xl">
            {{ article.title }}
          </h1>
          <!-- Featured image -->
          <img
            v-if="article.featuredImage"
            :src="article.featuredImage"
            :alt="article.title"
            class="mt-8 w-full rounded-lg object-cover"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="mx-auto max-w-2xl px-4 py-12">
        <div
          v-if="renderedBody"
          class="prose prose-invert prose-yellow max-w-none
            prose-headings:font-display prose-headings:text-kteq-white
            prose-p:text-kteq-light prose-p:leading-relaxed
            prose-a:text-kteq-yellow prose-a:no-underline hover:prose-a:text-kteq-yellow-bright
            prose-strong:text-kteq-white
            prose-code:font-mono prose-code:text-kteq-yellow prose-code:text-sm
            prose-blockquote:border-kteq-yellow/50 prose-blockquote:text-kteq-muted
            prose-hr:border-kteq-gray/30"
          v-html="renderedBody"
        />
        <p v-else class="text-sm text-kteq-muted italic">Full article coming soon.</p>

        <!-- Sources -->
        <div v-if="article.sources" class="mt-12 border-t border-kteq-gray/30 pt-8">
          <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Sources</h2>
          <p class="mt-2 text-sm text-kteq-muted">{{ article.sources }}</p>
        </div>

        <!-- Back link -->
        <div class="mt-12 border-t border-kteq-gray/30 pt-8">
          <RouterLink to="/history" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">
            ← more 55th anniversary
          </RouterLink>
        </div>
      </div>
    </template>

  </div>
</template>
