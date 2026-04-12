# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-12

### Added

- **Core Features:**
  - Detects and highlights file paths in code (e.g., `/path/to/file.txt`, `./relative/path`).
  - Adds clickable actions to open files directly in VS Code.
  - Supports opening files in external tools (e.g., image viewers, editors).

- **Configuration Options:**
  - `click-file.externalFiles`: Configure external tools to open specific file types/patterns (e.g., PNGs in an image viewer).
    Example:
    ```json
    {
      "tool": "EOG",
      "command": "/usr/bin/eog %f",
      "types": ["png"],
      "patterns": ["*.png"]
    }
    ```
  - `click-file.externalDirectories`: Configure tools to open directories (e.g., file explorer).
    Example:
    ```json
    {
      "tool": "Explorer",
      "command": "explorer %d",
      "patterns": ["docs", "src"]
    }
    ```
  - `click-file.remapDirectories`: Remap paths (e.g., `~` to `/home/user` or `/old/path` to `/new/path`).
    Example:
    ```json
    {
      "/old/path": ["/new/path1", "/new/path2"],
      "~": ["/mnt/c/Users/username"]
    }
    ```

- **UI/UX:**
  - Underlines detected file paths for visual feedback.
  - Provides CodeLens actions (e.g., "Open" or "Open with [Tool]") above file paths.
  - Supports line/column numbers (e.g., `file.txt:42:1` opens at line 42, column 1).

### Technical Details
- **Path Resolution:**
  - Resolves absolute/relative paths and checks file existence.
  - Falls back to remapped paths if the original path doesn’t exist.
- **Performance:**
  - Decorations and CodeLens are updated dynamically as files are edited.
  - Uses VS Code’s `TextEditorDecorationType` for efficient rendering.
- **Error Handling:**
  - Silently skips invalid paths (logs errors to console).

### Limitations
- Does not support remote files (e.g., `ssh://` or `http://` URLs).
- Path detection relies on regex patterns (may miss edge cases).
