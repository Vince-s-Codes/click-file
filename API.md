# Click-File Extension API

This document describes the public API available for other VSCode extensions to integrate with **Click-File** and provide dynamic `includePaths` for file path resolution.

## Overview

Click-File provides a mechanism for external extensions to dynamically contribute include paths based on the current file being analyzed. This is useful for language-specific extensions (e.g., C/C++, Rust, Go) that need to provide header search paths or module resolution paths.

## API Reference

### `registerIncludePathProvider(provider)`

Register a callback function that will be invoked when Click-File analyzes a document. The callback receives the current document and should return an array of directory paths to be added to the include path resolution.

```typescript
function registerIncludePathProvider(
  provider: IncludePathProvider
): vscode.Disposable;
```

**Parameters:**
- `provider` *(IncludePathProvider)*: A function that takes a `vscode.TextDocument` and returns `string[] | Promise<string[]>` — an array of directory paths to include.

**Returns:**
- `vscode.Disposable`: A disposable object that can be used to unregister the provider.

**Example:**
```typescript
import * as vscode from 'vscode';

const disposable = vscode.extensions.getExtension('VincesCodes.click-file')?.exports.registerIncludePathProvider(
  (document: vscode.TextDocument) => {
    // Return include paths based on document properties
    if (document.languageId === 'cpp') {
      return ['/usr/local/include', '/opt/my-lib/include'];
    }
    return [];
  }
);
```

### `unregisterIncludePathProvider(provider)`

Remove a previously registered include path provider.

```typescript
function unregisterIncludePathProvider(provider: IncludePathProvider): void;
```

**Parameters:**
- `provider` *(IncludePathProvider)*: The function that was previously registered.

**Example:**
```typescript
import * as vscode from 'vscode';

const myProvider = (doc: vscode.TextDocument) => ['/my/path'];

// Register
const disposable = vscode.extensions.getExtension('VincesCodes.click-file')?.exports.registerIncludePathProvider(myProvider);

// Unregister later
vscode.extensions.getExtension('VincesCodes.click-file')?.exports.unregisterIncludePathProvider(myProvider);
```

## Types

### `IncludePathProvider`

```typescript
type IncludePathProvider = (
  document: vscode.TextDocument
) => string[] | Promise<string[]>;
```

A callback function that receives the current document being analyzed and returns an array of directory paths. The function can be synchronous or asynchronous.

## Usage Patterns

### Basic Synchronous Provider

```typescript
const disposable = clickFileAPI.registerIncludePathProvider((document) => {
  // Simple synchronous return
  return ['/usr/include', '/usr/local/include'];
});
```

### Asynchronous Provider

```typescript
const disposable = clickFileAPI.registerIncludePathProvider(async (document) => {
  // Async operations are supported
  const config = await vscode.workspace.getConfiguration('myExtension');
  const customPaths = config.get<string[]>('includePaths', []);
  return customPaths;
});
```

### Language-Specific Provider

```typescript
const disposable = clickFileAPI.registerIncludePathProvider((document) => {
  switch (document.languageId) {
    case 'cpp':
      return getCppIncludePaths(document);
    case 'rust':
      return getRustIncludePaths(document);
    case 'go':
      return getGoModulePaths(document);
    default:
      return [];
  }
});
```

### Document-Context Provider

```typescript
const disposable = clickFileAPI.registerIncludePathProvider((document) => {
  // Use document metadata to determine include paths
  const workspacePath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
  if (workspacePath) {
    return [
      path.join(workspacePath, 'include'),
      path.join(workspacePath, 'src'),
    ];
  }
  return [];
});
```

### Project Configuration Based Provider

```typescript
const disposable = clickFileAPI.registerIncludePathProvider(async (document) => {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) return [];

  // Read CMakeLists.txt or other config files
  const cmakePath = path.join(workspaceFolder.uri.fsPath, 'CMakeLists.txt');
  const includes: string[] = [];

  try {
    const content = await fs.promises.readFile(cmakePath, 'utf8');
    const matches = content.match(/include_directories\s*\(([^)]+)\)/g);
    // Parse and extract paths...
  } catch {
    // CMakeLists.txt not found
  }

  return includes;
});
```

## Integration Example

