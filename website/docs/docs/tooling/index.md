---
title: Developer Tools
description: Formatter, REPL, package manager, LSP, and editor support for Mesh
---

# Developer Tools

Mesh ships with a complete developer toolchain built into the `meshc` binary. Everything you need for productive development -- formatting, interactive exploration, project management, and editor integration -- is available out of the box.

> **Production backend proof:** This page documents the tools individually. For the named backend proof commands that tie `meshc fmt`, `meshc test`, staged deploy smoke, and doc-truth verification together, start with [Production Backend Proof](/docs/production-backend-proof/) and `reference-backend/README.md`.

## Formatter

The Mesh formatter canonically formats your source code, enforcing a consistent style across your project:

```bash
meshc fmt main.mpl
```

To format a project directory:

```bash
meshc fmt .
```

To fail fast in CI or before committing if any file would change:

```bash
meshc fmt --check reference-backend
```

The formatter uses the **Wadler-Lindig** pretty-printing algorithm with a CST-based approach. This means:

- **Comments are preserved** -- the formatter works on the concrete syntax tree, so comments stay exactly where you put them
- **Whitespace and indentation are rewritten** canonically according to Mesh style conventions
- **Formatting is idempotent** -- running the formatter twice produces the same output as running it once

### Example

Before formatting:

```mesh
fn add(a,b) do
a+b
end
```

After `meshc fmt`:

```mesh
fn add(a, b) do
  a + b
end
```

### Format on Save

Most editors can be configured to run the formatter automatically when you save a file. In VS Code with the Mesh extension, the language server handles formatting. For other editors, configure your format-on-save command to run `meshc fmt <file>`.

## REPL

The Mesh REPL (Read-Eval-Print Loop) provides interactive exploration with full language support:

```bash
meshc repl
```

This starts an interactive session where you can evaluate expressions, define functions, and explore the language:

```
mesh> 1 + 2
3 :: Int

mesh> let name = "Mesh"
"Mesh" :: String

mesh> fn double(x) do
  ...   x * 2
  ... end
Defined: double :: (Int) -> Int

mesh> double(21)
42 :: Int
```

The REPL uses **LLVM JIT compilation** under the hood, running the full compiler pipeline (parse, typecheck, MIR, LLVM IR) for every expression. This means REPL behavior is identical to compiled code -- there are no interpreter-specific quirks.

### REPL Commands

| Command | Shorthand | Description |
|---------|-----------|-------------|
| `:help` | `:h` | Show available commands |
| `:type <expr>` | `:t` | Show the inferred type without evaluating |
| `:quit` | `:q` | Exit the REPL |
| `:clear` | | Clear the screen |
| `:reset` | | Reset session (clear all definitions and history) |
| `:load <file>` | | Load and evaluate a Mesh source file |

### Multi-line Input

The REPL automatically detects incomplete input. If you open a `do` block without closing it with `end`, the REPL switches to continuation mode (shown by `...`) until all blocks are balanced:

```
mesh> fn greet(name) do
  ...   println("Hello, ${name}!")
  ... end
Defined: greet :: (String) -> Unit

mesh> greet("world")
Hello, world!
```

## Package Manager

Mesh includes a built-in package manager for creating and managing projects.

### Creating a New Project

Use `meshc init` to scaffold a new project:

```bash
meshc init my_app
```

This creates the following structure:

```
my_app/
  mesh.toml
  main.mpl
```

The generated `main.mpl` contains a minimal hello-world program:

```mesh
fn main() do
  IO.puts("Hello from Mesh!")
end
```

### Project Manifest

Every Mesh project has a `mesh.toml` file that describes the package and its dependencies:

```toml
[package]
name = "my_app"
version = "0.1.0"

[dependencies]
```

The manifest supports both **git** and **path** dependencies:

```toml
[dependencies]
my_lib = { path = "../my_lib" }
some_pkg = { git = "https://github.com/user/some_pkg", tag = "v1.0.0" }
```

Git dependencies support `rev`, `branch`, and `tag` specifiers for pinning to a specific version.

### Lockfile

When dependencies are resolved, a lockfile (`mesh.lock`) is generated to ensure reproducible builds. The lockfile records the exact version and source of every dependency in the project.

## Test Runner

Run all `*.test.mpl` files from a project root, a tests directory, or a specific test file with `meshc test`:

```bash
meshc test reference-backend
meshc test reference-backend/tests
meshc test reference-backend/tests/config.test.mpl
```

The test runner discovers all files ending in `.test.mpl` under the requested target, compiles and executes each independently, and prints a per-test pass/fail summary:

```
test arithmetic is correct ... ok
test string operations/length ... FAIL
  assert_eq failed: expected 5, got 6

2 tests, 1 failure
```

Exit code is non-zero if any test fails, making `meshc test` suitable for CI pipelines.

Coverage requests are intentionally honest today:

```bash
meshc test --coverage reference-backend
```

`--coverage` currently exits non-zero with an explicit unsupported message instead of claiming a stub report.

See the [Testing guide](/docs/testing/) for the full assertion API, grouping, mock actors, and receive expectations.

## meshpkg — Package Registry CLI

The `meshpkg` binary provides commands for publishing and consuming packages from the Mesh package registry.

