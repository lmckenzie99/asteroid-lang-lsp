"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Debug version of the LSP server with proper logging and fixes
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create connection and text document manager
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Debug logging function
function debugLog(message, data) {
    connection.console.log(`[Asteroid LSP] ${message}${data ? ': ' + JSON.stringify(data) : ''}`);
}
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
    'print', 'range', 'reduce', 'repr', 'reverse', 'round', 'set', 'sorted', 'str',
    'sum', 'tuple', 'type', 'zip'
];
const SYSTEM_MODULES = ['io', 'math', 'os', 'random', 'string', 'time', 'util'];
// Initialize the server
connection.onInitialize((params) => {
    debugLog('LSP Server initializing', { rootUri: params.rootUri });
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '@', ' ', '"', "'"]
            },
            hoverProvider: true,
            definitionProvider: false, // Disable for now to focus on completion
            documentSymbolProvider: false,
        }
    };
    debugLog('Server initialized with capabilities', result.capabilities);
    return result;
});
connection.onInitialized(() => {
    debugLog('Server initialized and ready');
    debugLog('Asteroid LSP Server started');
});
// Simple document analysis that doesn't validate syntax aggressively
function analyzeDocument(textDocument) {
    debugLog('Analyzing document', { uri: textDocument.uri });
    // For now, send empty diagnostics to avoid false errors
    const diagnostics = [];
    // Only add diagnostics for truly obvious syntax errors
    const text = textDocument.getText();
    const lines = text.split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Check for unterminated strings (only if line ends with a quote without a pair)
        const singleQuoteCount = (line.match(/'/g) || []).length;
        const doubleQuoteCount = (line.match(/"/g) || []).length;
        // Only flag if there's an odd number of quotes AND the line doesn't continue
        if ((singleQuoteCount % 2 === 1 || doubleQuoteCount % 2 === 1) && !line.trim().endsWith('\\')) {
            const quoteIndex = Math.max(line.lastIndexOf('"'), line.lastIndexOf("'"));
            if (quoteIndex !== -1) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning, // Warning, not error
                    range: {
                        start: { line: lineIndex, character: quoteIndex },
                        end: { line: lineIndex, character: quoteIndex + 1 }
                    },
                    message: 'Possible unterminated string',
                    source: 'asteroid-lsp'
                });
            }
        }
    }
    debugLog('Sending diagnostics', { count: diagnostics.length });
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
// Event handlers
documents.onDidChangeContent(change => {
    debugLog('Document changed', { uri: change.document.uri });
    analyzeDocument(change.document);
});
documents.onDidOpen(event => {
    debugLog('Document opened', { uri: event.document.uri });
    analyzeDocument(event.document);
});
// Fixed completion provider
connection.onCompletion((textDocumentPosition) => {
    debugLog('Completion requested', {
        uri: textDocumentPosition.textDocument.uri,
        position: textDocumentPosition.position
    });
    const completions = [];
    try {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document) {
            debugLog('Document not found for completion');
            return [];
        }
        const position = textDocumentPosition.position;
        const text = document.getText();
        const lines = text.split('\n');
        if (position.line >= lines.length) {
            debugLog('Position out of range');
            return [];
        }
        const currentLine = lines[position.line];
        const beforeCursor = currentLine.substring(0, position.character);
        debugLog('Completion context', {
            line: currentLine,
            beforeCursor,
            character: position.character
        });
        // Always provide keyword completions
        KEYWORDS.forEach(keyword => {
            completions.push({
                label: keyword,
                kind: node_1.CompletionItemKind.Keyword,
                detail: `Asteroid keyword`,
                documentation: `Keyword: ${keyword}`
            });
        });
        // Always provide built-in function completions
        BUILTIN_FUNCTIONS.forEach(func => {
            completions.push({
                label: func,
                kind: node_1.CompletionItemKind.Function,
                detail: `Built-in function`,
                documentation: `Built-in function: ${func}()`
            });
        });
        // System module completions
        SYSTEM_MODULES.forEach(mod => {
            completions.push({
                label: mod,
                kind: node_1.CompletionItemKind.Module,
                detail: `System module`,
                documentation: `System module: ${mod}`
            });
        });
        // Check for 'load system ' context
        if (beforeCursor.includes('load system ')) {
            debugLog('Providing system module completions');
            // Add system modules with higher priority
            SYSTEM_MODULES.forEach(mod => {
                completions.push({
                    label: mod,
                    kind: node_1.CompletionItemKind.Module,
                    detail: `System module for load`,
                    documentation: `Load system module: ${mod}`,
                    sortText: '0' + mod // Higher priority
                });
            });
        }
        // Check for function definition context
        if (beforeCursor.includes('function ')) {
            completions.push({
                label: 'with',
                kind: node_1.CompletionItemKind.Keyword,
                detail: 'Function parameter keyword',
                sortText: '0with'
            });
        }
        debugLog('Returning completions', { count: completions.length });
        return completions;
    }
    catch (error) {
        debugLog('Error in completion', { error: error.message });
        return [];
    }
});
connection.onCompletionResolve((item) => {
    debugLog('Completion resolve', { label: item.label });
    return item;
});
// Simple hover provider
connection.onHover((textDocumentPosition) => {
    debugLog('Hover requested', textDocumentPosition.position);
    try {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document)
            return undefined;
        const position = textDocumentPosition.position;
        const text = document.getText();
        const lines = text.split('\n');
        if (position.line >= lines.length)
            return undefined;
        const line = lines[position.line];
        const wordRange = getWordRangeAtPosition(line, position.character);
        if (!wordRange)
            return undefined;
        const word = line.substring(wordRange.start, wordRange.end);
        debugLog('Hover word', { word });
        // Check if it's a keyword
        if (KEYWORDS.includes(word)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `**${word}** - Asteroid keyword`
                }
            };
        }
        // Check built-in functions
        if (BUILTIN_FUNCTIONS.includes(word)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `**${word}()** - Built-in function`
                }
            };
        }
        return undefined;
    }
    catch (error) {
        debugLog('Error in hover', { error: error.message });
        return undefined;
    }
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
// Error handling - Use process event listeners instead of connection.onError
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Asteroid LSP] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[Asteroid LSP] Uncaught Exception:', error);
});
connection.onExit(() => {
    debugLog('LSP Server exiting');
});
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map