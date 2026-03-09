<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  localStorage.removeItem('kteq-admin-token')
  router.push('/admin/login')
}

const sections = [
  { label: 'Schedule', route: '/admin/schedule', description: 'Edit the weekly programming grid' },
  { label: 'Shows', route: '/admin/shows', description: 'Manage show listings and descriptions' },
  { label: 'DJs', route: '/admin/djs', description: 'Manage DJ profiles' },
  { label: 'Timeline', route: '/admin/timeline', description: 'Add entries to the 55th anniversary timeline' },
  { label: 'Blog Posts', route: '/admin/posts', description: 'Write and publish news and updates' },
  { label: 'Settings', route: '/admin/settings', description: 'Campaign phase, stream URL, banner, socials' },
]
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <RouterLink to="/" class="font-display text-xs text-kteq-muted hover:text-kteq-white transition-colors">View Site</RouterLink>
          <button @click="logout" class="font-display text-xs text-kteq-muted hover:text-kteq-white transition-colors">Sign Out</button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <h1 class="font-display text-2xl font-bold text-kteq-white">Dashboard</h1>
      <p class="mt-1 text-sm text-kteq-muted">
        Changes here commit directly to the repo and deploy automatically (~60 seconds).
      </p>

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <RouterLink
          v-for="section in sections"
          :key="section.route"
          :to="section.route"
          class="group rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5 transition-colors hover:border-kteq-yellow/30"
        >
          <h2 class="font-display text-base font-semibold text-kteq-white group-hover:text-kteq-yellow transition-colors">
            {{ section.label }}
          </h2>
          <p class="mt-1 text-sm text-kteq-muted">{{ section.description }}</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
