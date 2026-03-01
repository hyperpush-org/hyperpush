<script setup lang="ts">
interface Package {
  name: string
  version: string
  description: string
  downloadCount?: number
}
defineProps<{ packages: Package[] }>()

function packageUrl(name: string) {
  return `/packages/package?name=${encodeURIComponent(name)}`
}
</script>

<template>
  <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
    <a
      v-for="pkg in packages"
      :key="pkg.name"
      :href="packageUrl(pkg.name)"
      class="flex items-center gap-4 py-3 px-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors no-underline group"
    >
      <div class="flex-1 min-w-0">
        <span class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 break-all">
          {{ pkg.name }}
        </span>
        <span class="text-sm text-zinc-500 dark:text-zinc-400 ml-3 truncate hidden sm:inline">
          {{ pkg.description || 'No description.' }}
        </span>
      </div>
      <span class="shrink-0 font-mono text-xs text-zinc-400 dark:text-zinc-500">v{{ pkg.version }}</span>
    </a>
  </div>
</template>
