# PROJECT_STATE

## Status

Implemented initial GitHub Pages-ready static redesign.

## Current Build Model

`build.js` fetches the source page during deployment and writes:

- `dist/content.json`
- `dist/original.html`

The frontend reads `content.json` and renders the redesigned page.

## Current Files

- `.nojekyll`
- `index.html`
- `styles.css`
- `script.js`
- `build.js`
- `.github/workflows/pages.yml`
- `PROJECT.md`
- `AGENTS.md`

## Next Step

Enable GitHub Pages using GitHub Actions and run the deployment workflow.

## Known Notes

The repository does not manually store the full extracted source text in committed files. The build stores it in the generated deploy artifact from the public source URL.
