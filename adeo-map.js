// Detailed OpenStreetMap basemap that works inside Gemini Enterprise Canvas.
// Map data, fonts and icons are packaged as ES modules on jsDelivr (allowed by Canvas),
// and MapLibre draws the map in the browser. No tile server, no API key.
//
// Usage:
//   const { createMap } = await import('https://cdn.jsdelivr.net/gh/djarvlejon/map-tiles@main/adeo-map.js');
//   const map = await createMap('map', { center: [26.10, 44.43], zoom: 6 });
//   // then use the normal MapLibre API (map.addSource / map.addLayer / new maplibregl.Popup ...)
//
// Map data © OpenStreetMap contributors (ODbL), via Protomaps. Keep the attribution visible.

const REPO = 'https://cdn.jsdelivr.net/gh/djarvlejon/map-tiles@';
const MAIN = REPO + 'main/';
const MAPLIBRE = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.1/dist/';

let ready = null;
let manifest = null;

function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}

function b64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function branchFor(kind, z, x) {
  for (const country of Object.values(manifest)) {
    const ranges = country[kind] && country[kind][z];
    if (!ranges) continue;
    for (const [x0, x1, branch] of ranges) if (x >= x0 && x <= x1) return branch;
  }
  return null;
}

async function setup() {
  loadCss(MAPLIBRE + 'maplibre-gl.css');
  if (!window.maplibregl) await loadScript(MAPLIBRE + 'maplibre-gl.js');
  manifest = (await import(MAIN + 'manifest.js')).default;
  const empty = () => ({ data: new ArrayBuffer(0) });

  window.maplibregl.addProtocol('adeomap', async (params) => {
    const path = params.url.slice('adeomap://'.length);

    let m = path.match(/^(base|city)\/(\d+)\/(\d+)\/(\d+)/);
    if (m) {
      const [, kind, z, x, y] = m;
      const branch = branchFor(kind, +z, +x);
      if (!branch) return empty();
      try {
        const mod = await import(`${REPO}${branch}/${kind}/${z}/${x}/${y}.js`);
        return { data: b64(mod.default) };
      } catch (e) {
        return empty();
      }
    }

    m = path.match(/^fonts\/([^/]+)\/(\d+-\d+)/);
    if (m) {
      const stack = decodeURIComponent(m[1]).split(',')[0].trim();
      try {
        const mod = await import(`${MAIN}fonts/${encodeURIComponent(stack)}/${m[2]}.js`);
        return { data: b64(mod.default) };
      } catch (e) {
        return empty();
      }
    }

    m = path.match(/^sprites\/(light(?:@2x)?)\.(json|png)/);
    if (m) {
      const mod = await import(`${MAIN}sprites/${m[1]}.${m[2]}.js`);
      return { data: m[2] === 'png' ? b64(mod.default) : mod.default };
    }

    return empty();
  });
}

export async function createMap(container, options = {}) {
  if (!ready) ready = setup();
  await ready;
  const style = (await import(MAIN + 'style.js')).default;
  const map = new window.maplibregl.Map({
    container,
    style,
    center: options.center || [10, 48],
    zoom: options.zoom ?? 4,
    maxZoom: options.maxZoom ?? 18,
    attributionControl: { compact: false },
    ...options.mapOptions,
  });
  map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  await new Promise((resolve) => map.once('load', resolve));
  return map;
}

export function coverage() {
  return manifest;
}
