<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const content = useContentStore()

const baseUrl = import.meta.env.BASE_URL   // '/' in dev, '/kteq-web55/' in prod
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Page header -->
    <div class="border-b border-kteq-gray/30 bg-kteq-void px-4 py-12">
      <div class="mx-auto max-w-6xl">
        <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">(Re)Discover KTEQ</h1>
        <p class="mt-2 text-sm text-kteq-muted">55 years of freeform radio in the Black Hills.</p>
      </div>
    </div>

    <!-- ── Horizontal timeline (image placeholder) ───────────────────────── -->
    <section class="border-b border-kteq-gray/30 bg-kteq-black">
      <div class="overflow-x-auto">
        <!--
          Upload public/img/key-dates.png to make this visible.
          The onerror handler shows the fallback div when the image 404s.
        -->
        <img
          :src="`${baseUrl}img/key-dates.png`"
          alt="Key dates in KTEQ broadcast history"
          class="block h-auto w-auto max-w-none"
          style="min-width: 1200px;"
          @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden')"
        />
        <!-- Fallback until image is uploaded -->
        <div class="hidden items-center justify-center bg-kteq-void px-8 py-24 text-center">
          <div>
            <p class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Coming soon</p>
            <p class="mt-2 font-display text-lg font-bold text-kteq-white">Interactive timeline</p>
            <p class="mt-1 text-sm text-kteq-muted">A horizontal visual journey through our broadcast history.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Year-in-review grid ───────────────────────────────────────────── -->
    <section class="bg-kteq-black px-4 py-16">
      <div class="mx-auto max-w-6xl">
        <h2 class="mb-10 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">55 Years On Air</h2>

        <div v-if="content.historyArticles.length" class="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <RouterLink
            v-for="article in content.historyArticles"
            :key="article.slug"
            :to="`/history/${article.slug}`"
            class="group flex aspect-square flex-col justify-end rounded-lg border border-kteq-gray/30 bg-kteq-dark p-4 transition-colors hover:border-kteq-yellow/30"
          >
            <span class="font-mono text-2xl font-bold text-kteq-yellow transition-colors group-hover:text-kteq-yellow-bright leading-none">{{ article.year }}</span>
            <h3 class="mt-2 font-display text-xs font-semibold leading-snug text-kteq-white transition-colors group-hover:text-kteq-yellow line-clamp-2">
              {{ article.title }}
            </h3>
          </RouterLink>
        </div>

        <p v-else class="text-sm text-kteq-muted">No history articles yet. Add the first one in the admin panel.</p>
      </div>
    </section>

  </div>
</template>
