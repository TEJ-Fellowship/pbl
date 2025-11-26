# How to Show Hidden Files in VS Code on Mac

## The Issue

Files starting with a dot (like `.gitignore`, `.env`, `.DS_Store`) are **hidden files** on Unix-based systems (Mac, Linux). VS Code on Mac hides these by default, while Windows might show them differently.

## Solution: Show Hidden Files in VS Code

### Method 1: VS Code Settings (Recommended)

1. Open VS Code Settings:

   - Press `Cmd + ,` (Command + Comma)
   - Or go to: **Code → Settings → Settings**

2. Search for: `files.exclude`

3. Look for patterns that hide dotfiles, such as:

   - `"**/.git": true`
   - `"**/.*": true`

4. Remove or modify these patterns to show hidden files

### Method 2: Edit settings.json Directly

1. Press `Cmd + Shift + P` to open Command Palette
2. Type: `Preferences: Open User Settings (JSON)`
3. Add or modify this setting:

```json
{
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true
    // Remove "**/.*": true if it exists
  },
  "files.associations": {
    ".gitignore": "gitignore"
  }
}
```

### Method 3: Show in File Explorer

1. In VS Code's file explorer sidebar
2. Right-click in the file explorer
3. Look for "Show Hidden Files" option (if available in your VS Code version)

### Method 4: Terminal Command (Alternative)

You can always view/edit hidden files via terminal:

```bash
# View .gitignore
cat .gitignore

# Edit .gitignore
code .gitignore

# Or use nano/vim
nano .gitignore
```

## Why Mac vs Windows/Linux Differs

- **Mac/Linux**: Follows Unix convention where dotfiles are hidden by default
- **Windows**: Doesn't have the same dotfile convention, so they might appear differently
- **VS Code**: Respects the OS conventions, but you can override them

## Quick Check

To verify hidden files are visible:

1. Create a test file: `touch .testfile`
2. Check if it appears in VS Code file explorer
3. If not, follow Method 1 or 2 above

## Your Project's .gitignore

I've created a `.gitignore` file for your project. Even if you can't see it in VS Code's file explorer, you can:

1. **Open it directly**: `Cmd + P` → type `.gitignore` → Enter
2. **Use terminal**: `code .gitignore`
3. **Check git status**: `git status` will show if it's being tracked

The file exists and will work even if not visible in the file explorer!
