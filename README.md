# AI Website Clone Template

A reusable template for reverse-engineering any website and rebuilding it as a pixel-perfect clone using Cursor Agent.

Point it at a URL, run `/clone-website`, and Cursor Agent will inspect the site via browser automation/MCP, extract design tokens and assets, write component specs, and dispatch parallel builder agents to reconstruct every section — all in isolated git worktrees that merge automatically.

## Quick Start

1. **Use this template** — click "Use this template" on GitHub (or clone it)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Edit `TARGET.md`** — set URL, scope, and fidelity level
4. **Run the skill** in Cursor Chat:
   ```
   /clone-website <url>
   ```
5. **Customize** (optional) after the base clone is complete

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Cursor](https://www.cursor.com/) with agent mode enabled
- Browser automation / MCP enabled (required for site inspection)

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **Lucide React** — default icons (replaced by extracted SVGs during cloning)

## How It Works

The `/clone-website` skill runs a multi-phase pipeline:

1. **Reconnaissance** — screenshots, design token extraction, interaction sweep (scroll/click/hover/responsive)
2. **Foundation** — fonts, colors, globals, and assets
3. **Component Specs** — detailed spec files in `docs/research/components/`
4. **Parallel Build** — multiple builder agents in git worktrees
5. **Assembly & QA** — merges, integration, visual diff, and behavior checks

Each builder agent receives exact `getComputedStyle()` values, interaction models, per-state content, responsive breakpoints, and asset paths.

## Cursor-Specific Notes

- Persistent AI rules live in `.cursor/rules/*.mdc`.
- Cursor skill path: `.cursor/skills/clone-website/SKILL.md`.

## Project Structure

```
src/
  app/               # Next.js routes
  components/        # React components
    ui/              # shadcn/ui primitives
    icons.tsx        # Extracted SVG icons
  lib/utils.ts       # cn() utility
  types/             # TypeScript interfaces
  hooks/             # Custom React hooks
public/
  images/            # Downloaded images from target
  videos/            # Downloaded videos from target
  seo/               # Favicons, OG images
docs/
  research/          # Extraction output & component specs
  design-references/ # Screenshots
scripts/             # Asset download scripts
TARGET.md            # Clone target configuration
.cursor/rules/       # Cursor project rules (.mdc)
.cursor/skills/      # Cursor project skills
```

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint check
```

## Configuration

Edit **`TARGET.md`** before cloning:

- **URL** — site to reverse-engineer
- **Pages** — pages to replicate
- **Fidelity** — pixel-perfect / high fidelity / structural
- **Scope** — in/out of scope
- **Customization plans** — post-clone modifications

## License

MIT
