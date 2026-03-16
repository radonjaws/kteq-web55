<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { useGitHub } from '@/composables/useGitHub'

const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')

const { saving, error, lastSaved, save, getContent } = useGitHub()

// ── Types ─────────────────────────────────────────────────────────────────────
interface SlotForm {
  id:           string
  startTime:    string
  endTime:      string
  showSlug:     string
  isAutomation: boolean
  notes:        string
}

interface ShowOption {
  slug:         string
  name:         string
  isAutomation: boolean
}

// ── State ─────────────────────────────────────────────────────────────────────
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
type Day = typeof DAYS[number]
const DAY_LABELS: Record<Day, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
}
const DAY_PREFIX: Record<Day, string> = {
  sunday: 'sun', monday: 'mon', tuesday: 'tue', wednesday: 'wed',
  thursday: 'thu', friday: 'fri', saturday: 'sat',
}

const loading    = ref(true)
const loadError  = ref<string | null>(null)
const sha        = ref('')
const rawContent = ref<any>(null)
const activeDay  = ref<Day>('monday')
const showOptions = ref<ShowOption[]>([])

// Days map: day → array of slot forms (mutable, not reactive object of arrays
// because vue reactive() loses array identity on nested mutations)
const days = reactive<Record<Day, SlotForm[]>>({
  sunday: [], monday: [], tuesday: [], wednesday: [],
  thursday: [], friday: [], saturday: [],
})

