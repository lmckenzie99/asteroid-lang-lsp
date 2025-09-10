# 🌌 Asteroid Language Server Protocol (LSP)

A comprehensive Language Server Protocol implementation for the [Asteroid programming language](https://asteroid-lang.readthedocs.io/), providing rich IDE support across multiple editors.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)]()

## ✨ Features

### 🚀 Core LSP Features
- **Syntax Highlighting** - Full syntax highlighting for Asteroid code
- **Autocompletion** - Intelligent code completion with context awareness
- **Error Detection** - Real-time syntax error checking and reporting  
- **Hover Information** - Type and definition info on hover
- **Go to Definition** - Jump to symbol definitions
- **Find References** - Find all uses of a symbol
- **Document Symbols** - Outline view of functions, structs, and variables
- **Workspace Symbols** - Search symbols across the entire workspace
- **Rename Refactoring** - Rename symbols with scope awareness

### 🎯 Asteroid Language Support
- **Functions** - `function name with params do ... end`
- **Pattern Matching** - `match expr with pattern -> result end`
- **Structures** - `struct Name with constructor ... end`
- **Algebraic Data Types** - `data Color = Red | Green | Blue`
- **Variables** - `let name = value`
- **Module System** - `load system module`
- **Lambda Expressions** - `lambda x -> x + 1`
- **List Comprehensions** - `[x for x in list if condition]`
- **Comments** - Line comments with `%`

### 🔧 Editor Support
- **VS Code** - Full extension with syntax highlighting and IntelliSense
- **Neovim** - Complete LSP integration with nvim-lspconfig
- **Emacs** - Compatible with lsp-mode
- **Vim** - Works with vim-lsp and similar plugins

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **TypeScript** (for development)

### Installation Options

#### Option 1: Global Installation (Recommended)
```bash
npm install -g asteroid-language-server
```

#### Option 2: Build from Source
```bash
git clone https://github.com/your-username/asteroid-language-server.git
cd asteroid-language-server
npm install
npm run build
```

#### Option 3: Quick Setup Script
```bash
curl -sSL https://raw.githubusercontent.com/your-username/asteroid-language-server/main/scripts/install-global.sh | bash
```

## 📝 Editor Setup

### 🟦 VS Code
The easiest way to get started with Asteroid in VS Code:

```bash
# Install the extension
cd editors/vscode
npm install
npm run compile
code --install-extension .
```

Or follow the detailed [VS Code setup guide](./editors/vscode/README.md).

### 🟩 Neovim
For Neovim with nvim-lspconfig:

```bash
# Install the LSP server
npm install -g asteroid-language-server

# Copy configuration files
cp -r editors/neovim/lua ~/.config/nvim/
```

See the complete [Neovim setup guide](./editors/neovim/README.md) for detailed instructions.

### 🟧 Other Editors
- **Emacs**: Use with `lsp-mode` - see [configuration example](./docs/editors/emacs.md)
- **Vim**: Compatible with `vim-lsp` - see [setup guide](./docs/editors/vim.md)
- **Sublime Text**: Works with LSP package - see [instructions](./docs/editors/sublime.md)

## 🧪 Examples

### Basic Asteroid Code
```asteroid
% Load system modules
load system io
load system math

% Define a function with pattern matching
function factorial with n do
  match n with
    0 -> 1
    1 -> 1
    n -> n * factorial(n - 1)
  end
end

% Print result
let result = factorial(5)
io.println("5! = " + str(result))
```

### Pattern Matching and Data Types
```asteroid
% Define algebraic data types
data Shape = Circle with radius
           | Rectangle with width, height
           | Triangle with a, b, c

% Pattern matching function
function area with shape do
  match shape with
    Circle with r -> math.pi * r * r
    Rectangle with w, h -> w * h
    Triangle with a, b, c -> 
      let s = (a + b + c) / 2.0
      math.sqrt(s * (s-a) * (s-b) * (s-c))
  end
end

% Usage
let shapes = [Circle(5.0), Rectangle(10, 20), Triangle(3, 4, 5)]
for shape in shapes do
  io.println("Area: " + str(area(shape)))
end
```

### Advanced Features
```asteroid
% Struct with methods
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

% Lambda and list comprehensions
let points = [Point(i, i*2) for i in range(1, 6)]
let distances = map(lambda p -> p.distance(Point(0, 0)), points)
```

See more examples in the [`examples/`](./examples/) directory.

## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/your-username/asteroid-language-server.git
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

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=lexer
```

### Project Structure
```
src/
├── server.ts              # Main LSP server implementation
├── lexer/                 # Tokenization logic
├── parser/                # AST construction
├── analyzer/              # Semantic analysis
└── providers/             # LSP feature providers

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── fixtures/              # Test data
```

## 📊 Features Matrix

| Feature | Status | VS Code | Neovim | Emacs | Vim |
|---------|--------|---------|--------|-------|-----|
| Syntax Highlighting | ✅ | ✅ | ✅ | ✅ | ✅ |
| Autocompletion | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diagnostics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hover Info | ✅ | ✅ | ✅ | ✅ | ✅ |
| Go to Definition | ✅ | ✅ | ✅ | ✅ | ✅ |
| Find References | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rename | ✅ | ✅ | ✅ | ✅ | ✅ |
| Document Symbols | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workspace Symbols | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Actions | 🚧 | 🚧 | 🚧 | 🚧 | 🚧 |
| Formatting | 🚧 | 🚧 | 🚧 | 🚧 | 🚧 |

**Legend**: ✅ Implemented | 🚧 In Progress | ❌ Not Available

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

## 📚 Documentation

- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [API Documentation](./docs/API.md)
- [Changelog](./docs/CHANGELOG.md)
- [VS Code Extension Guide](./editors/vscode/README.md)
- [Neovim Setup Guide](./editors/neovim/README.md)

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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

Made with ❤️ for the Asteroid programming language community

</div>