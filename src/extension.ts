// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { fixRemapDirectories, fixIncludePaths } from './utilities';
import { openFilePathHandler, openExternalFilePathHandler } from './commands';
import { ClickFileCodeLensProvider } from './ClickFileCodeLensProvider';
import { ClickFileDocumentLinkProvider } from './ClickFileDocumentLinkProvider';
import { setLogLevel, LogLevel, LogLevelType, debug, note, warning, error } from './log';

// Map string log level to LogLevelType
type LogLevelString = 'none' | 'error' | 'warning' | 'note' | 'debug';

function stringToLogLevel(level: LogLevelString): LogLevelType {
  switch (level) {
    case 'none': return LogLevel.NONE;
    case 'error': return LogLevel.ERROR;
    case 'warning': return LogLevel.WARNING;
    case 'note': return LogLevel.NOTE;
    case 'debug': return LogLevel.DEBUG;
    default: return LogLevel.NONE;
  }
}

// Get current log level from configuration
function getLogLevelConfig(): LogLevelType {
  const config = vscode.workspace.getConfiguration('click-file');
  const logLevel = config.get<LogLevelString>('logLevel', 'none');
  return stringToLogLevel(logLevel);
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize log level
  setLogLevel(getLogLevelConfig());

  const config = vscode.workspace.getConfiguration('click-file');
  let externalDirectories = config.get('externalDirectories', []);
  let externalFiles = config.get('externalFiles', []);
  let remapDirectories = fixRemapDirectories(config.get<Record<string, string[]>>('remapDirectories', {}));
  let includePaths = fixIncludePaths(config.get<string[]>('includePaths', []));
  let linkStyle = config.get<'codelens' | 'documentlink'>('linkStyle', 'codelens');

  debug(activate, 'Activating click-file extension');

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
      new ClickFileCodeLensProvider(remapDirectories, externalDirectories, externalFiles, linkStyle === 'codelens', includePaths)
    );
    context.subscriptions.push(codeLensProvider);
    if (linkStyle === 'documentlink') {
      documentLinkProvider = vscode.languages.registerDocumentLinkProvider(
        '*',
        new ClickFileDocumentLinkProvider(remapDirectories, includePaths)
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
    if (event.affectsConfiguration('click-file.includePaths')) {
      includePaths = fixIncludePaths(config.get<string[]>('includePaths', []));
      updateProviders();
    }
    if (event.affectsConfiguration('click-file.linkStyle')) {
      const newLinkStyle = config.get<'codelens' | 'documentlink'>('linkStyle', 'codelens');
      if (newLinkStyle !== linkStyle) {
        linkStyle = newLinkStyle;
        updateProviders();
      }
    }
    if (event.affectsConfiguration('click-file.logLevel')) {
      setLogLevel(getLogLevelConfig());
      debug(activate, 'Log level updated');
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