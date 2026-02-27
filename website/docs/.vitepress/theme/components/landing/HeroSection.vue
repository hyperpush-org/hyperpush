<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'
import { Button } from '@/components/ui/button'
import { getHighlighter, highlightCode } from '@/composables/useShiki'
import { ArrowRight } from 'lucide-vue-next'

const { theme } = useData()

const highlightedHtml = ref('')

const heroCode = `service Counter do
  fn init(n :: Int) -> Int do n end

  call Increment() :: Int do |count|
    (count + 1, count + 1)
  end
end

fn handle_count(request) do
  let pid = Process.whereis("counter")
  let count = Counter.increment(pid)
  HTTP.response(200, "Count: \#{count}")
end

fn main() do
  let _ = Process.register("counter", Counter.start(0))

  HTTP.serve((HTTP.router()
    |> HTTP.on_get("/count", handle_count)), 8080)
end`

onMounted(async () => {
  try {
    const hl = await getHighlighter()
    highlightedHtml.value = highlightCode(hl, heroCode)
  } catch {
    // Highlighting failed -- raw code fallback remains visible
  }
})
</script>

<template>
  <section class="relative overflow-hidden">
    <!-- Subtle radial vignette background -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--border),transparent_70%)] opacity-60" />

    <div class="relative mx-auto max-w-6xl px-4 pt-12 pb-16 md:pt-16 lg:pt-24 md:pb-24">
      <div class="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <!-- Left column: text -->
        <div class="text-center lg:text-left animate-fade-in-up">
          <!-- Version badge -->
          <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span class="relative inline-flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
              <span class="relative inline-block size-2 rounded-full bg-foreground" />
            </span>
            Now in development &mdash; v{{ theme.meshVersion }}
          </div>

          <h1 class="text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl lg:text-7xl" style="line-height: 1.05;">
            Build concurrent systems with confidence.
          </h1>

          <p class="mx-auto mt-6 max-w-lg text-lg text-muted-foreground sm:text-xl lg:mx-0" style="line-height: 1.7;">
            Mesh combines Elixir-style concurrency with static type inference,
            compiling to fast native binaries.
          </p>

          <div class="mt-10 flex items-center justify-center gap-3 lg:justify-start">
            <Button as="a" href="/docs/getting-started/" size="lg" class="h-12 px-8 rounded-lg text-base font-semibold">
              Get Started
              <ArrowRight class="ml-1.5 size-4" />
            </Button>
            <Button as="a" href="https://github.com/snowdamiz/mesh-lang" variant="outline" size="lg" class="h-12 px-8 rounded-lg text-base font-semibold">
              View on GitHub
            </Button>
          </div>
        </div>

        <!-- Right column: code block -->
        <div class="relative animate-fade-in-up" style="animation-delay: 200ms;">
          <!-- Glow orb -->
          <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-foreground/5 blur-3xl animate-glow-pulse" />

          <!-- Terminal -->
          <div class="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <!-- Terminal header -->
            <div class="flex items-center gap-2 border-b border-border px-4 py-3">
              <div class="flex gap-1.5">
                <div class="size-3 rounded-full" style="background: #ff5f57;" />
                <div class="size-3 rounded-full" style="background: #febc2e;" />
                <div class="size-3 rounded-full" style="background: #28c840;" />
              </div>
              <span class="ml-2 text-xs text-muted-foreground font-medium">main.mpl</span>
            </div>
            <!-- Code content -->
            <div v-if="highlightedHtml" v-html="highlightedHtml" class="vp-code [&_pre]:px-5 [&_pre]:py-4 [&_pre]:!bg-transparent" />
            <pre v-else class="overflow-x-auto px-5 py-4 text-sm leading-relaxed text-foreground font-mono"><code>{{ heroCode }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
