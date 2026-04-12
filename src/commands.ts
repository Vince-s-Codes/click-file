// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as childProcess from 'child_process';

/**
 * Handler for opening a file at the specified path, line number, and column number.
 * @param filePath The path of the file to open.
 * @param lineNumber The line number to navigate to.
 * @param columnNumber The column number to navigate to.
 */
export function openFilePathHandler(filePath: string, lineNumber: number, columnNumber?: number): void {
    try {
      if (fs.existsSync(filePath)) {
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
      } else {
        vscode.window.showWarningMessage(`The file '${filePath}' does not exist`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error while opening '${filePath}' file: ${error}`);
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