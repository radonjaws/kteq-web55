<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { useContentStore } from '@/stores/content'

const route   = useRoute()
const content = useContentStore()

const article = computed(() => content.historyBySlug[route.params.slug as string] ?? null)

// Use article's featured image, fall back to yearbook default from settings
const heroImage = computed(() =>
  article.value?.featuredImage
    || (content.settings as any).yearbookDefaultImage
    || ''
)

// Rendered markdown sections
const renderedIntro = computed(() =>
  article.value?.intro ? (marked.parse(article.value.intro) as string) : ''
)
const renderedNews = computed(() =>
  article.value?.news ? (marked.parse(article.value.news) as string) : ''
)
const renderedMusic = computed(() =>
  article.value?.music ? (marked.parse(article.value.music) as string) : ''
)

// Legacy fallback: render body if intro is absent
const renderedBody = computed(() =>
  article.value?.body ? (marked.parse(article.value.body) as string) : ''
)

const hasIntro   = computed(() => !!article.value?.intro)
const hasNews    = computed(() => !!article.value?.news)
const hasPeople  = computed(() => (article.value?.people?.length ?? 0) > 0)
const hasMusic   = computed(() => !!article.value?.music)
const hasPhotos  = computed(() => (article.value?.photos?.length ?? 0) > 0)
const hasSources = computed(() => !!article.value?.sources)
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Not found -->
    <div v-if="!article" class="mx-auto max-w-2xl px-4 py-24 text-center">
      <p class="font-mono text-xs text-kteq-muted">404</p>
      <h1 class="mt-2 font-display text-2xl font-bold text-kteq-white">Article not found</h1>
      <p class="mt-4 text-sm text-kteq-muted">This yearbook entry hasn't been written yet.</p>
      <RouterLink to="/history" class="mt-6 inline-block font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright">
        ← back to history
      </RouterLink>
    </div>

    <template v-else>

      <!-- Page header -->
      <div class="border-b border-kteq-gray/30 bg-kteq-void px-4 py-12">
        <div class="mx-auto max-w-2xl">
          <RouterLink to="/history" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-yellow">
            ← more 55th anniversary
          </RouterLink>
          <p class="mt-6 font-mono text-sm text-kteq-yellow">{{ article.year }}</p>
          <h1 class="mt-2 font-display text-3xl font-bold leading-tight text-kteq-white sm:text-4xl">
            {{ article.title }}
          </h1>
          <!-- Featured image -->
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="article.title"
            class="mt-8 w-full rounded-lg object-cover"
          />
        </div>
      </div>

      <!-- Article body -->
      <div class="mx-auto max-w-2xl px-4 py-12 space-y-10">

        <!-- Intro (structured) or legacy body fallback -->
        <div v-if="hasIntro"
          class="prose prose-invert prose-yellow max-w-none
            prose-headings:font-display prose-headings:text-kteq-white
            prose-p:text-kteq-light prose-p:leading-relaxed
            prose-a:text-kteq-yellow prose-a:no-underline hover:prose-a:text-kteq-yellow-bright
            prose-strong:text-kteq-white
            prose-code:font-mono prose-code:text-kteq-yellow prose-code:text-sm
            prose-blockquote:border-kteq-yellow/50 prose-blockquote:text-kteq-muted
            prose-ul:text-kteq-light prose-ol:text-kteq-light
            prose-hr:border-kteq-gray/30"
          v-html="renderedIntro"
        />
        <div v-else-if="renderedBody"
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
        <p v-else class="text-sm italic text-kteq-muted">Full entry coming soon.</p>

        <!-- News -->
        <section v-if="hasNews">
          <h2 class="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted border-b border-kteq-gray/30 pb-2">
            News
          </h2>
          <div
            class="prose prose-invert prose-yellow max-w-none
              prose-headings:font-display prose-headings:text-kteq-white
              prose-p:text-kteq-light prose-p:leading-relaxed
              prose-a:text-kteq-yellow prose-a:no-underline hover:prose-a:text-kteq-yellow-bright
              prose-strong:text-kteq-white
              prose-ul:text-kteq-light prose-ol:text-kteq-light
              prose-li:marker:text-kteq-yellow
              prose-hr:border-kteq-gray/30"
            v-html="renderedNews"
          />
        </section>

        <!-- People -->
        <section v-if="hasPeople">
          <h2 class="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted border-b border-kteq-gray/30 pb-2">
            People
          </h2>
          <div class="space-y-6">
            <div
              v-for="(person, i) in article.people"
              :key="i"
              class="flex gap-4"
            >
              <!-- Person photo -->
              <img
                v-if="person.image"
                :src="person.image"
                :alt="person.caption || person.name"
                class="h-20 w-20 shrink-0 rounded-md object-cover"
              />
              <!-- Info -->
              <div class="min-w-0">
                <p class="font-display text-sm font-semibold text-kteq-white">{{ person.name }}</p>
                <p v-if="person.role" class="font-display text-xs text-kteq-yellow">{{ person.role }}</p>
                <p v-if="person.bio" class="mt-1 text-sm leading-relaxed text-kteq-light">{{ person.bio }}</p>
                <p v-if="person.caption" class="mt-1 font-mono text-xs text-kteq-muted">{{ person.caption }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Music -->
        <section v-if="hasMusic">
          <h2 class="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted border-b border-kteq-gray/30 pb-2">
            Music
          </h2>
          <div
            class="prose prose-invert prose-yellow max-w-none
              prose-headings:font-display prose-headings:text-kteq-white
              prose-p:text-kteq-light prose-p:leading-relaxed
              prose-a:text-kteq-yellow prose-a:no-underline hover:prose-a:text-kteq-yellow-bright
              prose-strong:text-kteq-white
              prose-ul:text-kteq-light prose-ol:text-kteq-light
              prose-li:marker:text-kteq-yellow
              prose-hr:border-kteq-gray/30"
            v-html="renderedMusic"
          />
        </section>

        <!-- Photos -->
        <section v-if="hasPhotos">
          <h2 class="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted border-b border-kteq-gray/30 pb-2">
            Photos
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <figure
              v-for="(photo, i) in article.photos"
              :key="i"
              class="overflow-hidden rounded-lg border border-kteq-gray/30"
            >
              <img
                :src="photo.url"
                :alt="photo.caption || `Photo ${i + 1}`"
                class="w-full object-cover"
              />
              <figcaption v-if="photo.caption" class="px-3 py-2 font-mono text-xs text-kteq-muted">
                {{ photo.caption }}
              </figcaption>
            </figure>
          </div>
        </section>

        <!-- Sources -->
        <div v-if="hasSources" class="border-t border-kteq-gray/30 pt-8">
          <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Sources</h2>
          <p class="mt-2 text-sm text-kteq-muted">{{ article.sources }}</p>
        </div>

        <!-- Back link -->
        <div class="border-t border-kteq-gray/30 pt-8">
          <RouterLink to="/history" class="font-display text-sm text-kteq-yellow transition-colors hover:text-kteq-yellow-bright">
            ← more 55th anniversary
          </RouterLink>
        </div>

      </div>
    </template>

  </div>
</template>
