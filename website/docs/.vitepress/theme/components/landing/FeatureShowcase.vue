<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHighlighter, highlightCode } from '@/composables/useShiki'
import { useScrollReveal } from '@/composables/useScrollReveal'

interface Feature {
  number: string
  title: string
  description: string
  filename: string
  code: string
}

const features: Feature[] = [
  {
    number: '01',
    title: 'Lightweight Actors',
    description:
      'Spawn millions of lightweight actors with crash isolation and supervision trees. Each actor has its own heap and message queue.',
    filename: 'actors.mpl',
    code: `service Counter do
  fn init(n :: Int) -> Int do n end

  call Increment() :: Int do |count|
    (count + 1, count + 1)
  end

  call GetCount() :: Int do |count|
    (count, count)
  end

  cast Reset() do |_count|
    0
  end
end

let pid = Counter.start(0)
Counter.increment(pid)
let count = Counter.get_count(pid)`,
  },
  {
    number: '02',
    title: 'Pattern Matching',
    description:
      'First-class pattern matching with exhaustiveness checking. Destructure any value — structs, tuples, sum types, lists.',
    filename: 'patterns.mpl',
    code: `fn describe(value) do
  case value do
    0 -> "zero"
    n when n > 0 -> "positive"
    n when n < 0 -> "negative"
  end
end

fn process(result) do
  case result do
    Ok(value) -> println("Got: \#{value}")
    Err(msg) -> println("Error: \#{msg}")
  end
end`,
  },
  {
    number: '03',
    title: 'Type Inference',
    description:
      'Hindley-Milner type inference means you rarely write type annotations. The compiler catches errors at compile time.',
    filename: 'types.mpl',
    code: `# Types are inferred -- no annotations needed
let name = "Mesh"
let numbers = [1, 2, 3, 4, 5]
let doubled = numbers
  |> List.map(fn(n) do n * 2 end)
  |> List.filter(fn(n) do n > 4 end)

# Structs with inferred field types
struct User do
  name :: String
  age :: Int
end

let user = User { name: "Alice", age: 30 }`,
  },
  {
    number: '04',
    title: 'Pipe Operators',
    description:
      'Chain transformations naturally with the pipe operator. Use |N> to route values to any argument position — both read left to right.',
    filename: 'pipes.mpl',
    code: `let result = "hello world"
  |> String.split(" ")
  |> List.map(fn(word) do
    String.to_upper(word)
  end)
  |> String.join(", ")

# result == "HELLO, WORLD"

# Slot pipe: route value to any position
fn insert_at(prefix, word, suffix) do
  prefix <> word <> suffix
end

let tagged = "mesh" |2> insert_at("[", "]")
# tagged == "[mesh]"`,
  },
]

const highlighted = ref<Record<number, string>>({})
const { observe } = useScrollReveal()
const rows = ref<HTMLElement[]>([])

onMounted(async () => {
  rows.value.forEach((el) => {
    if (el) observe(el)
  })

  try {
    const hl = await getHighlighter()
    features.forEach((feature, index) => {
      highlighted.value[index] = highlightCode(hl, feature.code)
    })
  } catch {
    // Highlighting failed -- raw code fallback remains visible
  }
})
</script>

<template>
  <section class="border-t border-border py-20 md:py-28">
    <div class="mx-auto max-w-6xl px-4">
      <!-- Section header -->
      <div class="text-center">
        <div class="text-sm font-mono uppercase tracking-widest text-muted-foreground">Features</div>
        <h2 class="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          What makes Mesh special
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          A language designed for building reliable, concurrent systems with minimal boilerplate.
        </p>
      </div>

      <!-- Feature rows -->
      <div class="mt-16 space-y-20 md:space-y-28">
        <div
          v-for="(feature, index) in features"
          :key="feature.title"
          :ref="(el) => { if (el) rows[index] = el as HTMLElement }"
          class="reveal grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <!-- Text -->
          <div :class="{ 'lg:order-last': index % 2 === 1 }">
            <div class="font-mono text-sm font-semibold text-muted-foreground">{{ feature.number }}</div>
            <h3 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {{ feature.title }}
            </h3>
            <p class="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {{ feature.description }}
            </p>
          </div>

          <!-- Code block -->
          <div class="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <!-- Terminal chrome -->
            <div class="flex items-center gap-2 border-b border-border px-4 py-3">
              <div class="flex gap-1.5">
                <div class="size-3 rounded-full" style="background: #ff5f57;" />
                <div class="size-3 rounded-full" style="background: #febc2e;" />
                <div class="size-3 rounded-full" style="background: #28c840;" />
              </div>
              <span class="ml-2 text-xs text-muted-foreground font-medium">{{ feature.filename }}</span>
            </div>
            <div
              v-if="highlighted[index]"
              v-html="highlighted[index]"
              class="vp-code [&_pre]:p-5 [&_pre]:!bg-transparent [&_pre]:text-sm [&_pre]:leading-relaxed"
            />
            <pre
              v-else
              class="overflow-x-auto p-5 text-sm leading-relaxed text-foreground font-mono"
            ><code>{{ feature.code }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
