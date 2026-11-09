# Nihon School of Japanese Language – website

Static site (HTML/CSS/vanilla JS) for GitHub Pages. No build step.

- `index.html`, `404.html`, `sitemap.xml`, `robots.txt`, `CNAME` (keep!) live in the root.
- `css/` styles · `js/` ES modules · `data/translations.js` EN/JA/UR text · `assets/` images, fonts, pinned vendor libs.

## Configure
1. **Contact form:** get a free key at https://web3forms.com and replace `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html` (until then the form falls back to opening the visitor's email app).
2. **Team:** photos in `assets/img/` (`adil-rashid`, `mj-akbar`, `abdulrehman`, square 480×480, .jpg + .webp); bios in `data/translations.js`.
4. **News / Gallery / Certificates:** images in `assets/media/` (`name.webp` full size + `name-t.webp` thumbnail), video in `assets/video/`. Markup is in `index.html` (sections `#news`, `#gallery`, `.certs`); captions and texts are `news.*`, `g.*`, `cert.*` keys in `data/translations.js`. To add a gallery item: copy one `<li class="gal__item">`, change the file names, `data-cap` key and `data-w`/`data-h`, then add the `g.<name>` caption in all 3 languages.
5. `raw_image/` (original photos) is git-ignored on purpose; keep it locally.
3. **Proofread** the Japanese and Urdu blocks in `data/translations.js`.

## Preview locally
`python3 -m http.server 8000` then open http://localhost:8000
