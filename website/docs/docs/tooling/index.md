---
title: Developer Tools
description: Formatter, REPL, package manager, LSP, and editor support for Mesh
---

# Developer Tools

Mesh ships with a complete developer toolchain built into the `meshc` binary. Everything you need for productive development -- formatting, interactive exploration, project management, and editor integration -- is available out of the box.

## Formatter

The Mesh formatter canonically formats your source code, enforcing a consistent style across your project:

```bash
meshc fmt main.mpl
```

To format all files in the current directory:

```bash
meshc fmt .
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

Use `meshc new` to scaffold a new project:

```bash
meshc new my_app
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

## Language Server (LSP)

Mesh includes a Language Server Protocol implementation that provides real-time feedback in your editor:

```bash
meshc lsp
```

This starts the language server on **stdin/stdout** using the **JSON-RPC** protocol (standard LSP transport). The server is built on the `tower-lsp` framework and provides:

### Features

| Feature | Description |
|---------|-------------|
| **Diagnostics** | Parse errors and type errors displayed inline as you type |
| **Hover** | Hover over any identifier to see its inferred type |
| **Go-to-definition** | Jump to the definition of any variable, function, or type |

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

The official Mesh extension for VS Code provides syntax highlighting, diagnostics, hover, and go-to-definition. The extension is located in the `tools/editors/vscode-mesh/` directory of the Mesh repository.

#### Features

- **Syntax highlighting** via a TextMate grammar that covers all Mesh keywords, operators, string interpolation, and comments
- **Language configuration** for bracket matching, auto-closing pairs, and automatic indentation of `do`/`end` blocks
- **LSP integration** that starts `meshc lsp` automatically and provides diagnostics, hover, and go-to-definition

#### Installation

To install the extension from source:

```bash
cd tools/editors/vscode-mesh
npm install
npm run compile
npm run package
code --install-extension mesh-lang-0.1.0.vsix
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
| Formatter | `meshc fmt [file]` | Canonically format Mesh source code |
| REPL | `meshc repl` | Interactive evaluation with LLVM JIT |
| Package Manager | `meshc new [name]` | Create a new Mesh project |
| Language Server | `meshc lsp` | LSP server for editor integration |
| VS Code Extension | -- | Syntax highlighting, diagnostics, hover, go-to-def |

## Next Steps

- [Language Basics](/docs/language-basics/) -- core language features and syntax
- [Distributed Actors](/docs/distributed/) -- building distributed systems with Mesh
