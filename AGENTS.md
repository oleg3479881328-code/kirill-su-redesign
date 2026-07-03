# AGENTS.md

This repository operates under Project Execution OS.

## Entry Order

1. Read `PROJECT.md` first.
2. Read only the files needed for the current task.
3. Do not mass-scan unrelated files unless required.

## Project Rules

- Keep project files in this repository.
- Prefer simple static-site solutions before adding frameworks.
- Preserve the source trail for the original public site.
- Do not manually rewrite source page content when the snapshot builder can recover it from the source URL.
- Keep deployment compatible with GitHub Pages.

## Useful Files

- `PROJECT.md` — project entrypoint.
- `index.html` — frontend shell.
- `styles.css` — design layer.
- `script.js` — UI renderer.
- `build.js` — source snapshot builder.
- `.github/workflows/pages.yml` — deployment workflow.
