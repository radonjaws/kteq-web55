<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const content = useContentStore()
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">Blog</h1>
    <p class="mt-2 text-kteq-muted">News and updates from the station.</p>

    <div v-if="content.posts.length" class="mt-8 space-y-4">
      <RouterLink
        v-for="post in content.posts"
        :key="post.slug"
        :to="`/blog/${post.slug}`"
        class="group block rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6 transition-colors hover:border-kteq-yellow/30"
      >
        <span class="font-mono text-xs text-kteq-muted">
          {{ new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
          <span v-if="post.author" class="ml-2">· {{ post.author }}</span>
        </span>
        <h2 class="mt-1 font-display text-xl font-semibold text-kteq-white group-hover:text-kteq-yellow transition-colors">
          {{ post.title }}
        </h2>
        <p v-if="post.excerpt" class="mt-2 text-sm text-kteq-muted">{{ post.excerpt }}</p>
        <div v-if="post.tags.length" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="tag in post.tags" :key="tag" class="rounded bg-kteq-void px-2 py-0.5 text-[10px] text-kteq-muted">{{ tag }}</span>
        </div>
      </RouterLink>
    </div>

    <div v-else class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
      <p class="text-kteq-muted">No posts yet. Check back soon.</p>
    </div>
  </div>
</template>
