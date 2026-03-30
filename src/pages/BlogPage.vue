<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const content = useContentStore()
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">Blog</h1>
    <p class="mt-2 text-kteq-muted">News and updates from the station.</p>

    <div v-if="content.posts.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="post in content.posts"
        :key="post.slug"
        :to="`/blog/${post.slug}`"
        class="group relative flex aspect-video items-end overflow-hidden rounded-lg border border-kteq-gray/30 transition-colors hover:border-kteq-yellow/30"
      >
        <!-- Background image -->
        <div
          v-if="post.featuredImage"
          class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          :style="{ backgroundImage: `url(${post.featuredImage})` }"
        />
        <!-- Overlay: darker at rest, lighter on hover -->
        <div class="absolute inset-0 bg-black/65 transition-opacity duration-300 group-hover:bg-black/45" />
        <!-- Fallback bg for posts without an image -->
        <div v-if="!post.featuredImage" class="absolute inset-0 bg-kteq-dark" />
        <!-- Text content -->
        <div class="relative z-10 w-full p-4">
          <div class="flex items-center gap-2 font-mono text-xs text-kteq-muted">
            <span>{{ new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
            <span v-if="post.author">· {{ post.author }}</span>
          </div>
          <h2 class="mt-1 font-display text-base font-semibold text-kteq-white transition-colors group-hover:text-kteq-yellow leading-snug">
            {{ post.title }}
          </h2>
          <p v-if="post.excerpt" class="mt-1 text-sm text-kteq-muted line-clamp-2">{{ post.excerpt }}</p>
          <div v-if="post.tags.length" class="mt-2 flex flex-wrap gap-1">
            <span v-for="tag in post.tags" :key="tag" class="rounded bg-kteq-black/50 px-1.5 py-0.5 text-[10px] text-kteq-muted">{{ tag }}</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <div v-else class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
      <p class="text-kteq-muted">No posts yet. Check back soon.</p>
    </div>
  </div>
</template>
