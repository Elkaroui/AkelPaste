# Akel

Akel is a desktop template manager for people who send the same messages again and again.

It helps you save reusable replies, organize them into collections, assign keyboard shortcuts, and keep important templates pinned in a small floating window for fast access.

## What You Can Do

- Create and edit reusable text templates
- Organize templates with collections for faster filtering
- Search templates quickly from the main window
- Assign global keyboard shortcuts to templates
- Pin important templates to a floating always-on-top window
- Copy template content instantly to the clipboard
- Use custom emoji or image-based icons for templates
- Export and import your data for backup

## Good For

- creator outreach
- customer support replies
- sales follow-ups
- repeated internal notes
- quick copy-and-paste workflows

## Platforms

Akel is built with Tauri and released for:

- Windows
- macOS
- Linux AppImage

Downloads are available from the [GitHub Releases](https://github.com/Elkaroui/AkelPaste/releases).

## Tech Stack

- Tauri 2
- React
- TypeScript
- Vite
- Tailwind CSS

## Local Development

Requirements:

- Node.js
- pnpm
- Rust

Install dependencies:

```bash
pnpm install
```

Run the app in development:

```bash
pnpm tauri dev
```

Build the frontend:

```bash
pnpm build
```

Build desktop bundles:

```bash
pnpm tauri build
```

## Releases

GitHub Actions builds release bundles for:

- Windows: `msi` and `nsis`
- macOS: `dmg`
- Linux: `AppImage`

## Project Goal

This project started as an Electron app and was migrated to Tauri while keeping the same workflow, UI direction, and core features, with a lighter desktop runtime.
