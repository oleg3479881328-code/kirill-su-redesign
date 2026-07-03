# kirill-su-redesign

## Project

- Name: `kirill-su-redesign`
- Type: static website redesign / GitHub Pages project
- Description: modern static redesign layer for the public site `https://kirill.su/`.

## Purpose

Create a separate GitHub repository that publishes a redesigned modern version of the source site while keeping the source information recoverable from the original URL.

## Source Of Truth

- Code and deployment workflow: this GitHub repository.
- Source content: `https://kirill.su/`, captured during the build step into the deploy artifact.

## Source Trail

- Source URL: `https://kirill.su/`
- Repository: `oleg3479881328-code/kirill-su-redesign`
- Build output: `dist/content.json` and `dist/original.html` after `node build.js`.

## Current Status

- Initialized and implemented as a static GitHub Pages-ready site.
- Uses an automated source snapshot builder instead of manually maintaining page text inside application code.

## Done So Far

- Added animated frontend shell.
- Added responsive CSS.
- Added content renderer.
- Added source snapshot builder.
- Added GitHub Pages workflow.

## Current Focus

Validate GitHub Pages deployment and visual quality.

## Next Practical Step

Enable GitHub Pages with GitHub Actions as the source, then run the deployment workflow.

## Key Decisions And Constraints

- Preserve source information through an automated snapshot of the original public page.
- Do not manually rewrite source content in the design layer.
- Existing Solution First applies before replacing the simple static approach with a heavier framework.

## Read Next

- `README.md`
- `.github/workflows/pages.yml`
- `build.js`
