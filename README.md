# kirill-su-redesign

Modern static redesign for the public source site.

## Files

- `index.html` — frontend shell
- `styles.css` — responsive visual design
- `script.js` — renderer and UI animation
- `build.js` — source snapshot builder
- `.github/workflows/pages.yml` — Pages deployment
- `PROJECT.md` — project entrypoint

## Local preview

Run:

```bash
node build.js
python3 -m http.server 4173 --directory dist
```

Open:

```text
http://localhost:4173
```

## Deployment

Use GitHub Pages with GitHub Actions as the Pages source.
