// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

// Define log levels
export const LogLevel = {
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  NOTE: 3,
  DEBUG: 4
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

// Current log level - will be set from extension.ts
let currentLogLevel: LogLevelType = LogLevel.NONE;

// Track the last debug call time for time difference calculation
let lastDebugTime: number | null = null;

/**
 * Sets the current log level
 * @param level The log level to set
 */
export function setLogLevel(level: LogLevelType): void {
  currentLogLevel = level;
}

// Check if a message should be logged based on its level
function shouldLog(level: LogLevelType): boolean {
  return level <= currentLogLevel;
}

/**
 * Logs a debug message to the console
 * @param args Arguments to log (first argument is treated as the message)
 */
export function debug(functionRef: Function | string, ...args: any[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    const currentTime = Date.now();
    const timeDiff = lastDebugTime ? `+${currentTime - lastDebugTime}ms` : "";
    lastDebugTime = currentTime;

    if (typeof functionRef === 'function') {
      // Handle case where first argument is a function reference
      const functionName = functionRef.name;
      console.log(`click-file:: [DEBUG:${timeDiff}] (${functionName})`, ...args);
    } else if (typeof functionRef === 'string') {
      // Handle case where first argument is a string
      console.log(`click-file:: [DEBUG:${timeDiff}] ${functionRef}`, ...args);
    }
  }
}

/**
 * Logs an informational note to the console
 * @param functionRef Function reference or message string
 * @param args Additional arguments to log
 */
export function note(functionRef: Function | string, ...args: any[]): void {
  if (shouldLog(LogLevel.NOTE)) {
    if (typeof functionRef === 'function') {
      const functionName = functionRef.name;
      console.log(`click-file:: [NOTE] (${functionName})`, ...args);
    } else if (typeof functionRef === 'string') {
      console.log(`click-file:: [NOTE] ${functionRef}`, ...args);
    }
  }
}

/**
 * Logs a warning message to the console
 * @param functionRef Function reference or message string
 * @param args Additional arguments to log
 */
export function warning(functionRef: Function | string, ...args: any[]): void {
  if (shouldLog(LogLevel.WARNING)) {
    if (typeof functionRef === 'function') {
      const functionName = functionRef.name;
      console.warn(`click-file:: [WARNING] (${functionName})`, ...args);
    } else if (typeof functionRef === 'string') {
      console.warn(`click-file:: [WARNING] ${functionRef}`, ...args);
    }
  }
}

/**
 * Logs an error message to the console
 * @param functionRef Function reference or message string
 * @param args Additional arguments to log
 */
export function error(functionRef: Function | string, ...args: any[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    if (typeof functionRef === 'function') {
      const functionName = functionRef.name;
      console.error(`click-file:: [ERROR] (${functionName})`, ...args);
    } else if (typeof functionRef === 'string') {
      console.error(`click-file:: [ERROR] ${functionRef}`, ...args);
    }
  }
}
