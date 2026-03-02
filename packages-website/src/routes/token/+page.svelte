<script>
  import { onMount } from 'svelte';
  import { Copy, Check, AlertTriangle } from 'lucide-svelte';

  let token = '';
  let login = '';
  let tokenCopied = false;
  let cmdCopied = false;

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    token = params.get('value') || '';
    login = params.get('login') || '';
    // Remove token from URL so it doesn't linger in browser history
    if (token) {
      history.replaceState({}, '', window.location.pathname);
    }
  });

  function copyToken() {
    navigator.clipboard.writeText(token);
    tokenCopied = true;
    setTimeout(() => tokenCopied = false, 2000);
  }

  function copyCmd() {
    navigator.clipboard.writeText(`meshpkg login --token ${token}`);
    cmdCopied = true;
    setTimeout(() => cmdCopied = false, 2000);
  }
</script>

<svelte:head>
  <title>Your publish token — Mesh Packages</title>
</svelte:head>

<section class="border-b border-border bg-background py-16 sm:py-20">
  <div class="mx-auto max-w-xl px-4 text-center">
    {#if token}
      <div class="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ready to publish</div>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Your publish token{#if login}, <span class="text-muted-foreground">{login}</span>{/if}
      </h1>
      <p class="mx-auto mt-3 text-sm text-muted-foreground">
        Copy it now — this token will not be shown again.
      </p>
    {:else}
      <div class="text-xs font-mono uppercase tracking-widest text-muted-foreground">No token found</div>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-foreground">
        Nothing to show here
      </h1>
      <p class="mx-auto mt-3 text-sm text-muted-foreground">
        To get a publish token, sign in via the <a href="/publish" class="text-foreground underline underline-offset-2">publish page</a>.
      </p>
    {/if}
  </div>
</section>

{#if token}
<section class="py-12 sm:py-16">
  <div class="mx-auto max-w-xl px-4 space-y-6">

    <!-- Warning banner -->
    <div class="flex items-start gap-3 rounded-md border border-border bg-muted px-4 py-3">
      <AlertTriangle class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        Save this token — it cannot be retrieved later. If you lose it, sign in again to create a new one.
      </p>
    </div>

    <!-- Token box -->
    <div>
      <div class="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Publish token</div>
      <div class="flex items-center gap-2">
        <pre class="flex-1 overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground">{token}</pre>
        <button
          on:click={copyToken}
          class="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Copy token"
        >
          {#if tokenCopied}
            <Check class="size-4" />
          {:else}
            <Copy class="size-4" />
          {/if}
        </button>
      </div>
    </div>

    <!-- Login command -->
    <div>
      <div class="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Save to meshpkg</div>
      <div class="flex items-center gap-2">
        <pre class="flex-1 overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground">meshpkg login --token {token}</pre>
        <button
          on:click={copyCmd}
          class="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Copy command"
        >
          {#if cmdCopied}
            <Check class="size-4" />
          {:else}
            <Copy class="size-4" />
          {/if}
        </button>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        Run this in your terminal to save the token. Then use <code class="font-mono">meshpkg publish</code> from your package directory.
      </p>
    </div>

    <!-- Back link -->
    <div class="border-t border-border pt-6 text-center">
      <a href="/publish" class="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
        Publishing guide
      </a>
      <span class="mx-3 text-border">·</span>
      <a href="/" class="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
        Browse packages
      </a>
    </div>

  </div>
</section>
{/if}
