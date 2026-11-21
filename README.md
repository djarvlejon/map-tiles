# map-tiles

Detailed OpenStreetMap basemap for apps generated in Gemini Enterprise Canvas, whose security policy blocks every map tile server but allows code modules from jsDelivr.

- `adeo-map.js`: loader. `const { createMap } = await import('https://cdn.jsdelivr.net/gh/djarvlejon/map-tiles@main/adeo-map.js'); const map = await createMap('map', { center: [lon, lat], zoom });`
- `main` branch: loader, style, fonts, icons, coverage index.
- Data branches `b-NNN` (country-wide, zoom 0-10) and `d-NNN` (street detail, zoom 11-14) in this repo and in `map-tiles-2`, `map-tiles-3`, `map-tiles-4`. `manifest.js` says which repo and branch holds each tile. Each branch stays under jsDelivr's 50 MB limit.

Coverage: France, Spain, Portugal, Italy, Poland, Romania, Greece, Cyprus, Ukraine, Brazil and South Africa down to zoom 10 (towns, main roads); Romania to zoom 12 country-wide; street level (zoom 14, sharp to zoom 18) within about 6 km of 514 Leroy Merlin stores mapped in OpenStreetMap, plus Bucharest.

Pin a commit in apps (`map-tiles@<commit>/adeo-map.js`): the `@main` alias is cached by jsDelivr for up to 12 hours.

Map data © OpenStreetMap contributors, ODbL, via Protomaps (build 2026-11-18). Style: Protomaps basemaps (BSD-3-Clause). Fonts: Noto Sans (OFL).
