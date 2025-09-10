"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create connection and text document manager
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
// Asteroid language tokens and keywords
const KEYWORDS = [
    'and', 'assert', 'break', 'catch', 'class', 'constructor', 'data', 'do', 'elif', 'else',
    'end', 'escape', 'eval', 'false', 'for', 'function', 'global', 'if', 'in', 'is',
    'lambda', 'let', 'load', 'loop', 'match', 'module', 'none', 'nonlocal', 'not', 'or',
    'return', 'step', 'struct', 'system', 'throw', 'to', 'true', 'try', 'unload', 'until',
    'while', 'with', 'yield'
];
const BUILTIN_FUNCTIONS = [
    'abs', 'all', 'any', 'apply', 'bool', 'call', 'chr', 'cmp', 'dict', 'enumerate',
    'filter', 'float', 'format', 'freeze', 'frozenset', 'hash', 'help', 'id', 'int',
    'isinstance', 'issubclass', 'iter', 'len', 'list', 'map', 'max', 'min', 'ord',
    'println', 'range', 'reduce', 'repr', 'reverse', 'round', 'set', 'sorted', 'str',
    'sum', 'tuple', 'type', 'zip'
];
const SYSTEM_MODULES = ['io', 'math', 'os', 'random', 'string', 'time', 'util'];
const documentInfos = new Map();
// Initialize the server
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '@', ' ']
            },
            hoverProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// Lexer for basic tokenization