### Authentication

Log in to the registry to store an API token locally:

```bash
meshpkg login
```

Credentials are stored in `~/.mesh/credentials`.

### Publishing a Package

Publish the current directory as a package:

```bash
meshpkg publish
```

This reads `mesh.toml`, creates a `.tar.gz` tarball, computes the SHA-256 checksum, and uploads to the registry. Publishing the same name+version twice is rejected (HTTP 409).

### Installing a Package

Install a package from the registry into the current project:

```bash
meshpkg install some_pkg
```

This downloads the latest version, verifies its SHA-256 checksum, and extracts it into the project's dependency directory. A `mesh.lock` lockfile is updated to pin the exact version.

### Searching

Search the registry by name or keyword:

```bash
meshpkg search json
```

Returns matching package names and descriptions.

### mesh.toml with Registry Dependencies

Declare registry dependencies in `mesh.toml`:

```toml
[package]
name = "my_app"
version = "1.0.0"
description = "A Mesh application"
license = "MIT"

[dependencies]
some_pkg = "1.0.0"                                           # registry: exact version
my_lib = { path = "../my_lib" }                              # local path
utils = { git = "https://github.com/user/utils", tag = "v1.0.0" }  # git
```

Browse and search available packages at [packages.meshlang.dev](https://packages.meshlang.dev).

## Language Server (LSP)

Mesh includes a Language Server Protocol implementation that provides real-time feedback in your editor:

```bash
meshc lsp
```

This starts the language server on **stdin/stdout** using the **JSON-RPC** protocol (standard LSP transport). The server is built on the `tower-lsp` framework and provides:

### Features

The transport-level regression suite for `meshc lsp` now exercises these editor-facing behaviors against `reference-backend/` over real stdio JSON-RPC:

| Feature | Description |
|---------|-------------|
| **Diagnostics** | Parse errors and type errors displayed inline as you type |
| **Hover** | Hover over identifiers to see inferred type information |
| **Go-to-definition** | Jump to definitions within backend-shaped project code |
| **Document formatting** | Format the current document through the same formatter used by `meshc fmt` |
| **Signature help** | Parameter hints for function calls, including active-parameter tracking |

The language server runs the full Mesh compiler pipeline (lexer, parser, type checker) on every keystroke, so diagnostics are always accurate and up to date.

### Configuration

The LSP server is configured through your editor's settings. In VS Code, the Mesh extension handles starting the server automatically. For other editors that support LSP (Neovim, Emacs, Helix, Zed), configure the language server command as:

```json
{
  "command": "meshc",
  "args": ["lsp"]
}
```

## Editor Support

### VS Code

The official Mesh extension for VS Code provides syntax highlighting plus the `meshc lsp` features that now have transport-level proof on `reference-backend/`: diagnostics, hover, go-to-definition, document formatting, and signature help. The extension is located in the `tools/editors/vscode-mesh/` directory of the Mesh repository.

#### Features

- **Syntax highlighting** via a TextMate grammar that covers Mesh keywords, operators, string interpolation, and comments
- **Language configuration** for bracket matching, auto-closing pairs, and automatic indentation of `do`/`end` blocks
- **Verified LSP integration** that starts `meshc lsp` automatically and exposes diagnostics, hover, go-to-definition, document formatting, and signature help

#### Installation

To build and install the current packaged extension from source:

```bash
cd tools/editors/vscode-mesh
npm install
npm run compile
npm run package
code --install-extension mesh-lang-0.3.0.vsix
```

For repeat local installs, you can also run:

```bash
npm run install-local
```

Or open the `tools/editors/vscode-mesh/` folder in VS Code and press F5 to launch an Extension Development Host with the extension loaded.

#### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mesh.lsp.path` | `"meshc"` | Path to the `meshc` binary (must be in PATH, or provide an absolute path) |

### Other Editors

For editors that support TextMate grammars (Sublime Text, Atom, etc.), the grammar file at `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` can be used directly for syntax highlighting.

For editors that support LSP (Neovim, Emacs, Helix, Zed), configure `meshc lsp` as the language server command. The server communicates via stdin/stdout using standard JSON-RPC.

## Tool Summary

| Tool | Command | Description |
|------|---------|-------------|
| Formatter | `meshc fmt [path]` | Canonically format Mesh source code or use `--check` in CI |
| REPL | `meshc repl` | Interactive evaluation with LLVM JIT |
| Package Manager | `meshc init [name]` | Create a new Mesh project |
| Test Runner | `meshc test [path]` | Run `*.test.mpl` files from a project root, tests directory, or specific test file |
| Package CLI | `meshpkg <command>` | Publish, install, and search registry packages |
| Language Server | `meshc lsp` | JSON-RPC LSP server for diagnostics, hover, formatting, navigation, and signature help |
| VS Code Extension | -- | Syntax highlighting plus verified Mesh LSP editor integration |

## Next Steps

- [Testing](/docs/testing/) -- write and run tests with `meshc test`
- [Standard Library](/docs/stdlib/) -- Crypto, Encoding, and DateTime modules
- [Language Basics](/docs/language-basics/) -- core language features and syntax
- [Distributed Actors](/docs/distributed/) -- building distributed systems with Mesh
