# Slug module — URL-safe slug generation for Mesh.
#
# API:
#   Slug.slugify(str)          -> String  (default separator: "-")
#   Slug.slugify(str, sep)     -> String  (custom separator)
#   Slug.truncate(slug, max)   -> String  (cut at last separator boundary)
#   Slug.is_valid(slug)        -> Bool    (true if already a valid slug)
#
# IMPLEMENTATION NOTES:
# - Case arm bodies must appear on the same line as the -> arrow (Mesh parser limitation).
# - Nested if...do...else...end expressions work inside function call arguments.
# - Mutual recursion between top-level functions is not supported (single-pass typechecker).
# - List.filter lambdas use fn(p) -> expr end syntax (no type annotation on lambda args).

# Private: core slug generation using the given separator.
# Strategy:
#   1. Lowercase the input.
#   2. Regex.replace all sequences of non-alphanumeric chars with sep.
#   3. Split on sep, filter out empty parts, rejoin.
#      This handles leading/trailing/consecutive separators in one pass.
fn slugify_core(str :: String, sep :: String) -> String do
  let lower = String.to_lower(str)
  let replaced = Regex.replace(~r/[^a-z0-9]+/, lower, sep)
  let parts = String.split(replaced, sep)
  let non_empty = List.filter(parts, fn(p) -> String.length(p) > 0 end)
  String.join(non_empty, sep)
end

# Convert a string to a URL-safe slug using the default "-" separator.
# Lowercases, replaces non-alphanumeric chars with "-", collapses
# consecutive separators, and strips leading/trailing separators.
#
# Examples:
#   slugify("Hello World!") -> "hello-world"
#   slugify("")             -> ""
#   slugify("!!!")          -> ""
pub fn slugify(str :: String) -> String do
  slugify_core(str, "-")
end

# Convert a string to a URL-safe slug using a custom separator.
#
# Examples:
#   slugify("Hello World!", "_")  -> "hello_world"
#   slugify("Hello World!", "--") -> "hello--world"
pub fn slugify(str :: String, sep :: String) -> String do
  slugify_core(str, sep)
end

# Private: recursively accumulate words into a slug up to max characters.
# candidate = acc <> "-" <> word (or just word when acc is empty).
# If adding the next word would exceed max characters, stop and return acc.
# Case arm body must be on the same line as -> due to Mesh parser constraints.
fn accumulate_words(parts :: List<String>, max :: Int, acc :: String) -> String do
  case parts do
    word :: rest -> if String.length(if String.length(acc) == 0 do word else acc <> "-" <> word end) > max do acc else accumulate_words(rest, max, if String.length(acc) == 0 do word else acc <> "-" <> word end) end
    _ -> acc
  end
end

# Truncate a slug to at most max characters, cutting at the last separator
# boundary so the result never ends mid-word.
#
# Examples:
#   truncate("hello-world-foo", 11) -> "hello-world"
#   truncate("hello-world-foo", 15) -> "hello-world-foo"
#   truncate("hello-world-foo", 5)  -> "hello"
#   truncate("", 10)               -> ""
pub fn truncate(slug :: String, max :: Int) -> String do
  if String.length(slug) <= max do
    slug
  else
    let parts = String.split(slug, "-")
    accumulate_words(parts, max, "")
  end
end

# Return true if the string is already a valid slug: lowercase alphanumeric
# and hyphens only, no leading/trailing/consecutive hyphens, non-empty.
#
# Pattern: ^[a-z0-9]+(-[a-z0-9]+)*$
#   - One or more alphanumeric chars
#   - Optionally followed by groups of (hyphen + one or more alphanumeric)
#   - No leading/trailing hyphens, no consecutive hyphens
#
# Examples:
#   is_valid("hello-world") -> true
#   is_valid("hello")       -> true
#   is_valid("hello123")    -> true
#   is_valid("")            -> false
#   is_valid("-hello")      -> false
#   is_valid("hello--world") -> false
pub fn is_valid(slug :: String) -> Bool do
  if String.length(slug) == 0 do
    false
  else
    Regex.is_match(~r/^[a-z0-9]+(-[a-z0-9]+)*$/, slug)
  end
end
