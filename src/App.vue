<script setup lang="ts">
import SiteHeader from '@/components/common/SiteHeader.vue'
import SiteFooter from '@/components/common/SiteFooter.vue'
import AudioPlayer from '@/components/player/AudioPlayer.vue'
import AnnouncementBanner from '@/components/common/AnnouncementBanner.vue'
import { useContentStore } from '@/stores/content'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const content = useContentStore()
const route = useRoute()

const isAdmin = computed(() => route.path.startsWith('/admin'))
const showBanner = computed(() => !!content.settings.bannerText && !isAdmin.value)
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-kteq-black">
    <!-- Skip to main content -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded focus:bg-kteq-yellow focus:px-4 focus:py-2 focus:font-display focus:font-semibold focus:text-kteq-black">
      Skip to main content
    </a>

    <!-- Announcement Banner -->
    <AnnouncementBanner v-if="showBanner" />

    <!-- Site Header (hidden in admin) -->
    <SiteHeader v-if="!isAdmin" />

    <!-- Page Content -->
    <main id="main-content" class="flex-1" :class="{ 'pb-[var(--spacing-player)]': !isAdmin }">
      <RouterView />
    </main>

    <!-- Site Footer (hidden in admin) -->
    <SiteFooter v-if="!isAdmin" class="pb-[var(--spacing-player)]" />

    <!-- Persistent Audio Player (hidden in admin) -->
    <AudioPlayer v-if="!isAdmin" />
  </div>
</template>
