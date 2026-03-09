<script setup lang="ts">
import CampaignHero from '@/components/campaign/CampaignHero.vue'
import { useContentStore } from '@/stores/content'
import { useNowOnAir } from '@/composables/useNowOnAir'

const content = useContentStore()
const { currentShow } = useNowOnAir()

// Latest 3 blog posts
const recentPosts = content.posts.slice(0, 3)

// Latest timeline entries (most recent first)
const recentHistory = [...content.timelineSorted].reverse().slice(0, 3)
</script>

<template>
  <div>
    <!-- Campaign Hero -->
    <CampaignHero />

    <!-- What's On Now -->
    <section class="border-b border-kteq-gray/30 bg-kteq-black">
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="flex items-center gap-3 mb-6">
          <span class="on-air-dot" />
          <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
            On Air Now
          </h2>
        </div>
        <div v-if="currentShow" class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <RouterLink
            :to="`/shows/${currentShow.show.slug}`"
            class="group"
          >
            <h3 class="font-display text-2xl font-bold text-kteq-white group-hover:text-kteq-yellow transition-colors">
              {{ currentShow.show.name }}
            </h3>
            <p v-if="currentShow.show.tagline" class="mt-1 text-sm text-kteq-muted">
              {{ currentShow.show.tagline }}
            </p>
            <p class="mt-2 font-mono text-xs text-kteq-muted">
              {{ currentShow.slot.startTime }}–{{ currentShow.slot.endTime === '00:00' ? 'Midnight' : currentShow.slot.endTime }}
              <span v-if="currentShow.slot.isAutomation" class="ml-2 rounded bg-kteq-gray px-2 py-0.5 text-[10px] uppercase tracking-wider">Automation</span>
            </p>
          </RouterLink>
        </div>
        <div v-else class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <p class="text-kteq-muted">Check the <RouterLink to="/schedule" class="text-kteq-yellow hover:underline">schedule</RouterLink> for upcoming shows.</p>
        </div>
      </div>
    </section>

    <!-- Recent From the Timeline -->
    <section v-if="recentHistory.length" class="border-b border-kteq-gray/30 bg-kteq-void">
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
            From Our History
          </h2>
          <RouterLink to="/history" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">
            Full timeline →
          </RouterLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div
            v-for="entry in recentHistory"
            :key="entry.id"
            class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5 transition-colors hover:border-kteq-gray"
          >
            <span class="font-mono text-xs text-kteq-yellow">{{ entry.year }}</span>
            <h3 class="mt-1 font-display text-base font-semibold text-kteq-white">{{ entry.title }}</h3>
            <p class="mt-2 text-sm text-kteq-muted line-clamp-3">{{ entry.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Blog Posts -->
    <section v-if="recentPosts.length" class="bg-kteq-black">
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">
            Latest News
          </h2>
          <RouterLink to="/blog" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">
            All posts →
          </RouterLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <RouterLink
            v-for="post in recentPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="group rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5 transition-colors hover:border-kteq-gray"
          >
            <span class="font-mono text-xs text-kteq-muted">{{ new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
            <h3 class="mt-1 font-display text-base font-semibold text-kteq-white group-hover:text-kteq-yellow transition-colors">{{ post.title }}</h3>
            <p v-if="post.excerpt" class="mt-2 text-sm text-kteq-muted line-clamp-2">{{ post.excerpt }}</p>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
