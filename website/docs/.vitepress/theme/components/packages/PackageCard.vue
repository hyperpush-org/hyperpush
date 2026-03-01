<script setup lang="ts">
interface Props {
  name: string
  version: string
  description: string
  downloadCount?: number
  owner?: string
}
const props = defineProps<Props>()

// Navigate to per-package page using query param pattern
function goToPackage() {
  window.location.href = `/packages/package?name=${encodeURIComponent(props.name)}`
}
</script>

<template>
  <div
    class="group cursor-pointer rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-md transition-all duration-200"
    @click="goToPackage"
  >
    <div class="flex items-start justify-between gap-3 mb-2">
      <h3 class="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 break-all">
        {{ name }}
      </h3>
      <span class="shrink-0 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
        v{{ version }}
      </span>
    </div>
    <p class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
      {{ description || 'No description.' }}
    </p>
    <div class="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
      <span v-if="owner">by <a :href="`https://github.com/${owner}`" class="hover:text-violet-500" @click.stop>{{ owner }}</a></span>
      <span v-if="downloadCount !== undefined">{{ downloadCount.toLocaleString() }} downloads</span>
    </div>
  </div>
</template>
