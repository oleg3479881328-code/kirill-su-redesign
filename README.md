# kirill-su-redesign

Static redesign for `https://kirill.su/` that keeps the source trail recoverable instead of manually rewriting the page content.

## What the build produces

Running `node build.js` creates `dist/` with:

- `dist/index.html`
- `dist/styles.css`
- `dist/script.js`
- `dist/content.json`
- `dist/original.html`
- `dist/.nojekyll`

`content.json` contains the extracted visible text, images, links, timestamps, and fetch status. `original.html` preserves the raw fetched page for audit.

## Files

- `index.html` - frontend shell
- `styles.css` - visual design
- `script.js` - content renderer and UI behavior
- `build.js` - source snapshot builder
- `.github/workflows/pages.yml` - GitHub Pages deployment
- `PROJECT.md` - project entrypoint
- `PROJECT_STATE.md` - current verified status

## Local run

Build the snapshot:

```bash
node build.js
```

Preview the generated site:

```bash
python -m http.server 4173 --directory dist
```

Open `http://localhost:4173`.

## Build behavior

- The build fetches `https://kirill.su/` during execution.
- The rendered page reads only from the generated snapshot files in `dist/`.
- If the source fetch fails, the builder now creates a graceful fallback artifact instead of crashing the whole site build.
- If a previous local `dist/content.json` and `dist/original.html` already exist, they are reused as the fallback snapshot.

## GitHub Pages deployment

This repository is intended to publish with GitHub Actions and deploy the generated `dist/` folder.

### One-time Pages enablement

If Pages is not enabled yet, configure the repository to use the Actions workflow source:

```bash
gh api -X POST repos/oleg3479881328-code/kirill-su-redesign/pages ^
  -f build_type=workflow ^
  -f source[branch]=main ^
  -f source[path]=/
```

If the site already exists, update it instead:

```bash
gh api -X PUT repos/oleg3479881328-code/kirill-su-redesign/pages ^
  -f build_type=workflow ^
  -f source[branch]=main ^
  -f source[path]=/
```

### Deploy

Push to `main` or run the workflow manually:

```bash
gh workflow run pages.yml --repo oleg3479881328-code/kirill-su-redesign
```

Then check the latest run:

```bash
gh run list --repo oleg3479881328-code/kirill-su-redesign --workflow pages.yml --limit 5
```

## Known limitation

The extractor is intentionally lightweight and regex-based to keep the project framework-free. It preserves the visible source stream well enough for this site, but it is not a full DOM semantics parser.
