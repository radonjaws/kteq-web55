<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGitHub } from '@/composables/useGitHub'

const router = useRouter()
const { saving, error, lastSaved, save, getContent } = useGitHub()

function logout() {
  localStorage.removeItem('kteq-admin-token')
  router.push('/admin/login')
}

// ─── Settings state ───────────────────────────────────────────────────────────
const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
const rawContent = ref<any>(null)

type NavKey      = 'schedule' | 'shows' | 'djs' | 'history' | 'blog'
type HomepageKey = 'schedule' | 'history' | 'blog'

const form = reactive({
  logoUrl: '',
  navLinks: {
    schedule: true,
    shows:    true,
    djs:      false,
    history:  true,
    blog:     true,
  } as Record<NavKey, boolean>,
  homepageElements: {
    schedule: true,
    history:  true,
    blog:     true,
  } as Record<HomepageKey, boolean>,
})

// ─── Section definitions ──────────────────────────────────────────────────────
interface Section {
  label: string
  route: string
  description: string
  navKey?: NavKey
  homepageKey?: HomepageKey
}

const sections: Section[] = [
  {
    label: 'Campaigns',
    route: '/admin/campaigns',
    description: 'Manage campaigns — hero content, phases, and countdown',
  },
  {
    label: 'Settings',
    route: '/admin/settings',
    description: 'Stream URL, station info, banner, and social links',
  },
  {
    label: 'Blog Posts',
    route: '/admin/posts',
    description: 'Write and publish news and updates',
    navKey: 'blog',
    homepageKey: 'blog',
  },
  {
    label: 'Schedule',
    route: '/admin/schedule',
    description: 'Edit the weekly programming grid',
    navKey: 'schedule',
    homepageKey: 'schedule',
  },
  {
    label: 'Shows',
    route: '/admin/shows',
    description: 'Manage show listings and descriptions',
    navKey: 'shows',
  },
  {
    label: 'DJs',
    route: '/admin/djs',
    description: 'Manage DJ profiles',
    navKey: 'djs',
  },
  {
    label: 'History',
    route: '/admin/timeline',
    description: 'Add entries to the anniversary timeline',
    navKey: 'history',
    homepageKey: 'history',
  },
]

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { content, sha: fileSha } = await getContent('content/settings.json')
    sha.value = fileSha
    rawContent.value = content

    form.logoUrl = content.logoUrl || ''

    if (content.navLinks) {
      for (const key of Object.keys(form.navLinks) as NavKey[]) {
        if (key in content.navLinks) form.navLinks[key] = content.navLinks[key]
      }
    }
    if (content.homepageElements) {
      for (const key of Object.keys(form.homepageElements) as HomepageKey[]) {
        if (key in content.homepageElements) form.homepageElements[key] = content.homepageElements[key]
      }
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

// ─── Save ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  const newSha = await save('content/settings.json', {
    ...rawContent.value,
    logoUrl: form.logoUrl,
    navLinks: {
      ...rawContent.value?.navLinks,   // preserve listen, donate from Menu editor
      ...form.navLinks,
    },
    homepageElements: {
      ...rawContent.value?.homepageElements,
      ...form.homepageElements,
    },
  }, sha.value, 'Update dashboard settings')
  if (newSha) sha.value = newSha
}

// ─── Toggle helpers ───────────────────────────────────────────────────────────
function toggleNav(key: NavKey) {
  form.navLinks[key] = !form.navLinks[key]
}

function toggleHomepage(key: HomepageKey) {
  form.homepageElements[key] = !form.homepageElements[key]
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <RouterLink to="/" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">View Site</RouterLink>
          <button @click="logout" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">Sign Out</button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title + save -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Dashboard</h1>
          <p class="mt-1 text-sm text-kteq-muted">Changes commit directly to the repo and deploy automatically (~60 seconds).</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
          <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <template v-else>

        <!-- ── Logo ────────────────────────────────────────────────────────── -->
        <div class="mt-6 flex items-center gap-4 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-4">
          <!-- Preview mark -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">
            <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="h-full w-full object-cover" />
            <span v-else>K</span>
          </div>
          <!-- URL input -->
          <div class="flex-1 min-w-0">
            <label class="mb-1 block font-display text-xs font-medium text-kteq-light">
              Logo Image URL <span class="font-normal text-kteq-muted">(optional — leave empty for the default "K" mark)</span>
            </label>
            <input
              type="url"
              v-model="form.logoUrl"
              placeholder="https://…"
              class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-1.5 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
            />
          </div>
        </div>

        <!-- ── Section cards ────────────────────────────────────────────────── -->
        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div
            v-for="section in sections"
            :key="section.route"
            class="rounded-lg border border-kteq-gray/30 bg-kteq-dark transition-colors hover:border-kteq-yellow/30"
          >
            <!-- Clickable title + description area -->
            <RouterLink
              :to="section.route"
              class="group block px-5 pt-5"
              :class="section.navKey || section.homepageKey ? 'pb-3' : 'pb-5'"
            >
              <h2 class="font-display text-base font-semibold text-kteq-white transition-colors group-hover:text-kteq-yellow">
                {{ section.label }}
              </h2>
              <p class="mt-1 text-sm text-kteq-muted">{{ section.description }}</p>
            </RouterLink>

            <!-- Toggle strip (sections with nav/homepage controls) -->
            <div
              v-if="section.navKey || section.homepageKey"
              class="flex items-center gap-5 border-t border-kteq-gray/20 px-5 py-2.5"
            >
              <!-- Nav link toggle -->
              <div v-if="section.navKey" class="flex items-center gap-2">
                <button
                  type="button"
                  @click="toggleNav(section.navKey!)"
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                  :class="form.navLinks[section.navKey] ? 'bg-kteq-yellow' : 'bg-kteq-gray'"
                  role="switch"
                  :aria-checked="form.navLinks[section.navKey]"
                >
                  <span
                    class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                    :class="form.navLinks[section.navKey] ? 'translate-x-4' : 'translate-x-0.5'"
                  />
                </button>
                <span class="font-display text-xs text-kteq-muted">Nav link</span>
              </div>

              <!-- Homepage element toggle -->
              <div v-if="section.homepageKey" class="flex items-center gap-2">
                <button
                  type="button"
                  @click="toggleHomepage(section.homepageKey!)"
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-1 focus:ring-offset-kteq-dark"
                  :class="form.homepageElements[section.homepageKey] ? 'bg-kteq-yellow' : 'bg-kteq-gray'"
                  role="switch"
                  :aria-checked="form.homepageElements[section.homepageKey]"
                >
                  <span
                    class="pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                    :class="form.homepageElements[section.homepageKey] ? 'translate-x-4' : 'translate-x-0.5'"
                  />
                </button>
                <span class="font-display text-xs text-kteq-muted">Homepage</span>
              </div>
            </div>
          </div>

          <!-- Menu card (separate editor for Listen + Donate) -->
          <RouterLink
            to="/admin/menu"
            class="group rounded-lg border border-kteq-gray/30 bg-kteq-dark px-5 py-5 transition-colors hover:border-kteq-yellow/30"
          >
            <h2 class="font-display text-base font-semibold text-kteq-white transition-colors group-hover:text-kteq-yellow">Menu</h2>
            <p class="mt-1 text-sm text-kteq-muted">Listen button and Donate link visibility</p>
          </RouterLink>
        </div>

      </template>
    </div>
  </div>
</template>
