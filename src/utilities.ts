// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface References {
  directories: string[];
  file: string | null;
  regexp: RegExp | null;
}

/**
 * Processes directory remapping rules by expanding environment variables and the user's home directory.
 * - Replaces `~` with the user's home directory.
 * - Expands environment variables (e.g., `$HOME`, `$USERPROFILE`) to their actual values.
 * - Preserves the original keys if no expansion is needed.
 *
 * @param remapDirectories Object containing remapping rules where keys are path patterns to match
 *                         and values are arrays of replacement paths.
 * @returns A new object with processed keys and values, where environment variables and `~` are expanded.
 */
export function fixRemapDirectories(remapDirectories: Record<string, string[]>): Record<string, string[]> {
  const homeDir = require('os').homedir();
  const newRemapDirectories: Record<string, string[]> = {};

  Object.entries(remapDirectories).forEach(([key, values]) => {
    // Process key: replace ~ with home directory and expand env variables
    let processedKey = key.replace(/^~/, homeDir);
    processedKey = processedKey.replace(/\$(\w+)/g, (_, envVar: string) => {
      return process.env[envVar] || _;
    });

    // Process values: replace ~ with home directory and expand env variables
    const processedValues = values.map((value: string) => {
      let processedValue = value.replace(/^~/, homeDir);
      processedValue = processedValue.replace(/\$(\w+)/g, (_, envVar: string) => {
        return process.env[envVar] || _;
      });
      return processedValue;
    });

    // Only add to new object if key was actually processed (contains ~ or env vars)
    if (processedKey !== key) {
      newRemapDirectories[processedKey] = processedValues;
    }

    // Keep original key if it wasn't processed
    if (processedKey === key) {
      newRemapDirectories[key] = processedValues;
    }
  });
  return newRemapDirectories;
}

/**
 * Generates a title for opening a directory, optionally with a specific tool.
 *
 * @param directory The directory path to open.
 * @param tool Optional tool name to include in the title.
 * @returns A formatted title string.
 */
export function getDirectoryTitle(directory: string, tool?: string): string {
  let title: string = `Open '${directory}' directory`;

  if (tool) {
    title += ` with '${tool}'`;
  }
  return title;
}

/**
 * Generates a title for opening a file, optionally at a specific line and column, and with a specific tool.
 *
 * @param file The file path to open.
 * @param lineNumber Optional line number to include in the title.
 * @param columnNumber Optional column number to include in the title.
 * @param tool Optional tool name to include in the title.
 * @returns A formatted title string.
 */
export function getFileTitle(file: string, lineNumber?: string|null, columnNumber?: string|null, tool?: string): string {
  let title: string = `Open '${file}' file`;

  if (lineNumber) {
    title += ` at line ${lineNumber}`;
  }
  if (columnNumber) {
    title += ` at column ${columnNumber}`;
  }
  if (tool) {
    title += ` with '${tool}'`;
  }
  return title;
}

/**
 * Extracts references from a document, including directories, files, and a regex pattern for matching paths.
 * - Collects directories from the document's location and its real path.
 * - Builds a regex pattern to match paths, line numbers, and column numbers in the document.
 *
 * @param document The document to analyze.
 * @returns An object containing directories, file path, and a regex pattern for matching references.
 */
