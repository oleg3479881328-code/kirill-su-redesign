# PROJECT_STATE

## Status

Static redesign is implemented and locally verified on 2026-07-03.

## Verified on 2026-07-03

- `node build.js` succeeds locally.
- `dist/` is produced with:
  - `index.html`
  - `styles.css`
  - `script.js`
  - `content.json`
  - `original.html`
  - `.nojekyll`
- Public-facing UI has been refocused from parser/audit presentation to a real resident-facing website layout.
- Original header image from `kirill.su` is extracted separately as `heroImage` and restored as the main visual in the redesigned hero.
- Extracted snapshot contains the required issue themes:
  - payments / repair
  - initiative neighbor / management conflict
  - barrier project history
  - meeting / handoff / neutral candidate
  - financial reporting
  - taxi / access regulation
  - personal data / publication rules
  - images and external document links
- Current GitHub Actions failure cause was identified: Pages itself was not enabled for the repository yet, so `actions/configure-pages` returned `404 Not Found`.

## Current Build Model

`build.js` fetches the public source page and writes a deployable snapshot into `dist/`.

The output now includes build status metadata:

- `fetchOk`
- `warnings`
- `pageTitle`

If the live fetch fails, the builder creates a graceful fallback artifact instead of aborting the whole deployment.

## Current Frontend Model

- `script.js` reads `content.json` and renders human sections for residents instead of exposing the raw snapshot stream in the public UI.
- The hero now prefers `heroImage`, which is extracted from the original page cover before falling back to ordinary gallery images.
- Public navigation is organized around resident-facing sections such as contributions, history, position, meeting, handoff, finance, access, and personal data.

## Next Practical Step

Push the restored public redesign, verify GitHub Pages deployment, and confirm desktop/mobile rendering on the public URL.

## Known Notes

- The extractor remains intentionally dependency-light and regex-based.
- The project does not manually maintain source text in application code; the build artifact remains the preservation layer.
- Technical snapshot/debug concepts can remain in the repository internals, but should stay invisible in the public UI.
