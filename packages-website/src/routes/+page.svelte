<script>
  import { onMount } from 'svelte';
  import { Download, Package } from 'lucide-svelte';
  export let data;

  let cards = [];
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.08 }
    );
    cards.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  });
</script>

<!-- Hero section -->
<section class="border-b border-border bg-background py-16 sm:py-20">
  <div class="mx-auto max-w-6xl px-4 text-center">
    <div class="text-xs font-mono uppercase tracking-widest text-muted-foreground">Registry</div>
    <h1 class="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
      Mesh Packages
    </h1>
    <p class="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
      Community packages for the Mesh programming language.
    </p>
    {#if !data.error && data.packages.length > 0}
      <p class="mt-2 text-sm text-muted-foreground font-mono">
        {data.packages.length} package{data.packages.length === 1 ? '' : 's'} published
      </p>
    {/if}
    <!-- Hero search form for mobile (nav search hidden on small screens) -->
    <form action="/search" method="GET" class="mt-8 flex items-center justify-center gap-2 sm:hidden">
      <input
        name="q"
        placeholder="Search packages..."
        class="h-10 w-full max-w-xs rounded-md border border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
      />
      <button type="submit" class="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-primary-foreground shrink-0">
        Search
      </button>
    </form>
  </div>
</section>

<!-- Package grid section -->
<section class="py-12 sm:py-16">
  <div class="mx-auto max-w-6xl px-4">
    {#if data.error}
      <div class="rounded-xl border border-border bg-card p-8 text-center">
        <p class="text-muted-foreground">{data.error}</p>
      </div>
    {:else if data.packages.length === 0}
      <div class="rounded-xl border border-border bg-card p-12 text-center">
        <Package class="mx-auto size-10 text-muted-foreground mb-4" />
        <h2 class="text-lg font-semibold text-foreground">No packages yet</h2>
        <p class="mt-2 text-sm text-muted-foreground">Be the first to publish a Mesh package.</p>
        <a href="https://meshlang.dev/docs/tooling" class="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground no-underline">
          Learn meshpkg
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.packages as pkg, i}
          <a
            href="/packages/{pkg.name}"
            bind:this={cards[i]}
            class="reveal reveal-delay-{Math.min(i % 3 + 1, 4)} block rounded-xl border border-foreground/10 bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg no-underline"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="text-base font-bold text-foreground leading-tight">{pkg.name}</span>
              <span class="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                v{pkg.version}
              </span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {pkg.description || 'No description provided.'}
            </p>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>