// ── Load ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    // Load schedule and shows in parallel
    const [schedRes, showsRes] = await Promise.all([
      getContent('content/schedule.json'),
      getContent('content/shows.json'),
    ])

    sha.value = schedRes.sha
    rawContent.value = schedRes.content

    // Populate show options (active shows only)
    showOptions.value = (showsRes.content.shows ?? [])
      .filter((s: any) => s.isActive !== false)
      .map((s: any) => ({ slug: s.slug, name: s.name, isAutomation: !!s.isAutomation }))

    // Populate slot forms from schedule data
    for (const day of DAYS) {
      const slots: any[] = schedRes.content.days?.[day] ?? []
      days[day] = slots.map(slotToForm)
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

function slotToForm(s: any): SlotForm {
  return {
    id:           s.id          ?? '',
    startTime:    s.startTime   ?? '',
    endTime:      s.endTime     ?? '',
    showSlug:     s.showSlug    ?? 'automation',
    isAutomation: s.isAutomation ?? false,
    notes:        s.notes       ?? '',
  }
}

// ── Show lookup ───────────────────────────────────────────────────────────────
function isAutomationShow(slug: string): boolean {
  return showOptions.value.find(s => s.slug === slug)?.isAutomation ?? false
}

// When the show changes on a slot, sync isAutomation automatically
function onShowChange(slot: SlotForm) {
  slot.isAutomation = isAutomationShow(slot.showSlug)
}

// ── Slot management ───────────────────────────────────────────────────────────
function generateId(day: Day, startTime: string): string {
  return `${DAY_PREFIX[day]}-${startTime.replace(':', '')}`
}

function addSlot(day: Day) {
  const slots = days[day]
  const lastEnd = slots.length ? slots[slots.length - 1].endTime : '00:00'
  const startTime = lastEnd === '00:00' ? '' : lastEnd
  const newSlot: SlotForm = {
    id:           '',   // assigned on save
    startTime,
    endTime:      '',
    showSlug:     'automation',
    isAutomation: true,
    notes:        '',
  }
  slots.push(newSlot)
}

function removeSlot(day: Day, index: number) {
  days[day].splice(index, 1)
}

function moveSlot(day: Day, index: number, direction: -1 | 1) {
  const slots = days[day]
  const target = index + direction
  if (target < 0 || target >= slots.length) return
  ;[slots[index], slots[target]] = [slots[target], slots[index]]
}

// ── Validation ────────────────────────────────────────────────────────────────
const validationErrors = computed<string[]>(() => {
  const errors: string[] = []
  for (const day of DAYS) {
    for (let i = 0; i < days[day].length; i++) {
      const s = days[day][i]
      if (!s.startTime) errors.push(`${DAY_LABELS[day]} slot ${i + 1}: missing start time`)
      if (!s.endTime)   errors.push(`${DAY_LABELS[day]} slot ${i + 1}: missing end time`)
      if (!s.showSlug)  errors.push(`${DAY_LABELS[day]} slot ${i + 1}: no show selected`)
    }
  }
  return errors
})

// ── Save ──────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (validationErrors.value.length) return

  const daysOut: Record<string, any[]> = {}
  for (const day of DAYS) {
    daysOut[day] = days[day].map((s, i) => ({
      id:           s.id || generateId(day, s.startTime || String(i)),
      startTime:    s.startTime,
      endTime:      s.endTime,
      showSlug:     s.showSlug,
      isAutomation: isAutomationShow(s.showSlug),
      notes:        s.notes,
    }))
  }

  const newSha = await save('content/schedule.json', {
    ...rawContent.value,
    lastUpdated: new Date().toISOString(),
    updatedBy:   'Admin',
    days:        daysOut,
  }, sha.value, 'Update schedule')

  if (newSha) sha.value = newSha
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-5xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <img v-if="adminLogoUrl" :src="adminLogoUrl" alt="KTEQ" class="h-8 w-auto object-contain" />
            <span v-else class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</span>
          </RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Schedule</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-8">

      <!-- Title + save -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Schedule</h1>
          <p class="mt-1 text-sm text-kteq-muted">Weekly programming grid. Changes deploy in ~60 seconds.</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
          <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading || validationErrors.length > 0"
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

        <!-- Validation errors -->
        <div v-if="validationErrors.length" class="mt-4 rounded-lg border border-kteq-red/30 bg-kteq-red/5 px-4 py-3">
          <p v-for="e in validationErrors" :key="e" class="text-xs text-kteq-red">{{ e }}</p>
        </div>

        <!-- Day tabs -->
        <div class="mt-6 flex gap-1 border-b border-kteq-gray/30">
          <button
            v-for="day in DAYS"
            :key="day"
            type="button"
            @click="activeDay = day"
            class="relative px-4 py-2.5 font-display text-sm font-medium transition-colors"
            :class="activeDay === day
              ? 'text-kteq-yellow after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-kteq-yellow'
              : 'text-kteq-muted hover:text-kteq-light'"
          >
            {{ DAY_LABELS[day] }}
            <!-- dot if day has non-automation slots -->
            <span
              v-if="days[day].some(s => !s.isAutomation)"
              class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-kteq-yellow/60"
            />
          </button>
        </div>

        <!-- Slot list for active day -->
        <div class="mt-4">

          <!-- Column headers -->
          <div class="mb-1 grid grid-cols-[90px_90px_1fr_auto_auto] items-center gap-3 px-3">
            <span class="font-display text-[10px] uppercase tracking-wider text-kteq-muted">Start</span>
            <span class="font-display text-[10px] uppercase tracking-wider text-kteq-muted">End</span>
            <span class="font-display text-[10px] uppercase tracking-wider text-kteq-muted">Show</span>
            <span class="font-display text-[10px] uppercase tracking-wider text-kteq-muted">Notes</span>
            <span />
          </div>

          <!-- Slots -->
          <div class="flex flex-col gap-1.5">
            <div
              v-for="(slot, i) in days[activeDay]"
              :key="slot.id || i"
              class="grid grid-cols-[90px_90px_1fr_auto_auto] items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
              :class="slot.isAutomation
                ? 'border-kteq-gray/20 bg-kteq-void'
                : 'border-kteq-yellow/20 bg-kteq-dark'"
            >
              <!-- Start time -->
              <input
                type="time"
                v-model="slot.startTime"
                class="w-full rounded border border-kteq-gray/40 bg-kteq-black px-2 py-1 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none"
              />

              <!-- End time -->
              <input
                type="time"
                v-model="slot.endTime"
                class="w-full rounded border border-kteq-gray/40 bg-kteq-black px-2 py-1 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none"
              />

              <!-- Show dropdown -->
              <select
                v-model="slot.showSlug"
                @change="onShowChange(slot)"
                class="w-full rounded border border-kteq-gray/40 bg-kteq-black px-2 py-1 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none"
              >
                <option v-for="show in showOptions" :key="show.slug" :value="show.slug">
                  {{ show.name }}
                </option>
              </select>

              <!-- Notes -->
              <input
                type="text"
                v-model="slot.notes"
                placeholder="optional note…"
                class="w-36 rounded border border-kteq-gray/40 bg-kteq-black px-2 py-1 font-body text-sm text-kteq-white placeholder-kteq-muted/40 focus:border-kteq-yellow/50 focus:outline-none"
              />

              <!-- Row actions -->
              <div class="flex items-center gap-0.5">
                <button
                  type="button"
                  @click="moveSlot(activeDay, i, -1)"
                  :disabled="i === 0"
                  class="flex h-7 w-7 items-center justify-center rounded text-kteq-muted transition-colors hover:text-kteq-light disabled:opacity-20"
                  title="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                    <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="moveSlot(activeDay, i, 1)"
                  :disabled="i === days[activeDay].length - 1"
                  class="flex h-7 w-7 items-center justify-center rounded text-kteq-muted transition-colors hover:text-kteq-light disabled:opacity-20"
                  title="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                    <path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="removeSlot(activeDay, i)"
                  class="flex h-7 w-7 items-center justify-center rounded text-kteq-muted transition-colors hover:text-kteq-red"
                  title="Remove slot"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                    <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="days[activeDay].length === 0" class="rounded-lg border border-dashed border-kteq-gray/30 px-4 py-6 text-center text-sm text-kteq-muted">
              No slots for {{ activeDay }}. Add one below.
            </div>
          </div>

          <!-- Add slot -->
          <button
            type="button"
            @click="addSlot(activeDay)"
            class="mt-3 flex items-center gap-2 rounded-md border border-dashed border-kteq-gray/40 px-4 py-2 font-display text-sm text-kteq-muted transition-colors hover:border-kteq-yellow/30 hover:text-kteq-yellow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add slot
          </button>

          <!-- Day summary -->
          <p class="mt-4 text-xs text-kteq-muted">
            {{ days[activeDay].filter(s => !s.isAutomation).length }} live
            slot{{ days[activeDay].filter(s => !s.isAutomation).length !== 1 ? 's' : '' }},
            {{ days[activeDay].filter(s => s.isAutomation).length }} automation block{{ days[activeDay].filter(s => s.isAutomation).length !== 1 ? 's' : '' }}
          </p>
        </div>

      </template>
    </div>
  </div>
</template>
