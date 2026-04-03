<script>
  import '../app.css';
  import { Search, Sun, Moon, ExternalLink } from 'lucide-svelte';
  import { onMount } from 'svelte';

  const syncDarkFromDocument = () => {
    dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  };

  let dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  onMount(syncDarkFromDocument);

  function toggleDark() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }
</script>

<header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
  <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 lg:px-6">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3 shrink-0 no-underline">
      <span class="themed-logo" aria-hidden="true">
        <img src="/logo-black.svg" alt="" class="themed-logo__light h-7 w-auto" />
        <img src="/logo-white.svg" alt="" class="themed-logo__dark h-7 w-auto" />
      </span>
      <span class="sr-only">Mesh</span>
      <span class="text-muted-foreground/30 text-xl font-light select-none">/</span>
      <span class="text-sm text-muted-foreground">Packages</span>
    </a>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Search form -->
    <form action="/search" method="GET" class="hidden sm:block">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          name="q"
          placeholder="Search packages…"
          class="h-9 w-52 rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 md:w-72 transition-all"
        />
      </div>
    </form>

    <!-- Nav links -->
    <nav class="flex items-center gap-2">
      <button
        type="button"
        on:click={toggleDark}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Toggle dark mode"
      >
        {#if dark}
          <Sun class="size-4" />
        {:else}
          <Moon class="size-4" />
        {/if}
      </button>
      <a
        href="https://meshlang.dev"
        target="_blank"
        rel="noopener"
        class="hidden md:flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground no-underline"
      >
        Docs
        <ExternalLink class="size-3 opacity-50" />
      </a>
      <a
        href="/publish"
        class="hidden md:flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 no-underline"
      >
        Publish
      </a>
    </nav>
  </div>
</header>

<main class="min-h-[calc(100vh-4rem-8rem)] bg-background">
  <slot />
</main>

<footer class="border-t border-border/40 bg-muted/30">
  <div class="mx-auto max-w-6xl px-4 py-12">
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
      <!-- Logo + tagline -->
      <div class="flex items-center gap-2.5">
        <span class="themed-logo opacity-40" aria-hidden="true">
          <img src="/logo-black.svg" alt="" class="themed-logo__light h-4 w-auto" />
          <img src="/logo-white.svg" alt="" class="themed-logo__dark h-4 w-auto" />
        </span>
        <span class="sr-only">Mesh</span>
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <span class="text-sm text-muted-foreground">Packages</span>
      </div>

      <!-- Links -->
      <div class="flex items-center gap-6 text-sm text-muted-foreground">
        <a href="https://meshlang.dev" target="_blank" rel="noopener" class="transition-colors hover:text-foreground no-underline">Docs</a>
        <a href="https://github.com/snowdamiz/mesh-lang" target="_blank" rel="noopener" class="transition-colors hover:text-foreground no-underline">GitHub</a>
        <a href="https://meshlang.dev/docs/tooling" target="_blank" rel="noopener" class="transition-colors hover:text-foreground no-underline">meshpkg</a>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-border/30 text-center">
      <p class="text-xs text-muted-foreground/70">
        Publish with <code class="font-mono text-muted-foreground">meshpkg publish</code> · Built for the Mesh programming language
      </p>
    </div>
  </div>
</footer>