export function getReferences(document: vscode.TextDocument): References {
  const columnNumberPattern = '(?:[,@#:|(](\\d+)\\)?|)';
  const escapedDirectories: string[] = [];
  const lineNumberPattern = '(?:[,@#:|(](\\d+)\\)?|)';
  const result = {directories: [] as string[], file: null as string | null, regexp: null as RegExp | null};
  const validPathSegment = '[a-zA-Z0-9_\\-\\.\\/\\$\\(\\)]+(?:\\.[a-zA-Z0-9]+)*';

  escapedDirectories.push('~/');
  if(!document.isUntitled) {
    let currentDir = path.dirname(document.fileName);

    escapedDirectories.push('\\.\\./');
    escapedDirectories.push('\\./');
    try {
      result.file = fs.realpathSync(document.fileName);
      result.directories.push(currentDir);
      fs.readdirSync(currentDir).map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).forEach(elt => {
        if(!escapedDirectories.includes(elt)) {
          escapedDirectories.push(elt);
        }
      });

      currentDir = fs.realpathSync(currentDir);
      if(currentDir !== result.directories[0]) {
        result.directories.push(currentDir);
        fs.readdirSync(currentDir).map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).forEach(elt => {
          if(!escapedDirectories.includes(elt)) {
            escapedDirectories.push(elt);
          }
        });
      }
    } catch(error) {
      console.error('click-file::', error);
    }
  }
  const escapedDirContents = escapedDirectories.join('|');

  result.regexp = new RegExp(`(?:[ '\`"\r\t\n:(){}\\[\\]<>*+-])((?:${escapedDirContents}|/[a-zA-Z0-9_\\-\\.]+|\\$[a-zA-Z0-9_\\(\\)]+)(?:${validPathSegment}|))${lineNumberPattern}${columnNumberPattern}`, 'g');
  return result;
}

/**
 * Resolves a file path to absolute paths, considering directory references and environment variables.
 * - Replaces `~` with the user's home directory.
 * - Expands environment variables (e.g., `$HOME`, `$USERPROFILE`).
 * - Converts relative paths to absolute paths using directory references.
 *
 * @param filePath The file path to resolve.
 * @param references Object containing directories for resolving relative paths.
 * @returns An array of resolved file paths.
 */
export function resolveFile(filePath: string, references: References): string[] {
  const files: string[] = [];
  const homeDir: string = require('os').homedir();

  filePath = filePath.replace(/^~\//, homeDir + '/');
  filePath = filePath.replace(/\$(\w+)/g, (_, envVar: string): string => {
    return process.env[envVar] || _;
  });
  filePath = filePath.replace(/\$env\((\w+)\)/g, (_, envVar: string): string => {
    return process.env[envVar] || _;
  });

  // Convert to absolute path if it is not already
  if (!path.isAbsolute(filePath) && references.directories.length > 0) {
    references.directories.forEach((directory: string): void => {
      files.push(path.join(directory, filePath));
    });
  } else {
    files.push(filePath);
  }
  return files;
}

/**
 * Parses a regex match to extract file path, line number, and column number.
 * - Handles cases where line and column numbers are embedded in the file path (e.g., `file(10)` or `file(10,5)`).
 * - Adjusts the file path by removing embedded line/column numbers.
 * - Returns the cleaned file path, line number, and column number.
 *
 * @param match The regex match array containing the file path, line number, and column number.
 * @returns An object with the cleaned file path, line number, and column number.
 */
export function resolveMatch(match: RegExpExecArray): {filePath: string, lineNumber: string | null, columnNumber: string | null} {
  let filePath = match[1];
  let lineNumber = match[2] || null;
  let columnNumber = match[3] || null;

  if(lineNumber === null && columnNumber === null) {
    let match;

    if((match = /^(.+)\((\d+)\)$/.exec(filePath)) !== null) {
      filePath = match[1];
      lineNumber = match[2];
      columnNumber = null;
    }
  } else if (columnNumber === null) {
    let match;

    if((match = /^(.+)\((\d+)$/.exec(filePath)) !== null) {
      columnNumber = lineNumber;
      filePath = match[1];
      lineNumber = match[2];
    }
  }
  return {filePath, lineNumber, columnNumber};
}

/**
 * Converts a wildcard pattern (e.g., `*.ts` or `file?.txt`) to a regular expression.
 * - Escapes regex special characters to ensure they are treated as literals.
 * - Converts `*` to `.*` to match any sequence of characters.
 * - Converts `?` to `.` to match any single character.
 * - Ensures the regex matches the entire string from start to end.
 *
 * @param pattern The wildcard pattern to convert (e.g., `*.ts`, `file?.txt`).
 * @returns A regular expression that matches the wildcard pattern.
 */
export function wildcardToRegex(pattern: string): RegExp {
  // Escape regex special characters
  let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  // Convert wildcards to regex
  regexStr = regexStr.replace(/\*/g, '.*');
  regexStr = regexStr.replace(/\?/g, '.');

  // Match the entire string
  return new RegExp(`^${regexStr}$`, 'i');
}