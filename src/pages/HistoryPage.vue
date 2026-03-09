<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()

const selectedCategory = ref<string | null>(null)
const categories = ['milestone', 'music', 'people', 'technical'] as const
const categoryLabels: Record<string, string> = {
  milestone: 'Milestones',
  music: 'Music',
  people: 'People',
  technical: 'Technical'
}

const filteredEntries = computed(() => {
  if (!selectedCategory.value) return content.timelineSorted
  return content.timelineSorted.filter(e => e.category === selectedCategory.value)
})

// Group by decade for navigation
const decades = content.timelineDecades

function scrollToDecade(decade: number) {
  const el = document.getElementById(`decade-${decade}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Get the decade for an entry
function getDecade(year: number): number {
  return Math.floor(year / 10) * 10
}

// Check if this entry is the first in its decade
function isFirstInDecade(index: number): boolean {
  if (index === 0) return true
  const current = getDecade(filteredEntries.value[index].year)
  const prev = getDecade(filteredEntries.value[index - 1].year)
  return current !== prev
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <!-- Header -->
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">
      55 Years of KTEQ
    </h1>
    <p class="mt-2 text-lg text-kteq-muted">
      From a student petition in 1969 to the South Dakota Rock &amp; Roll Hall of Fame.
    </p>

    <!-- Decade quick-jump -->
    <div class="mt-8 flex flex-wrap gap-2">
      <button
        v-for="decade in decades"
        :key="decade"
        @click="scrollToDecade(decade)"
        class="rounded-md border border-kteq-gray/30 bg-kteq-dark px-3 py-1.5 font-mono text-xs text-kteq-muted transition-colors hover:border-kteq-yellow/30 hover:text-kteq-yellow"
      >
        {{ decade }}s
      </button>
    </div>

    <!-- Category filter -->
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        @click="selectedCategory = null"
        class="rounded-full px-3 py-1 font-display text-xs font-medium transition-colors"
        :class="!selectedCategory
          ? 'bg-kteq-yellow text-kteq-black'
          : 'bg-kteq-dark text-kteq-muted hover:text-kteq-light'"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedCategory = selectedCategory === cat ? null : cat"
        class="rounded-full px-3 py-1 font-display text-xs font-medium transition-colors"
        :class="selectedCategory === cat
          ? 'bg-kteq-yellow text-kteq-black'
          : 'bg-kteq-dark text-kteq-muted hover:text-kteq-light'"
      >
        {{ categoryLabels[cat] }}
      </button>
    </div>

    <!-- Timeline -->
    <div class="relative mt-12">
      <!-- Vertical line -->
      <div class="absolute left-4 top-0 bottom-0 w-px bg-kteq-gray/40 sm:left-8" />

      <div class="space-y-0">
        <template v-for="(entry, i) in filteredEntries" :key="entry.id">
          <!-- Decade marker -->
          <div
            v-if="isFirstInDecade(i)"
            :id="`decade-${getDecade(entry.year)}`"
            class="relative mb-6 pt-8"
          >
            <div class="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-kteq-yellow bg-kteq-black font-mono text-[10px] font-bold text-kteq-yellow sm:left-4 sm:h-10 sm:w-10 sm:text-xs">
              {{ getDecade(entry.year) }}s
            </div>
          </div>

          <!-- Entry -->
          <div class="relative pb-8 pl-12 sm:pl-20">
            <!-- Dot on timeline -->
            <div class="absolute left-[13px] top-1 h-2.5 w-2.5 rounded-full border-2 border-kteq-gray bg-kteq-void sm:left-[29px]" />

            <!-- Year badge -->
            <span class="font-mono text-xs font-medium text-kteq-yellow">
              {{ entry.year }}{{ entry.month ? ` · ${new Date(entry.year, entry.month - 1).toLocaleString('en-US', { month: 'short' })}` : '' }}
            </span>

            <!-- Card -->
            <div class="mt-2 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5">
              <h3 class="font-display text-lg font-semibold text-kteq-white">
                {{ entry.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-kteq-muted">
                {{ entry.description }}
              </p>
              <div class="mt-3">
                <span class="rounded-full bg-kteq-void px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-kteq-muted">
                  {{ categoryLabels[entry.category] || entry.category }}
                </span>
              </div>
              <!-- Image -->
              <img
                v-if="entry.image"
                :src="entry.image"
                :alt="entry.title"
                class="mt-4 w-full rounded-md border border-kteq-gray/20 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- End marker -->
      <div class="relative pl-12 sm:pl-20">
        <div class="absolute left-[11px] top-0 h-4 w-4 rounded-full border-2 border-kteq-yellow bg-kteq-yellow sm:left-[27px]" />
        <p class="font-display text-sm font-medium text-kteq-yellow">
          The story continues...
        </p>
      </div>
    </div>
  </div>
</template>
