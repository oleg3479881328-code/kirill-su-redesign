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

- `script.js` reads `content.json` and renders section cards, media, and the original text stream.
- The page now shows whether the current build used the live source or a fallback snapshot.
- The redesign still preserves an auditable raw-text section and a link to the original source or saved HTML.

## Next Practical Step

Enable GitHub Pages with `build_type=workflow`, push the updated workflow, and verify the public URL after a successful Actions deploy.

## Known Notes

- The extractor remains intentionally dependency-light and regex-based.
- The project does not manually maintain source text in application code; the build artifact remains the preservation layer.
