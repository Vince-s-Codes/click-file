# Click-File

This extension highlights file paths in your code and makes them clickable. You can open files directly in VS Code or use an external tool.

## Features

- **Clickable File Paths**: File paths in your code are highlighted and clickable.
- **Open in VS Code**: Click on a file path to open it directly in VS Code.
- **Open with External Tool**: Configure external tools to open files with a right-click context menu.

## Extension Settings

This extension contributes the following settings:

### `click-file.externalFiles`
Configure external tools to open files. Example:
```json
"click-file.externalFiles": [
  {
    "tool": "logexplorer",
    "command": "~/bin/logexplorer %f",
    "types": ["log"],
    "patterns": ["*.log"]
  }
]
```
- `tool`: Name of the tool (displayed in the context menu).
- `command`: Command to execute (use `%f` as a placeholder for the file path and `%n` for the line number).
- `types`: (Optional) File extensions this tool should be available for (e.g., `["log", "txt"]`).
- `patterns`: (Optional) File name patterns this tool should be available for (e.g., `["*.log", "error_*"]`).

### `click-file.externalDirectories`
Configure external tools to open directories. Example:
```json
"click-file.externalDirectories": [
  {
    "tool": "explorer",
    "command": "explorer %d",
    "patterns": ["docs", "src"]
  }
]
```
- `tool`: Name of the tool (displayed in the context menu).
- `command`: Command to execute (use `%d` as a placeholder for the directory path).
- `patterns`: (Optional) Directory name patterns this tool should be available for (e.g., `["docs", "src"]`).

### `click-file.remapDirectories`
Remap part of a directory path with another directory path. Example:
```json
"click-file.remapDirectories": {
  "/old/path": ["/new/path1", "/new/path2"],
  "~": ["/mnt/c/Users/username"]
}
```
- Keys: Directory paths to match (supports `~` for home directory and environment variables like `$HOME`).
- Values: Array of replacement directory paths.

### 1.0.0

- Initial release
- Added clickable file paths
- Added support for opening files in VS Code
- Added support for opening files with external tools