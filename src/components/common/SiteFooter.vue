<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const year = new Date().getFullYear()

// Mirror the same navLinks logic as the header so footer stays in sync
const navEnabled = computed(() => (content.settings as any).navLinks ?? {})
function showNav(key: string): boolean {
  return navEnabled.value[key] !== false
}
</script>

<template>
  <footer class="border-t border-kteq-gray/30 bg-kteq-void">
    <div class="mx-auto max-w-6xl px-4 py-12">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Station ID -->
        <div>
          <div class="font-display text-lg font-bold text-kteq-white">KTEQ-FM 91.3</div>
          <p class="mt-2 text-sm text-kteq-muted">
            South Dakota Mines' student-run alternative radio station. Established 1971.
          </p>
          <p class="mt-3 font-mono text-xs text-kteq-muted">
            Non-Commercial Educational<br>
            Rapid City, South Dakota
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <div class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Navigate</div>
          <nav class="mt-3 flex flex-col gap-2">
            <RouterLink v-if="showNav('schedule')" to="/schedule" class="text-sm text-kteq-light hover:text-kteq-yellow">Schedule</RouterLink>
            <RouterLink v-if="showNav('shows')"    to="/shows"    class="text-sm text-kteq-light hover:text-kteq-yellow">Shows</RouterLink>
            <RouterLink v-if="showNav('djs')"      to="/djs"      class="text-sm text-kteq-light hover:text-kteq-yellow">DJs</RouterLink>
            <RouterLink v-if="showNav('history')"  to="/history"  class="text-sm text-kteq-light hover:text-kteq-yellow">History</RouterLink>
            <RouterLink v-if="showNav('blog')"     to="/blog"     class="text-sm text-kteq-light hover:text-kteq-yellow">Blog</RouterLink>
            <RouterLink to="/donate" class="text-sm text-kteq-light hover:text-kteq-yellow">Donate</RouterLink>
          </nav>
        </div>

        <!-- Contact -->
        <div>
          <div class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Contact</div>
          <div class="mt-3 flex flex-col gap-2 text-sm text-kteq-light">
            <a :href="`tel:${content.settings.requestLine}`" class="hover:text-kteq-yellow">
              {{ content.settings.requestLine }}
            </a>
            <a :href="`mailto:${content.settings.email}`" class="hover:text-kteq-yellow">
              {{ content.settings.email }}
            </a>
          </div>
        </div>

        <!-- Connect -->
        <div>
          <div class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">Connect</div>
          <div class="mt-3 flex flex-col gap-2 text-sm">
            <a v-if="content.settings.socialLinks.facebook" :href="content.settings.socialLinks.facebook" target="_blank" rel="noopener" class="text-kteq-light hover:text-kteq-yellow">Facebook</a>
            <a v-if="content.settings.socialLinks.instagram" :href="content.settings.socialLinks.instagram" target="_blank" rel="noopener" class="text-kteq-light hover:text-kteq-yellow">Instagram</a>
            <a v-if="content.settings.socialLinks.tunein" :href="content.settings.socialLinks.tunein" target="_blank" rel="noopener" class="text-kteq-light hover:text-kteq-yellow">TuneIn</a>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="divider-static mt-10 mb-6" />
      <div class="flex flex-col items-center justify-between gap-2 text-xs text-kteq-muted sm:flex-row">
        <span>&copy; {{ year }} KTEQ-FM / South Dakota Mines</span>
        <a href="https://publicfiles.fcc.gov/fm-profile/KTEQ-FM" target="_blank" rel="noopener" class="hover:text-kteq-yellow">
          FCC Public File
        </a>
      </div>
    </div>
  </footer>
</template>
