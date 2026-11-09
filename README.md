# Nihon School of Japanese Language – website

Static site (HTML/CSS/vanilla JS) for GitHub Pages. No build step.

- `index.html`, `404.html`, `sitemap.xml`, `robots.txt`, `CNAME` (keep!) live in the root.
- `css/` styles · `js/` ES modules · `data/translations.js` EN/JA/UR text · `assets/` images, fonts, pinned vendor libs.

## Configure
1. **Contact form:** get a free key at https://web3forms.com and replace `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html` (until then the form falls back to opening the visitor's email app).
2. **Team:** replace `assets/img/teacher-placeholder.svg` / `mj-akbar.*`; edit bios in `data/translations.js`.
3. **Proofread** the Japanese and Urdu blocks in `data/translations.js`.

## Preview locally
`python3 -m http.server 8000` then open http://localhost:8000
