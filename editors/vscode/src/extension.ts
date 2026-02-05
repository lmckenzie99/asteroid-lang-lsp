import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext): void {
  // The server is the asteroid-language-server built from the root of the repo.
  // Resolve the server module relative to the extension: ../../out/server.js
  const serverModule = context.asAbsolutePath(
    path.join('..', '..', 'out', 'server.js')
  );

  // Server options – run and debug configurations both use stdio
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: {
        execArgv: ['--nolazy', '--inspect=6009'],
      },
    },
  };

  // Client options – register for Asteroid files
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'asteroid' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.{ast,asteroid}'),
    },
  };

  // Create and start the client
  client = new LanguageClient(
    'asteroidLanguageServer',
    'Asteroid Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
