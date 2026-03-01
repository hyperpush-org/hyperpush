<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PackageCard from './PackageCard.vue'
import PackageList from './PackageList.vue'

const REGISTRY_URL = 'https://registry.meshlang.dev'
const FEATURED_COUNT = 6

interface PackageItem {
  name: string
  version: string
  description: string
  download_count?: number
  owner?: string
}

const allPackages = ref<PackageItem[]>([])
const featured = ref<PackageItem[]>([])
const rest = ref<PackageItem[]>([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchPackages() {
  loading.value = true
  error.value = null
  try {
    const q = searchQuery.value.trim()
    const url = q
      ? `${REGISTRY_URL}/api/v1/packages?search=${encodeURIComponent(q)}`
      : `${REGISTRY_URL}/api/v1/packages`

    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Registry returned ${resp.status}`)
    const data: PackageItem[] = await resp.json()

    if (q) {
      // In search mode, show flat list (no featured split)
      allPackages.value = data
      featured.value = []
      rest.value = data
    } else {
      // Browse mode: top 6 by download_count as featured cards
      allPackages.value = data
      featured.value = data.slice(0, FEATURED_COUNT)
      rest.value = data.slice(FEATURED_COUNT)
    }
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load packages'
  } finally {
    loading.value = false
  }
}

// Debounce search to avoid hammering the API on every keystroke
let searchTimer: ReturnType<typeof setTimeout>
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchPackages, 300)
}

onMounted(fetchPackages)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Packages</h1>
      <p class="text-zinc-500 dark:text-zinc-400">Browse and install Mesh packages.</p>
    </div>

    <!-- Search box -->
    <div class="mb-8">
      <input
        v-model="searchQuery"
        @input="onSearchInput"
        type="text"
        placeholder="Search packages by name or description..."
        class="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-zinc-400">
      <span>Loading packages...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-12 text-center text-zinc-500">
      <p class="text-sm">{{ error }}</p>
      <button @click="fetchPackages" class="mt-3 text-sm text-violet-500 hover:underline">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="allPackages.length === 0" class="py-12 text-center text-zinc-400">
      <p class="text-sm">{{ searchQuery ? `No packages found for "${searchQuery}".` : 'No packages published yet.' }}</p>
    </div>

    <!-- Browse mode: featured cards + list -->
    <template v-else>
      <!-- Featured section (only shown when not searching) -->
      <div v-if="!searchQuery && featured.length > 0" class="mb-10">
        <h2 class="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Featured</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PackageCard
            v-for="pkg in featured"
            :key="pkg.name"
            :name="pkg.name"
            :version="pkg.version"
            :description="pkg.description"
            :download-count="pkg.download_count"
            :owner="pkg.owner"
          />
        </div>
      </div>

      <!-- All packages list (or search results) -->
      <div>
        <h2 v-if="!searchQuery && rest.length > 0" class="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-3">All Packages</h2>
        <h2 v-else-if="searchQuery" class="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          {{ allPackages.length }} result{{ allPackages.length !== 1 ? 's' : '' }} for "{{ searchQuery }}"
        </h2>
        <PackageList :packages="searchQuery ? allPackages : rest" />
      </div>
    </template>
  </div>
</template>
