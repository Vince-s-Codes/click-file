// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getReferences, resolveFile, resolveMatch, wildcardToRegex, getFileTitle, getDirectoryTitle } from './utilities';

export class ClickFileCodeLensProvider implements vscode.CodeLensProvider {
  private remapDirectories: Record<string, string[]>;
  private externalDirectories: any[];
  private externalFiles: any[];
  private shouldProvideInternalFiles: boolean;
  private underlineDecoration: vscode.TextEditorDecorationType;

  constructor(remapDirectories: Record<string, string[]>, externalDirectories: any[], externalFiles: any[], shoulProvideInternalFiles: boolean) {
    this.remapDirectories = remapDirectories;
    this.externalDirectories = externalDirectories;
    this.externalFiles = externalFiles;
    this.shouldProvideInternalFiles = shoulProvideInternalFiles;
    this.underlineDecoration = vscode.window.createTextEditorDecorationType({
      textDecoration: 'underline'
    });
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const decorationRanges: vscode.Range[] = [];
    const editor = vscode.window.activeTextEditor;
    const lenses: vscode.CodeLens[] = [];
    let match: RegExpExecArray | null;
    const references = getReferences(document);
    const text = document.getText();

    while (references.regexp !== null && (match = references.regexp.exec(text)) !== null) {
      const { filePath, lineNumber, columnNumber } = resolveMatch(match);
      const files: string[] = resolveFile(filePath, references);
      const resolvedFiles: string[] = [];

      files.forEach(file => {
        try {
          let finalFilePath = file;
          let fileExists = fs.existsSync(finalFilePath);
          let resolvedFile: string;

          // If file doesn't exist, try remapping using remapDirectories
          if (!fileExists) {
            for (const [key, replacements] of Object.entries(this.remapDirectories)) {
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

                if (this.shouldProvideInternalFiles && (resolvedFile !== references.file || lineNumber)) {
                  const lens = new vscode.CodeLens(range, {
                    title: "$(go-to-file)Open",
                    tooltip: title,
                    command: 'click-file.openFilePath',
                    arguments: [resolvedFile, lineNumber ? parseInt(lineNumber) : 0, columnNumber]
                  });
                  lenses.push(lens);
                }

                this.externalFiles.forEach((cmd: { tool: string, command: string, patterns: string[], types: string[] }) => {
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

                this.externalDirectories.forEach((cmd: { tool: string, command: string, patterns: string[] }) => {
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
        } catch (error) {
          console.error('click-file::', error);
        }
      });
    }
    if (editor && editor.document === document) {
      editor.setDecorations(this.underlineDecoration, decorationRanges);
    }
    return lenses;
  }
}