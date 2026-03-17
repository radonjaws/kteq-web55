<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const content = useContentStore()

const baseUrl = import.meta.env.BASE_URL   // '/' in dev, '/kteq-web55/' in prod

// All entries in chronological order (oldest first)
const entries = content.timelineSorted

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestone',
  technical: 'Technical',
  music:     'Music',
  people:    'People',
}
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

    <!-- ── Annual entry grid ─────────────────────────────────────────────── -->
    <section class="bg-kteq-black px-4 py-16">
      <div class="mx-auto max-w-6xl">
        <h2 class="mb-10 font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">The Full Record</h2>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <component
            :is="(entry as any).articleSlug ? 'RouterLink' : 'div'"
            v-for="entry in entries"
            :key="entry.id"
            v-bind="(entry as any).articleSlug ? { to: `/history/${(entry as any).articleSlug}` } : {}"
            class="group rounded-lg border bg-kteq-dark p-5 transition-colors"
            :class="(entry as any).articleSlug
              ? 'border-kteq-gray/30 hover:border-kteq-yellow/30 cursor-pointer'
              : 'border-kteq-gray/20'"
          >
            <span
              class="font-mono text-sm font-bold transition-colors"
              :class="(entry as any).articleSlug ? 'text-kteq-yellow' : 'text-kteq-muted'"
            >{{ entry.year }}</span>

            <h3
              class="mt-1 font-display text-sm font-semibold leading-snug transition-colors"
              :class="(entry as any).articleSlug
                ? 'text-kteq-white group-hover:text-kteq-yellow'
                : 'text-kteq-light'"
            >{{ entry.title }}</h3>

            <div class="mt-3 flex items-center justify-between gap-2">
              <span class="rounded bg-kteq-void px-1.5 py-0.5 font-mono text-[10px] text-kteq-muted">
                {{ CATEGORY_LABELS[entry.category] ?? entry.category }}
              </span>
              <span v-if="(entry as any).articleSlug" class="font-display text-[10px] text-kteq-yellow opacity-0 transition-opacity group-hover:opacity-100">
                Read →
              </span>
            </div>
          </component>
        </div>
      </div>
    </section>

  </div>
</template>
