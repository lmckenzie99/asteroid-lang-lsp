# 🌌 Asteroid Language Server Protocol (LSP)

A comprehensive Language Server Protocol implementation for the [Asteroid programming language](https://asteroid-lang.readthedocs.io/), providing rich IDE support across multiple editors.
## Version 0.0.2a
## ✨ Features

### 🚀 Core LSP Features
- **Syntax Highlighting** - Full syntax highlighting for Asteroid code
- **Autocompletion** - Intelligent code completion with context awareness *work in progress*
- **Error Detection** - Real-time syntax error checking and reporting
- **Hover Information** - Type and definition info on hover *work in progress*
- **Go to Definition** - Jump to symbol definitions *work in progress*
- **Find References** - Find all uses of a symbol
- **Document Symbols** - Outline view of functions, structs, and variables
- **Workspace Symbols** - Search symbols across the entire workspace *work in progress*
- **Rename Refactoring** - Rename symbols with scope awareness *work in progress*

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
git clone https://github.com/lmckenzie99/asteroid-lang-lsp.git
cd asteroid-language-server
npm install
npm run build
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

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=lexer
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
