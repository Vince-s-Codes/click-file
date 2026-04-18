// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { fixRemapDirectories, getDirectoryTitle, getFileTitle, getReferences, resolveFile, resolveMatch, wildcardToRegex } from './utilities';
import { openFilePathHandler, openExternalFilePathHandler } from './commands';

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

  const underlineDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline',
    color: new vscode.ThemeColor('editorLink.activeForeground')
  });

  const codeLensProvider = vscode.languages.registerCodeLensProvider('*', {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const decorationRanges: vscode.Range[] = [];
      const editor = vscode.window.activeTextEditor;
      const lenses: vscode.CodeLens[] = [];
      let match: RegExpExecArray | null;
      const references = getReferences(document);
      const text = document.getText();

      //console.log('click-file::', 'references', references);
      while(references.regexp !== null &&
            (match = references.regexp.exec(text)) !== null) {
        const {filePath, lineNumber, columnNumber} = resolveMatch(match);
        const files: string[] = resolveFile(filePath, references);
        const resolvedFiles: string[] = [];

        //console.log('click-file::', 'files', files);

        files.forEach(file => {
          try {
            let finalFilePath = file;
            let fileExists = fs.existsSync(finalFilePath);
            let resolvedFile: string;

            // If file doesn't exist, try remapping using remapDirectories
            if (!fileExists) {
              for (const [key, replacements] of Object.entries(remapDirectories)) {
                if (file.includes(key)) {
                  for (const replacement of replacements) {
                    const remappedPath = file.replace(key, replacement);
                    if (fs.existsSync(remappedPath)) {
                      finalFilePath = remappedPath;
                      fileExists = true;
                      break;
                    }
                  }
                  if (fileExists) {
                    break;
                  }
                }
              }
            }

            if (fs.existsSync(finalFilePath)) {
              resolvedFile = fs.realpathSync(finalFilePath);
              if (!resolvedFiles.includes(resolvedFile) && match !== null) {
                const count = lenses.length;
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(start, end);

                resolvedFiles.push(resolvedFile);
                if (fs.statSync(resolvedFile).isFile()) {
                  const fileExtension = path.extname(filePath).substring(1);
                  const fileName = path.basename(filePath);
                  const title = getFileTitle(filePath, lineNumber, columnNumber);

                  if (resolvedFile !== references.file || lineNumber) {
                    const lens = new vscode.CodeLens(range, {
                      title: "$(go-to-file)Open",
                      tooltip: title,
                      command: 'click-file.openFilePath',
                      arguments: [resolvedFile, lineNumber ? parseInt(lineNumber) : 0, columnNumber]
                    });
                    lenses.push(lens);
                  }

                  externalFiles.forEach((cmd : {tool: string, command: string, patterns: string[], types: string[]}) => {
                    if ((cmd.types === undefined || cmd.types.length === 0 || cmd.types.includes(fileExtension)) &&
                        (cmd.patterns === undefined || cmd.patterns.length === 0 || cmd.patterns.some(pattern => fileName.match(wildcardToRegex(pattern))))) {
                      const command = cmd.command.replace('%f', resolvedFile).replace('%n', lineNumber ? lineNumber : '');
                      const title = getFileTitle(filePath, lineNumber, columnNumber, cmd.tool);
                      const lens = new vscode.CodeLens(range, {
                        title: `$(share)${cmd.tool}`,
                        tooltip: title,
                        command: 'click-file.openExternalFilePath',
                        arguments: [command]
                      });
                      lenses.push(lens);
                    }
                  });
                } else if (fs.statSync(resolvedFile).isDirectory()) {
                  const directoryName = path.basename(filePath);

                  externalDirectories.forEach((cmd : {tool: string, command: string, patterns: string[]}) => {
                    if (cmd.patterns === undefined ||
                        cmd.patterns.length === 0 ||
                        cmd.patterns.some(pattern => directoryName.match(wildcardToRegex(pattern)))) {
                      const command = cmd.command.replace('%d', resolvedFile);
                      const title = getDirectoryTitle(filePath, cmd.tool);
                      const lens = new vscode.CodeLens(range, {
                        title: `$(share)${cmd.tool}`,
                        tooltip: title,
                        command: 'click-file.openExternalFilePath',
                        arguments: [command]
                      });
                      lenses.push(lens);
                    }
                  });
                }
                if (lenses.length !== count) {
                  decorationRanges.push(range);
                }
              }
            }
          } catch(error) {
            console.error('click-file::', error);
          }
        });
      }
      if (editor && editor.document === document) {
        editor.setDecorations(underlineDecoration, decorationRanges);
      }
      return lenses;
    }
  });
  context.subscriptions.push(codeLensProvider);
}

export function deactivate() {}
