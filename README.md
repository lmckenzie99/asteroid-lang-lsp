# 🌌 Asteroid Language Server Protocol (LSP)

A comprehensive Language Server Protocol implementation for the [Asteroid programming language](https://asteroid-lang.readthedocs.io/), providing rich IDE support across multiple editors.
## Version 0.0.2a
## ✨ Features

### 🚀 Core LSP Features
- **Syntax Highlighting** - Full syntax highlighting for Asteroid code
- **Autocompletion** - Code completion with context awareness
- **Error Detection** - Real-time syntax error checking and reporting

- **Document Symbols** - Outline view of functions, structs, and variables
- **Workspace Symbols** - Search symbols across the entire workspace 
- **Rename Refactoring** - Rename symbols with scope awareness
- 
### 🚧 Roadmap
- **Intelligent Autocompletion** - Content aware smart suggestions
- **Enhanced error detection** - Some errors are not detected
- **Hover Information** - Type and definition info on hover 
- **Go to Definition** - Jump to symbol definitions 

### 🎯 Asteroid Language Support
- **Functions** - `function name with params do ... end`
- **Pattern Matching** - `match expr with pattern -> result end`
- **Structures** - `struct Name with constructor ... end`
- **Algebraic Data Types** - `data Color = Red | Green | Blue`
- **Variables** - `let name = value`
- **Module System** - `load system module`
- **Lambda Expressions** - `lambda x -> x + 1`
- **List Comprehensions** - `[x for x in list if condition]`
- **Comments** - Line comments with `--`

### 🔧 Editor Support
- **VS Code** - Full extension with syntax highlighting and IntelliSense *testing needed*
- **Neovim** - Complete LSP integration with nvim-lspconfig
- **Emacs** - Compatible with lsp-mode *testing needed*
- **Vim** - Works with vim-lsp and similar plugins

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **TypeScript** (for development)

### Installation Options

#### Option 1: Build from Source (***Currently Recommended***)
```bash
git clone https://github.com/lmckenzie99/asteroid-lang-lsp.git
cd asteroid-language-server
npm install
npm run build
```
#### Option 2: Global Installation (***WIP***)
```bash
npm install -g asteroid-language-server
```



## 📝 Editor Setup

### 🟦 VS Code

The VS Code extension lives in `editors/vscode/` and connects to the Asteroid LSP server that is built from the repository root. Because the extension references the server at `../../out/server.js`, the full repository must be present and built.

#### Prerequisites

| Requirement | Minimum version |
|-------------|-----------------|
| **Node.js** | >= 16.0.0 |
| **npm** | (bundled with Node) |
| **VS Code** | >= 1.75.0 |

#### Step 1 — Clone the repository

```bash
git clone https://github.com/lmckenzie99/asteroid-lang-lsp.git
cd asteroid-lang-lsp
```

#### Step 2 — Build the language server

```bash
npm install
npm run build
```

This compiles `src/server.ts` into `out/server.js`, which the extension will launch.

#### Step 3 — Build the extension

```bash
cd editors/vscode
npm install
npm run compile
```

This compiles the extension client (`src/extension.ts` → `out/extension.js`).

#### Step 4 — Install in VS Code

**Option A: Development Host (recommended for testing)**

1. Open the **repository root** in VS Code:
   ```bash
   code /path/to/asteroid-lang-lsp
   ```
2. Press **F5** (or **Run → Start Debugging**).
3. A new VS Code window (the *Extension Development Host*) will open with the Asteroid extension active.
4. Open any `.ast` or `.asteroid` file in that window to verify syntax highlighting, completions, and diagnostics are working.

**Option B: Package as a `.vsix` and install permanently**

Requires the `@vscode/vsce` CLI:
```bash
# Install vsce if you don't have it
npm install -g @vscode/vsce

# Package the extension (run from editors/vscode/)
cd editors/vscode
vsce package
# This produces a file like asteroid-lang-0.0.1.vsix

# Install the packaged extension
code --install-extension asteroid-lang-0.0.1.vsix
```

> **Note:** Because the extension resolves the language server relative to its
> own install location (`../../out/server.js`), the packaged `.vsix` approach
> works best when the extension is installed from within the cloned repository
> tree. If you move the repository after installing, you may need to reinstall.

#### What you get

| Feature | Description |
|---------|-------------|
| **Syntax highlighting** | Full TextMate grammar for all Asteroid constructs |
| **IntelliSense** | Completions for keywords, built-in functions, and document symbols |
| **Diagnostics** | Real-time error detection (e.g. `@println` usage, unterminated strings) |
| **Hover info** | Type and definition information on hover |
| **Go to Definition** | Jump to function, struct, and variable definitions |
| **Document Symbols** | Outline view of functions, structs, and variables |
| **Workspace Symbols** | Search symbols across all open Asteroid files |
| **Snippets** | 13 snippets for common patterns (`func`, `if`, `for`, `match`, etc.) |
| **Comment toggling** | `Ctrl+/` toggles `--` line comments |
| **Bracket matching** | Auto-close and matching for `()`, `[]`, `{}`, `""`, `''` |

#### Extension settings

These settings are available under **Settings → Asteroid Language**:

- `asteroid.maxNumberOfProblems` — Maximum number of diagnostics the server reports (default `100`).
- `asteroid.trace.server` — Trace level for LSP communication: `off` | `messages` | `verbose` (default `off`). Useful for debugging.

#### Troubleshooting

**Extension activates but no language features appear**
- Make sure the root language server is built (`npm run build` from the repo root). The extension expects `out/server.js` to exist two directories above `editors/vscode/`.
- Open **Output → Asteroid Language Server** in VS Code to check for errors.

**Syntax highlighting works but no completions / diagnostics**
- The TextMate grammar (syntax highlighting) is bundled with the extension and works independently. Completions and diagnostics require the LSP server to be running. Check the output panel for server startup errors.

**"Cannot find module" error in the output panel**
- Run `npm install` in both the repository root *and* `editors/vscode/` to ensure all dependencies are present.

**File not recognized as Asteroid**
- Ensure the file has a `.ast` or `.asteroid` extension. You can also set the language manually via the VS Code language mode selector in the bottom-right status bar.
### 🟩 Neovim
For Neovim with nvim-lspconfig:

```bash
# Install the LSP server
npm install -g asteroid-language-server

# Copy configuration files
cp -r editors/neovim/lua ~/.config/nvim/
```



### 🟧 Other Editors
### *testing needed*
- **Emacs**: Use with `lsp-mode` 
- **Vim**: Compatible with `vim-lsp` 
- **Sublime Text**: Works with LSP package 

## 🧪 Examples

### Basic Asteroid Code
```asteroid
-- Load system modules
load system io
load system math

-- Define a function with pattern matching
function factorial with n do
  match n with
    0 -> 1
    1 -> 1
    n -> n * factorial(n - 1)
  end
end

-- Print result
let result = factorial(5)
io.println("5! = " + str(result))
```

### Pattern Matching and Data Types
```asteroid
-- Define algebraic data types
data Shape = Circle with radius
           | Rectangle with width, height
           | Triangle with a, b, c

-- Pattern matching function
function area with shape do
  match shape with
    Circle with r -> math.pi * r * r
    Rectangle with w, h -> w * h
    Triangle with a, b, c -> 
      let s = (a + b + c) / 2.0
      math.sqrt(s * (s-a) * (s-b) * (s-c))
  end
end

-- Usage
let shapes = [Circle(5.0), Rectangle(10, 20), Triangle(3, 4, 5)]
for shape in shapes do
  io.println("Area: " + str(area(shape)))
end
```

### Advanced Features
```asteroid
-- Struct with methods
struct Point with
  constructor Point with x, y do
    let @x = x
    let @y = y
  end
  
  function distance with other do
    let dx = @x - other@x
    let dy = @y - other@y
    math.sqrt(dx*dx + dy*dy)
  end
  
  function translate with dx, dy do
    Point(@x + dx, @y + dy)
  end
end

-- Lambda and list comprehensions
let points = [Point(i, i*2) for i in range(1, 6)]
let distances = map(lambda p -> p.distance(Point(0, 0)), points)
```


## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/lmckenzie99/asteroid-lang-lsp.git
cd asteroid-language-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run watch
```


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/CONTRIBUTING.md) for details.

### Quick Contribution Setup
```bash
# Fork and clone the repo
git clone https://github.com/your-username/asteroid-language-server.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and test
npm test

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### Areas for Contribution
- 🐛 Bug fixes and improvements
- ✨ New LSP features
- 📚 Documentation improvements
- 🧪 Test coverage expansion
- 🎨 Editor integrations
- 🚀 Performance optimizations

## 🐛 Troubleshooting

### Common Issues

**LSP server not starting?**
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Verify installation
which asteroid-language-server

# Check server manually
asteroid-language-server --stdio
```

**No completions in editor?**
- Verify LSP client is installed and configured
- Check if Asteroid files are detected correctly
- Enable LSP debug logging to diagnose issues

**Syntax highlighting not working?**
- Ensure file extensions are registered (`.ast`, `.asteroid`)
- Check editor-specific syntax configuration
- Verify TextMate grammar is loaded

### Debug Mode
Enable debug logging by setting environment variables:
```bash
export ASTEROID_LSP_DEBUG=true
export ASTEROID_LSP_LOG_LEVEL=verbose
```

## 📝 Issue Tracking:  
- Sytax such as ( ) missing from string literals throws an error -- not necessary
- Autocompletion is not context aware in most scenarios
- Hover information is incomplete for certain constructs
- Some edge cases in pattern matching are not handled


## 📄 License

This project is licensed under the MIT License 

## 🙏 Acknowledgments

- [Asteroid Language](https://asteroid-lang.readthedocs.io/) - The amazing language this LSP supports
- [Microsoft LSP](https://microsoft.github.io/language-server-protocol/) - Language Server Protocol specification
- [VS Code Language Server](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) - Extension development guides
- [TypeScript LSP Example](https://github.com/microsoft/vscode-extension-samples) - Reference implementations

## 🔗 Links

- [Asteroid Language Documentation](https://asteroid-lang.readthedocs.io/)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Neovim LSP Documentation](https://neovim.io/doc/user/lsp.html)

---

<div align="center">

**[⬆ Back to Top](#-asteroid-language-server-protocol-lsp)**

</div>
