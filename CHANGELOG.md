# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-24

### Fixed

- **Link Creation**:
  - Fixed unexpected link creation (#12)
  - Fixed current file link (#11)
  - Fixed directories in link (#9)

## [1.1.0] - 2026-04-19

### Added

- **New Link Style Configuration**:
  - Added `click-file.linkStyle` setting to choose between CodeLens buttons and native document links
  - Options: `codelens` (default) or `documentlink`
  - Dynamically switches between styles when configuration changes

- **Enhanced Path Support**:
  - Added support for TCL environment variables in paths
  - Improved line number detection in paths with parentheses (e.g., `file.txt(42)`)

### Fixed

- **Visual Improvements**:
  - Fixed issue with underlining-only behavior (#6)
  - Properly applies underlining to all detected file paths

- **Link Functionality**:
  - Fixed native document link implementation (#5)
  - Links now properly open files at specified line/column positions

- **Path Parsing**:
  - Fixed line number detection between parentheses (#3)
  - Added proper support for TCL environment variables (#1)

### Changed

- **Default Behavior**:
  - Changed default link style to `codelens` for backward compatibility
  - Document links are now opt-in via configuration

- **Performance**:
  - Improved provider disposal and recreation when switching styles
  - Reduced unnecessary processing when links shouldn't be provided

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
  - Falls back to remapped paths if the original path doesn't exist.
- **Performance:**
  - Decorations and CodeLens are updated dynamically as files are edited.
  - Uses VS Code's `TextEditorDecorationType` for efficient rendering.
- **Error Handling:**
  - Silently skips invalid paths (logs errors to console).

### Limitations
- Does not support remote files (e.g., `ssh://` or `http://` URLs).
- Path detection relies on regex patterns (may miss edge cases).