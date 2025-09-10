import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  Hover,
  MarkedString,
  Range,
  Position,
  Location,
  DocumentSymbol,
  SymbolKind,
  TextDocumentSyncKind,
  InitializeResult
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Create connection and text document manager
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

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

interface AsteroidSymbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  detail?: string;
  type?: string;
}

interface DocumentInfo {
  symbols: Map<string, AsteroidSymbol>;
  imports: string[];
  functions: Map<string, AsteroidSymbol>;
  variables: Map<string, AsteroidSymbol>;
}

const documentInfos = new Map<string, DocumentInfo>();

// Initialize the server
connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
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
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Lexer for basic tokenization
class AsteroidLexer {
  private text: string;
  private pos: number = 0;
  private line: number = 0;
  private column: number = 0;

  constructor(text: string) {
    this.text = text;
  }

  private peek(): string {
    return this.pos < this.text.length ? this.text[this.pos] : '';
  }

  private advance(): void {
    if (this.text[this.pos] === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    this.pos++;
  }

  private skipWhitespace(): void {
    while (this.peek() && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  private skipComment(): void {
    if (this.peek() === '%') {
      while (this.peek() && this.peek() !== '\n') {
        this.advance();
      }
    }
  }

  private readString(): { value: string, valid: boolean } {
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
      } else {
        value += this.peek();
        this.advance();
      }
    }
    
    if (this.peek() === quote) {
      this.advance(); // skip closing quote
    } else {
      valid = false; // unterminated string
    }
    
    return { value, valid };
  }

  private readNumber(): string {
    let value = '';
    while (this.peek() && /[\d.]/.test(this.peek())) {
      value += this.peek();
      this.advance();
    }
    return value;
  }

  private readIdentifier(): string {
    let value = '';
    while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek())) {
      value += this.peek();
      this.advance();
    }
    return value;
  }

  public tokenize(): Array<{type: string, value: string, line: number, column: number, valid?: boolean}> {
    const tokens = [];
    
    while (this.pos < this.text.length) {
      this.skipWhitespace();
      this.skipComment();
      
      if (this.pos >= this.text.length) break;

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
      } else if (/\d/.test(char)) {
        const value = this.readNumber();
        tokens.push({type: 'NUMBER', value, line: startLine, column: startColumn});
      } else if (/[a-zA-Z_]/.test(char)) {
        const value = this.readIdentifier();
        const type = KEYWORDS.includes(value) ? 'KEYWORD' : 'IDENTIFIER';
        tokens.push({type, value, line: startLine, column: startColumn});
      } else if (char === '@') {
        this.advance();
        tokens.push({type: 'AT', value: '@', line: startLine, column: startColumn});
      } else {
        // Handle operators and punctuation
        const operators = ['==', '!=', '<=', '>=', '->', '=>'];
        let matched = false;
        
        for (const op of operators) {
          if (this.text.substr(this.pos, op.length) === op) {
            tokens.push({type: 'OPERATOR', value: op, line: startLine, column: startColumn});
            for (let i = 0; i < op.length; i++) this.advance();
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          tokens.push({type: 'PUNCTUATION', value: char, line: startLine, column: startColumn});
          this.advance();
        }
      }
    }
    
    return tokens;
  }
}

// Parser for basic AST construction
class AsteroidParser {
  private tokens: Array<{type: string, value: string, line: number, column: number}>;
  private pos: number = 0;

  constructor(tokens: Array<{type: string, value: string, line: number, column: number}>) {
    this.tokens = tokens;
  }