Complete example showing how to integrate with Click-File in your extension's `extension.ts`:

```typescript
import * as vscode from 'vscode';

let clickFileAPI: any = null;
let myProviderDisposable: vscode.Disposable | null = null;

export function activate(context: vscode.ExtensionContext) {
  // Wait for click-file to activate
  const checkClickFile = setInterval(() => {
    const clickFileExt = vscode.extensions.getExtension('VincesCodes.click-file');
    if (clickFileExt && clickFileExt.isActive) {
      clickFileAPI = clickFileExt.exports;
      
      // Register our provider
      myProviderDisposable = clickFileAPI.registerIncludePathProvider(
        (document: vscode.TextDocument) => {
          // Your logic here
          if (document.languageId === 'cpp') {
            return ['/usr/local/include/c++'];
          }
          return [];
        }
      );
      
      clearInterval(checkClickFile);
    }
  }, 100);
  
  // Cleanup on deactivate
  context.subscriptions.push({
    dispose: () => {
      clearInterval(checkClickFile);
      if (myProviderDisposable) {
        myProviderDisposable.dispose();
      }
    }
  });
}

export function deactivate() {
  if (myProviderDisposable) {
    myProviderDisposable.dispose();
  }
}
```

Or a more robust approach using `onDidActivateExtension` (if available):

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const registerProvider = async () => {
    const clickFileExt = vscode.extensions.getExtension('VincesCodes.click-file');
    if (clickFileExt) {
      await clickFileExt.activate();
      const api = clickFileExt.exports;
      
      const disposable = api.registerIncludePathProvider((doc) => {
        // Your provider logic
        return getIncludePathsForDocument(doc);
      });
      
      context.subscriptions.push(disposable);
    }
  };

  // Try immediately and on extension activation
  registerProvider();
  vscode.extensions.onDidChange(() => registerProvider());
}
```

## Behavior

- Provider callbacks are executed **each time** a document is analyzed (on file open, edit, or when code lenses/document links are refreshed)
- Multiple providers can be registered; all will be called
- Results from all providers are **merged** with static `click-file.includePaths` configuration
- Static include paths take precedence (are checked first)
- If a provider throws an error, it is caught and logged, but other providers still execute
- All returned paths are processed through `fixIncludePaths()` for environment variable and `~` expansion

## Error Handling

Providers should handle their own errors gracefully. Any errors thrown by a provider will be:
1. Caught and logged by Click-File
2. Not propagate to other providers
3. Not affect the operation of Click-File

```typescript
// Good: Handle errors within the provider
const disposable = clickFileAPI.registerIncludePathProvider(async (document) => {
  try {
    return await getPathsAsync(document);
  } catch (error) {
    console.error('My extension error:', error);
    return []; // Return empty array on error
  }
});
```

## Path Format

Returned paths should be:
- Absolute file system paths (recommended)
- Or relative paths (will be resolved relative to the workspace)
- Can use `~` for home directory (will be expanded)
- Can use environment variables like `$HOME` or `${VAR}` (will be expanded)

Example paths:
```typescript
['/usr/local/include']                // Absolute path
['~/projects/my-lib/include']        // Home directory expansion
['$WORKSPACE Root/include']           // Environment variable
['${PROJECT_ROOT}/dependencies']      // Brace syntax
```

## Best Practices

1. **Filter by language**: Only return paths for relevant file types to improve performance
2. **Cache results**: Cache expensive computations (e.g., parsing config files)
3. **Handle errors**: Don't let provider errors affect the user experience
4. **Return quickly**: Providers should complete quickly to avoid UI delays
5. **Check document state**: Consider if the document is saved, dirty, etc.
6. **Use workspace context**: Base paths on the document's workspace folder when possible

## Migration Notes

This API is available starting from Click-File v1.5.0. Earlier versions do not support dynamic include paths.

To check if the API is available:
```typescript
const clickFileExt = vscode.extensions.getExtension('VincesCodes.click-file');
if (clickFileExt?.exports?.registerIncludePathProvider) {
  // API is available
}
```

## Related Configuration

Users can also configure static include paths via VSCode settings:
```json
{
  "click-file.includePaths": [
    "/usr/local/include",
    "~/projects/common/include"
  ]
}
```

These static paths are combined with paths from registered providers.
