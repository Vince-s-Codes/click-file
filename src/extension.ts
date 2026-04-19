// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { fixRemapDirectories, getDirectoryTitle, getFileTitle, getReferences, resolveFile, resolveMatch, wildcardToRegex } from './utilities';
import { openFilePathHandler, openExternalFilePathHandler } from './commands';
import { ClickFileCodeLensProvider } from './ClickFileCodeLensProvider';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('click-file');
  let externalDirectories = config.get('externalDirectories', []);
  let externalFiles = config.get('externalFiles', []);
  let remapDirectories = fixRemapDirectories(config.get<Record<string, string[]>>('remapDirectories', {}));

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
  });
  context.subscriptions.push(configWatcher);

  const clickFile = vscode.commands.registerCommand('click-file.openFilePath', openFilePathHandler);
  context.subscriptions.push(clickFile);

  const clickExternalFile = vscode.commands.registerCommand('click-file.openExternalFilePath', openExternalFilePathHandler);
  context.subscriptions.push(clickExternalFile);

  // Register the code lens provider
  const codeLensProvider = vscode.languages.registerCodeLensProvider('*',
    new ClickFileCodeLensProvider(remapDirectories, externalDirectories, externalFiles)
  );
  context.subscriptions.push(codeLensProvider);
}

export function deactivate() {}
