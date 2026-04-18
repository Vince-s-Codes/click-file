![Click-File Icon](media/icon.png)
# Click-File

This extension highlights file paths in your code and makes them clickable. You can open files directly in VS Code or use an external tool.

## Features

This extension detects file paths in your code, underlines them, and provides an **"Open"** button via CodeLens. It supports the following file path formats:

- Absolute paths: `/path/to/file.txt`
- Relative paths: `./relative/path/file.txt` or `../parent/path/file.txt`
- Paths with environment variables: `$HOME/file.txt` or `~/file.txt`
- Paths with line numbers: `file.txt:42`, `file.txt@42`, `file.txt#42`, `file.txt,42`, or `file.txt|42`
- Paths with line and column numbers: `file.txt:42:1`, `file.txt@42@1`, `file.txt#42#1`, `file.txt,42,1`, or `file.txt|42|1`

![Example](media/example.png)

### Core Functionality
- **File Path Detection**: Detects and underlines file paths in your code for visual feedback.
- **CodeLens Actions**: Shows an **"Open"** button above detected file paths. Click the button to:
  - Open the file in VS Code (at the specified line/column, if provided).
  - Open the file with an external tool (e.g., image viewer, editor).
- **Path Remapping**: Remap parts of directory paths to other locations (e.g., map `~` to `/home/user` or `/old/path` to `/new/path`).

### Configuration
The extension provides several configuration options to customize its behavior:

- **`click-file.externalFiles`**: Configure external tools to open specific file types or patterns.
- **`click-file.externalDirectories`**: Configure external tools to open directories.
- **`click-file.remapDirectories`**: Remap directory paths to other locations.

See the [Extension Settings](#extension-settings) section for more details.

## Extension Settings

This extension contributes the following settings:

### `click-file.externalFiles`
Configure external tools to open files. Example:
```json
"click-file.externalFiles": [
  {
    "tool": "EOG",
    "command": "/usr/bin/eog %f",
    "types": [],
    "patterns": ["*.png"]
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