  private peek(): any {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private advance(): any {
    return this.pos < this.tokens.length ? this.tokens[this.pos++] : null;
  }

  public parse(): DocumentInfo {
    const info: DocumentInfo = {
      symbols: new Map(),
      imports: [],
      functions: new Map(),
      variables: new Map()
    };

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token) break;

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
      } else {
        this.advance();
      }
    }

    return info;
  }

  private parseLoad(info: DocumentInfo): void {
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

  private parseFunction(info: DocumentInfo): void {
    const startToken = this.advance(); // consume 'function'
    const nameToken = this.peek();
    
    if (nameToken?.type === 'IDENTIFIER') {
      const name = nameToken.value;
      this.advance();
      
      const range: Range = {
        start: { line: startToken.line, character: startToken.column },
        end: { line: nameToken.line, character: nameToken.column + name.length }
      };
      
      const symbol: AsteroidSymbol = {
        name,
        kind: SymbolKind.Function,
        range,
        selectionRange: range,
        type: 'function'
      };
      
      info.functions.set(name, symbol);
      info.symbols.set(name, symbol);
    }
  }

  private parseVariable(info: DocumentInfo): void {
    const startToken = this.advance(); // consume 'let'
    const nameToken = this.peek();
    
    if (nameToken?.type === 'IDENTIFIER') {
      const name = nameToken.value;
      this.advance();
      
      const range: Range = {
        start: { line: startToken.line, character: startToken.column },
        end: { line: nameToken.line, character: nameToken.column + name.length }
      };
      
      const symbol: AsteroidSymbol = {
        name,
        kind: SymbolKind.Variable,
        range,
        selectionRange: range,
        type: 'variable'
      };
      
      info.variables.set(name, symbol);
      info.symbols.set(name, symbol);
    }
  }

  private parseStruct(info: DocumentInfo): void {
    const startToken = this.advance(); // consume 'struct' or 'data'
    const nameToken = this.peek();
    
    if (nameToken?.type === 'IDENTIFIER') {
      const name = nameToken.value;
      this.advance();
      
      const range: Range = {
        start: { line: startToken.line, character: startToken.column },
        end: { line: nameToken.line, character: nameToken.column + name.length }
      };
      
      const symbol: AsteroidSymbol = {
        name,
        kind: SymbolKind.Struct,
        range,
        selectionRange: range,
        type: startToken.value
      };
      
      info.symbols.set(name, symbol);
    }
  }
}

// Document analysis
function analyzeDocument(textDocument: TextDocument): void {
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

function validateDocument(textDocument: TextDocument, tokens: any[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  // Basic syntax validation
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Check for unterminated strings
    if (token.type === 'STRING' && token.valid === false) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
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
        severity: DiagnosticSeverity.Error,
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
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const completions: CompletionItem[] = [];
  
  // Add keywords
  KEYWORDS.forEach(keyword => {
    completions.push({
      label: keyword,
      kind: CompletionItemKind.Keyword,
      detail: `Asteroid keyword: ${keyword}`
    });
  });
  
  // Add built-in functions
  BUILTIN_FUNCTIONS.forEach(func => {
    completions.push({
      label: func,
      kind: CompletionItemKind.Function,
      detail: `Built-in function: ${func}`
    });
  });
  
  // Add system modules
  SYSTEM_MODULES.forEach(mod => {
    completions.push({
      label: mod,
      kind: CompletionItemKind.Module,
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
        kind: symbol.kind === SymbolKind.Function ? CompletionItemKind.Function : 
              symbol.kind === SymbolKind.Variable ? CompletionItemKind.Variable :
              CompletionItemKind.Class,
        detail: `${symbol.type}: ${symbol.name}`
      });
    });
  }
  
  return completions;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

// Hover provider
connection.onHover((_textDocumentPosition: TextDocumentPositionParams): Hover | undefined => {
  const document = documents.get(_textDocumentPosition.textDocument.uri);
  if (!document) return undefined;
  
  const position = _textDocumentPosition.position;
  const text = document.getText();
  const lines = text.split('\n');
  
  if (position.line >= lines.length) return undefined;
  
  const line = lines[position.line];
  const wordRange = getWordRangeAtPosition(line, position.character);
  
  if (!wordRange) return undefined;
  
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
    const symbol = docInfo.symbols.get(word)!;
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
connection.onDefinition((_params: TextDocumentPositionParams): Location | undefined => {
  const document = documents.get(_params.textDocument.uri);
  if (!document) return undefined;
  
  const position = _params.position;
  const text = document.getText();
  const lines = text.split('\n');
  
  if (position.line >= lines.length) return undefined;
  
  const line = lines[position.line];
  const wordRange = getWordRangeAtPosition(line, position.character);
  
  if (!wordRange) return undefined;
  
  const word = line.substring(wordRange.start, wordRange.end);
  
  const docInfo = documentInfos.get(_params.textDocument.uri);
  if (docInfo && docInfo.symbols.has(word)) {
    const symbol = docInfo.symbols.get(word)!;
    return {
      uri: _params.textDocument.uri,
      range: symbol.range
    };
  }
  
  return undefined;
});

// Document symbols provider
connection.onDocumentSymbol((_params): DocumentSymbol[] => {
  const docInfo = documentInfos.get(_params.textDocument.uri);
  if (!docInfo) return [];
  
  const symbols: DocumentSymbol[] = [];
  
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
function getWordRangeAtPosition(line: string, character: number): {start: number, end: number} | undefined {
  if (character < 0 || character >= line.length) return undefined;
  
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
  
  if (start === end) return undefined;
  
  return { start, end };
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();