class AsteroidLexer {
    constructor(text) {
        this.pos = 0;
        this.line = 0;
        this.column = 0;
        this.text = text;
    }
    peek() {
        return this.pos < this.text.length ? this.text[this.pos] : '';
    }
    advance() {
        if (this.text[this.pos] === '\n') {
            this.line++;
            this.column = 0;
        }
        else {
            this.column++;
        }
        this.pos++;
    }
    skipWhitespace() {
        while (this.peek() && /\s/.test(this.peek())) {
            this.advance();
        }
    }
    skipComment() {
        if (this.peek() === '%') {
            while (this.peek() && this.peek() !== '\n') {
                this.advance();
            }
        }
    }
    readString() {
        const quote = this.peek();
        this.advance(); // skip opening quote
        let value = '';
        let valid = true;
        while (this.peek() && this.peek() !== quote) {
            if (this.peek() === '\\') {
                this.advance(); // skip escape
                if (this.peek()) {
                    value += this.peek();
                    this.advance();
                }
            }
            else {
                value += this.peek();
                this.advance();
            }
        }
        if (this.peek() === quote) {
            this.advance(); // skip closing quote
        }
        else {
            valid = false; // unterminated string
        }
        return { value, valid };
    }
    readNumber() {
        let value = '';
        while (this.peek() && /[\d.]/.test(this.peek())) {
            value += this.peek();
            this.advance();
        }
        return value;
    }
    readIdentifier() {
        let value = '';
        while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.peek();
            this.advance();
        }
        return value;
    }
    tokenize() {
        const tokens = [];
        while (this.pos < this.text.length) {
            this.skipWhitespace();
            this.skipComment();
            if (this.pos >= this.text.length)
                break;
            const startLine = this.line;
            const startColumn = this.column;
            const char = this.peek();
            if (char === '"' || char === "'") {
                const stringResult = this.readString();
                tokens.push({
                    type: 'STRING',
                    value: stringResult.value,
                    line: startLine,
                    column: startColumn,
                    valid: stringResult.valid
                });
            }
            else if (/\d/.test(char)) {
                const value = this.readNumber();
                tokens.push({ type: 'NUMBER', value, line: startLine, column: startColumn });
            }
            else if (/[a-zA-Z_]/.test(char)) {
                const value = this.readIdentifier();
                const type = KEYWORDS.includes(value) ? 'KEYWORD' : 'IDENTIFIER';
                tokens.push({ type, value, line: startLine, column: startColumn });
            }
            else if (char === '@') {
                this.advance();
                tokens.push({ type: 'AT', value: '@', line: startLine, column: startColumn });
            }
            else {
                // Handle operators and punctuation
                const operators = ['==', '!=', '<=', '>=', '->', '=>'];
                let matched = false;
                for (const op of operators) {
                    if (this.text.substr(this.pos, op.length) === op) {
                        tokens.push({ type: 'OPERATOR', value: op, line: startLine, column: startColumn });
                        for (let i = 0; i < op.length; i++)
                            this.advance();
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    tokens.push({ type: 'PUNCTUATION', value: char, line: startLine, column: startColumn });
                    this.advance();
                }
            }
        }
        return tokens;
    }
}
// Parser for basic AST construction
class AsteroidParser {
    constructor(tokens) {
        this.pos = 0;
        this.tokens = tokens;
    }
    peek() {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }
    advance() {
        return this.pos < this.tokens.length ? this.tokens[this.pos++] : null;
    }
    parse() {
        const info = {
            symbols: new Map(),
            imports: [],
            functions: new Map(),
            variables: new Map()
        };
        while (this.pos < this.tokens.length) {
            const token = this.peek();
            if (!token)
                break;
            if (token.type === 'KEYWORD') {
                switch (token.value) {
                    case 'load':
                        this.parseLoad(info);
                        break;
                    case 'function':
                        this.parseFunction(info);
                        break;
                    case 'let':
                        this.parseVariable(info);
                        break;
                    case 'struct':
                    case 'data':
                        this.parseStruct(info);
                        break;
                    default:
                        this.advance();
                }
            }
            else {
                this.advance();
            }
        }
        return info;
    }
    parseLoad(info) {
        this.advance(); // consume 'load'
        const systemToken = this.peek();
        if (systemToken?.type === 'KEYWORD' && systemToken.value === 'system') {
            this.advance(); // consume 'system'
            const moduleToken = this.peek();
            if (moduleToken?.type === 'IDENTIFIER') {
                info.imports.push(moduleToken.value);
                this.advance();
            }
        }
    }
    parseFunction(info) {
        const startToken = this.advance(); // consume 'function'
        const nameToken = this.peek();
        if (nameToken?.type === 'IDENTIFIER') {
            const name = nameToken.value;
            this.advance();
            const range = {
                start: { line: startToken.line, character: startToken.column },
                end: { line: nameToken.line, character: nameToken.column + name.length }
            };
            const symbol = {
                name,
                kind: node_1.SymbolKind.Function,
                range,
                selectionRange: range,
                type: 'function'
            };
            info.functions.set(name, symbol);
            info.symbols.set(name, symbol);
        }
    }
    parseVariable(info) {
        const startToken = this.advance(); // consume 'let'
        const nameToken = this.peek();
        if (nameToken?.type === 'IDENTIFIER') {
            const name = nameToken.value;
            this.advance();
            const range = {
                start: { line: startToken.line, character: startToken.column },
                end: { line: nameToken.line, character: nameToken.column + name.length }
            };
            const symbol = {
                name,
                kind: node_1.SymbolKind.Variable,
                range,
                selectionRange: range,
                type: 'variable'
            };
            info.variables.set(name, symbol);
            info.symbols.set(name, symbol);
        }
    }
    parseStruct(info) {
        const startToken = this.advance(); // consume 'struct' or 'data'
        const nameToken = this.peek();
        if (nameToken?.type === 'IDENTIFIER') {
            const name = nameToken.value;
            this.advance();
            const range = {
                start: { line: startToken.line, character: startToken.column },
                end: { line: nameToken.line, character: nameToken.column + name.length }
            };
            const symbol = {
                name,
                kind: node_1.SymbolKind.Struct,
                range,
                selectionRange: range,
                type: startToken.value
            };
            info.symbols.set(name, symbol);
        }
    }
}
// Document analysis
function analyzeDocument(textDocument) {
    const text = textDocument.getText();
    const lexer = new AsteroidLexer(text);
    const tokens = lexer.tokenize();
    const parser = new AsteroidParser(tokens);
    const info = parser.parse();
    documentInfos.set(textDocument.uri, info);
    // Generate diagnostics
    const diagnostics = validateDocument(textDocument, tokens);
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
function validateDocument(textDocument, tokens) {
    const diagnostics = [];
    // Basic syntax validation
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        // Check for unterminated strings
        if (token.type === 'STRING' && token.valid === false) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: token.line, character: token.column },
                    end: { line: token.line, character: token.column + token.value.length + 1 }
                },
                message: 'Unterminated string literal',
                source: 'asteroid-lsp'
            });
        }
        // Check for invalid numbers
        if (token.type === 'NUMBER' && !/^\d+\.?\d*$/.test(token.value)) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: token.line, character: token.column },
                    end: { line: token.line, character: token.column + token.value.length }
                },
                message: 'Invalid number format',
                source: 'asteroid-lsp'
            });
        }
    }
    return diagnostics;
}
// Event handlers
documents.onDidChangeContent(change => {
    analyzeDocument(change.document);
});
connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received a file change event');
});
// Completion provider
connection.onCompletion((_textDocumentPosition) => {
    const completions = [];
    // Add keywords
    KEYWORDS.forEach(keyword => {
        completions.push({
            label: keyword,
            kind: node_1.CompletionItemKind.Keyword,
            detail: `Asteroid keyword: ${keyword}`
        });
    });
    // Add built-in functions
    BUILTIN_FUNCTIONS.forEach(func => {
        completions.push({
            label: func,
            kind: node_1.CompletionItemKind.Function,
            detail: `Built-in function: ${func}`
        });
    });
    // Add system modules
    SYSTEM_MODULES.forEach(mod => {
        completions.push({
            label: mod,
            kind: node_1.CompletionItemKind.Module,
            detail: `System module: ${mod}`
        });
    });
    // Add document symbols
    const uri = _textDocumentPosition.textDocument.uri;
    const docInfo = documentInfos.get(uri);
    if (docInfo) {
        docInfo.symbols.forEach(symbol => {
            completions.push({
                label: symbol.name,
                kind: symbol.kind === node_1.SymbolKind.Function ? node_1.CompletionItemKind.Function :
                    symbol.kind === node_1.SymbolKind.Variable ? node_1.CompletionItemKind.Variable :
                        node_1.CompletionItemKind.Class,
                detail: `${symbol.type}: ${symbol.name}`
            });
        });
    }
    return completions;
});
connection.onCompletionResolve((item) => {
    return item;
});
// Hover provider
connection.onHover((_textDocumentPosition) => {
    const document = documents.get(_textDocumentPosition.textDocument.uri);
    if (!document)
        return undefined;
    const position = _textDocumentPosition.position;
    const text = document.getText();
    const lines = text.split('\n');
    if (position.line >= lines.length)
        return undefined;
    const line = lines[position.line];
    const wordRange = getWordRangeAtPosition(line, position.character);
    if (!wordRange)
        return undefined;
    const word = line.substring(wordRange.start, wordRange.end);
    // Check if it's a keyword
    if (KEYWORDS.includes(word)) {
        return {
            contents: {
                kind: 'markdown',
                value: `**${word}** - Asteroid keyword`
            },
            range: {
                start: { line: position.line, character: wordRange.start },
                end: { line: position.line, character: wordRange.end }
            }
        };
    }
    // Check built-in functions
    if (BUILTIN_FUNCTIONS.includes(word)) {
        return {
            contents: {
                kind: 'markdown',
                value: `**${word}()** - Built-in function`
            },
            range: {
                start: { line: position.line, character: wordRange.start },
                end: { line: position.line, character: wordRange.end }
            }
        };
    }
    // Check document symbols
    const docInfo = documentInfos.get(_textDocumentPosition.textDocument.uri);
    if (docInfo && docInfo.symbols.has(word)) {
        const symbol = docInfo.symbols.get(word);
        return {
            contents: {
                kind: 'markdown',
                value: `**${symbol.name}** - ${symbol.type}`
            },
            range: {
                start: { line: position.line, character: wordRange.start },
                end: { line: position.line, character: wordRange.end }
            }
        };
    }
    return undefined;
});
// Definition provider
connection.onDefinition((_params) => {
    const document = documents.get(_params.textDocument.uri);
    if (!document)
        return undefined;
    const position = _params.position;
    const text = document.getText();
    const lines = text.split('\n');
    if (position.line >= lines.length)
        return undefined;
    const line = lines[position.line];
    const wordRange = getWordRangeAtPosition(line, position.character);
    if (!wordRange)
        return undefined;
    const word = line.substring(wordRange.start, wordRange.end);
    const docInfo = documentInfos.get(_params.textDocument.uri);
    if (docInfo && docInfo.symbols.has(word)) {
        const symbol = docInfo.symbols.get(word);
        return {
            uri: _params.textDocument.uri,
            range: symbol.range
        };
    }
    return undefined;
});
// Document symbols provider
connection.onDocumentSymbol((_params) => {
    const docInfo = documentInfos.get(_params.textDocument.uri);
    if (!docInfo)
        return [];
    const symbols = [];
    docInfo.symbols.forEach(symbol => {
        symbols.push({
            name: symbol.name,
            kind: symbol.kind,
            range: symbol.range,
            selectionRange: symbol.selectionRange,
            detail: symbol.detail
        });
    });
    return symbols;
});
// Utility functions
function getWordRangeAtPosition(line, character) {
    if (character < 0 || character >= line.length)
        return undefined;
    let start = character;
    let end = character;
    // Find start of word
    while (start > 0 && /[a-zA-Z0-9_]/.test(line[start - 1])) {
        start--;
    }
    // Find end of word
    while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) {
        end++;
    }
    if (start === end)
        return undefined;
    return { start, end };
}
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map