// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as childProcess from 'child_process';

/**
 * Handler for opening a file or directory at the specified path, line number, and column number.
 * @param filePath The path of the file or directory to open.
 * @param lineNumber The line number to navigate to (only applicable for files).
 * @param columnNumber The column number to navigate to (only applicable for files).
 */
export function openFilePathHandler(filePath: string, lineNumber: number, columnNumber?: number): void {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Handle directory: reveal in VS Code Explorer
          // Use internal VS Code command to reveal directory in sidebar
          const uri = vscode.Uri.file(filePath);
          vscode.commands.executeCommand('_workbench.action.files.revealInExplorer', uri);
        } else {
          // Handle file: open in editor
          const uri = vscode.Uri.file(filePath);
          let options = { preview: false };

          vscode.window.showTextDocument(uri, options).then((editor) => {
            if (lineNumber && lineNumber > 0) {
              const line = editor.document.lineAt(lineNumber - 1);
              const position = columnNumber ? new vscode.Position(lineNumber - 1, columnNumber - 1) : line.range.start;
              editor.selection = new vscode.Selection(position, position);
              editor.revealRange(line.range, vscode.TextEditorRevealType.InCenter);
            }
          });
        }
      } else {
        vscode.window.showWarningMessage(`The path '${filePath}' does not exist`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error while opening '${filePath}': ${error}`);
    }
}

/**
 * Handler for executing a command to open an external file.
 * @param command The command to execute.
 */
export function openExternalFilePathHandler(command: string): void {
    childProcess.exec(command, (error, _stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        vscode.window.showErrorMessage(`Error: ${stderr}`);
        return;
      }
    });
}