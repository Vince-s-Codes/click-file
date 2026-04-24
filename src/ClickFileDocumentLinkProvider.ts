// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import { getReferences, resolveFile, resolveMatch, getFileTitle } from './utilities';

export class ClickFileDocumentLinkProvider implements vscode.DocumentLinkProvider {
  private remapDirectories: Record<string, string[]>;

  constructor(remapDirectories: Record<string, string[]>) {
    this.remapDirectories = remapDirectories;
  }

  provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const references = getReferences(document);
    const text = document.getText();
    let match: RegExpExecArray | null;

    while (references.regexp !== null && (match = references.regexp.exec(text)) !== null) {
      const { filePath, lineNumber, columnNumber } = resolveMatch(match);
      const files: string[] = resolveFile(filePath, references);
      const resolvedFiles: string[] = [];

      files.forEach(file => {
        try {
          let finalFilePath = file;
          let fileExists = fs.existsSync(finalFilePath);

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
            const resolvedFile = fs.realpathSync(finalFilePath);

            if (!resolvedFiles.includes(resolvedFile) &&
                match !== null &&
                (resolvedFile !== references.file || lineNumber) &&
                fs.statSync(resolvedFile).isFile()) {
              const start = document.positionAt(match.index);
              const end = document.positionAt(match.index + match[0].length);
              const range = new vscode.Range(start, end);

              resolvedFiles.push(resolvedFile);

              // Create document link for the file
              const targetUri = vscode.Uri.file(resolvedFile).with({
                fragment: lineNumber ? `L${lineNumber}${columnNumber ? `,${columnNumber}` : ''}` : ''
              });

              const link = new vscode.DocumentLink(range, targetUri);
              link.tooltip = getFileTitle(filePath, lineNumber, columnNumber);
              links.push(link);
            }
          }
        } catch (error) {
          console.error('click-file::', error);
        }
      });
    }

    return links;
  }
}