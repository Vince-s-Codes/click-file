// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { fixRemapDirectories } from './utilities';
import { openFilePathHandler, openExternalFilePathHandler } from './commands';
import { ClickFileCodeLensProvider } from './ClickFileCodeLensProvider';
import { ClickFileDocumentLinkProvider } from './ClickFileDocumentLinkProvider';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('click-file');
  let externalDirectories = config.get('externalDirectories', []);
  let externalFiles = config.get('externalFiles', []);
  let remapDirectories = fixRemapDirectories(config.get<Record<string, string[]>>('remapDirectories', {}));
  let linkStyle = config.get<'codelens' | 'documentlink'>('linkStyle', 'codelens');

  // Track providers so we can dispose and recreate them
  let codeLensProvider: vscode.Disposable | null = null;
  let documentLinkProvider: vscode.Disposable | null = null;

  // Function to update providers when configuration changes
  function updateProviders() {
    // Dispose existing providers
    if (codeLensProvider) {
      codeLensProvider.dispose();
      codeLensProvider = null;
    }
    if (documentLinkProvider) {
      documentLinkProvider.dispose();
      documentLinkProvider = null;
    }

    // Register the appropriate provider
    codeLensProvider = vscode.languages.registerCodeLensProvider('*',
      new ClickFileCodeLensProvider(remapDirectories, externalDirectories, externalFiles, linkStyle === 'codelens')
    );
    context.subscriptions.push(codeLensProvider);
    if (linkStyle === 'documentlink') {
      documentLinkProvider = vscode.languages.registerDocumentLinkProvider(
        '*',
        new ClickFileDocumentLinkProvider(remapDirectories)
      );
      context.subscriptions.push(documentLinkProvider);
    }
  }

  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    const config = vscode.workspace.getConfiguration('click-file');

    if (event.affectsConfiguration('click-file.externalDirectories')) {
      externalDirectories = config.get('externalDirectories', []);
    }
    if (event.affectsConfiguration('click-file.externalFiles')) {
      externalFiles = config.get('externalFiles', []);
    }
    if (event.affectsConfiguration('click-file.remapDirectories')) {
      remapDirectories = fixRemapDirectories(config.get<Record<string, string[]>>('remapDirectories', {}));
    }
    if (event.affectsConfiguration('click-file.linkStyle')) {
      const newLinkStyle = config.get<'codelens' | 'documentlink'>('linkStyle', 'codelens');
      if (newLinkStyle !== linkStyle) {
        linkStyle = newLinkStyle;
        updateProviders();
      }
    }
  });
  context.subscriptions.push(configWatcher);

  const clickFile = vscode.commands.registerCommand('click-file.openFilePath', openFilePathHandler);
  context.subscriptions.push(clickFile);

  const clickExternalFile = vscode.commands.registerCommand('click-file.openExternalFilePath', openExternalFilePathHandler);
  context.subscriptions.push(clickExternalFile);

  // Initialize providers
  updateProviders();
}

export function deactivate() {}