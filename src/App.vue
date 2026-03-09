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
    <!-- Announcement Banner -->
    <AnnouncementBanner v-if="showBanner" />

    <!-- Site Header (hidden in admin) -->
    <SiteHeader v-if="!isAdmin" />

    <!-- Page Content -->
    <main class="flex-1" :class="{ 'pb-[var(--spacing-player)]': !isAdmin }">
      <RouterView />
    </main>

    <!-- Site Footer (hidden in admin) -->
    <SiteFooter v-if="!isAdmin" class="pb-[var(--spacing-player)]" />

    <!-- Persistent Audio Player (hidden in admin) -->
    <AudioPlayer v-if="!isAdmin" />
  </div>
</template>
