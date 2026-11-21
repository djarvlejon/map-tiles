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

const GH = 'https://cdn.jsdelivr.net/gh/djarvlejon/';
const MAIN = new URL('./', import.meta.url).href; // same version as this loader
// MapLibre 5.24.1, patched so it does not read the parent page address (blocked inside Canvas).
const MAPLIBRE = MAIN;

let ready = null;
const VERSION = '3';
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

function refFor(kind, z, x) {
  const ranges = manifest[kind] && manifest[kind][z];
  if (!ranges) return null;
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, [x0, x1, ref] = ranges[mid];
    if (x < x0) hi = mid - 1; else if (x > x1) lo = mid + 1; else return ref;
  }
  return null;
}

async function setup() {
  loadCss(MAPLIBRE + 'maplibre-gl.css');
  if (!window.maplibregl || !window.maplibregl.__adeo) await loadScript(MAPLIBRE + 'maplibre-gl.js');
  window.maplibregl.__adeo = true;
  manifest = (await import(MAIN + 'manifest.js')).default;
  const empty = () => ({ data: new ArrayBuffer(0) });

  window.maplibregl.addProtocol('adeomap', async (params) => {
    const path = params.url.slice('adeomap://'.length);

    let m = path.match(/^(base|detail)\/(\d+)\/(\d+)\/(\d+)/);
    if (m) {
      const [, kind, z, x, y] = m;
      const ref = refFor(kind, +z, +x);
      if (!ref) return empty();
      try {
        const mod = await import(`${GH}${ref}/t/${z}/${x}/${y}.js`);
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

function statusBox(container) {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  if (!host) return { set() {}, done() {} };
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  if (host.clientHeight < 50) host.style.minHeight = '400px';
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:9999;font:12px sans-serif;background:rgba(255,255,255,.9);color:#333;padding:4px 8px;border-radius:4px;pointer-events:none';
  host.appendChild(box);
  return {
    set(t, err) { box.textContent = t; if (err) { box.style.color = '#b00020'; box.style.pointerEvents = 'auto'; } },
    done() { box.remove(); },
  };
}

export async function createMap(container, options = {}) {
  const status = statusBox(container);
  try {
    status.set('Loading map engine...');
    if (!ready) ready = setup();
    await ready;
    status.set('Loading map style...');
    const map = await build(container, options, status);
    status.done();
    return map;
  } catch (e) {
    status.set('Map error: ' + (e && e.message ? e.message : e), true);
    throw e;
  }
}

async function build(container, options, status) {
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
  map.on('error', (e) => status.set('Map error: ' + (e.error && e.error.message ? e.error.message : 'unknown'), true));
  status.set('Drawing map...');
  await new Promise((resolve, reject) => {
    map.once('load', resolve);
    setTimeout(() => reject(new Error('map did not finish loading within 30 s')), 30000);
  });
  // Code written as map.on('load', fn) after createMap() still runs: the event has already fired, so call fn now.
  const on = map.on.bind(map);
  map.on = (type, ...args) => {
    if (type === 'load' && args.length === 1 && typeof args[0] === 'function') {
      setTimeout(() => args[0]({ type: 'load', target: map }), 0);
      return map;
    }
    return on(type, ...args);
  };
  return map;
}

export function coverage() {
  return manifest;
}

export const version = VERSION;
