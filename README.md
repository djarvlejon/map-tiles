# map-tiles

Detailed OpenStreetMap basemap for apps generated in Gemini Enterprise Canvas, whose security policy blocks every map tile server but allows code modules from jsDelivr.

- `adeo-map.js`: loader. `const { createMap } = await import('https://cdn.jsdelivr.net/gh/djarvlejon/map-tiles@main/adeo-map.js'); const map = await createMap('map', { center: [lon, lat], zoom });`
- `main` branch: loader, style, fonts, icons, coverage index.
- Data branches (`<country>-base-NNN`, `<country>-city-NNN`): vector map data as ES modules, each branch under jsDelivr's 50 MB limit.

Coverage: Romania down to town level (zoom 12, overzoomed beyond), Bucharest down to street level (zoom 15).

Map data © OpenStreetMap contributors, ODbL, via Protomaps (build 2026-11-18). Style: Protomaps basemaps (BSD-3-Clause). Fonts: Noto Sans (OFL).
