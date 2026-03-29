<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { marked } from 'marked'

const route = useRoute()
const content = useContentStore()

const post = computed(() => content.posts.find(p => p.slug === route.params.slug))
const renderedBody = computed(() => post.value ? marked(post.value.body) : '')
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12">
    <RouterLink to="/blog" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">← All Posts</RouterLink>
    <article v-if="post" class="mt-6">
      <span class="font-mono text-xs text-kteq-muted">
        {{ new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
        <span v-if="post.author" class="ml-2">· {{ post.author }}</span>
      </span>
      <h1 class="mt-2 font-display text-3xl font-bold text-kteq-white sm:text-4xl text-balance">{{ post.title }}</h1>
      <div v-if="post.tags.length" class="mt-3 flex flex-wrap gap-1.5">
        <span v-for="tag in post.tags" :key="tag" class="rounded bg-kteq-dark px-2.5 py-0.5 text-xs text-kteq-muted">{{ tag }}</span>
      </div>
      <div class="divider-static my-8" />
      <img v-if="post.featuredImage" :src="post.featuredImage" :alt="post.title" class="mb-8 w-full rounded-lg object-cover aspect-video" />
      <div class="prose prose-invert max-w-none text-kteq-light [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display [&_a]:text-kteq-yellow [&_strong]:text-kteq-white" v-html="renderedBody" />
    </article>
    <div v-else class="mt-6 text-kteq-muted">Post not found.</div>
  </div>
</template>
