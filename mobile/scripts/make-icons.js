// Draws the app icon, Android adaptive icon layers, splash image and favicon from one SVG pin.
// Run: node scripts/make-icons.js  (needs Playwright with Chromium installed on the machine)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const NAVY = '#1E3A8A';
const ORANGE = '#F59E0B';
const out = (name) => path.join(__dirname, '..', 'assets', name);

// Map pin with an exclamation mark, drawn in a 100x100 box
function pin({ body = '#FFFFFF', mark = NAVY, shadow = true, cutout = false } = {}) {
  // Android monochrome icon: only the shape counts, so the circle is cut out of the pin
  if (cutout) {
    return `
    <mask id="hole"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="39" r="19" fill="#000"/></mask>
    <path mask="url(#hole)" d="M50 8 C31 8 18 22 18 40 C18 62 50 88 50 88 C50 88 82 62 82 40 C82 22 69 8 50 8 Z" fill="${body}"/>
    <rect x="46.5" y="26" width="7" height="17" rx="3.5" fill="${body}"/>
    <circle cx="50" cy="50" r="4" fill="${body}"/>`;
  }
  return `
    ${shadow ? '<ellipse cx="50" cy="88" rx="15" ry="4" fill="#000" opacity="0.18"/>' : ''}
    <path d="M50 8 C31 8 18 22 18 40 C18 62 50 88 50 88 C50 88 82 62 82 40 C82 22 69 8 50 8 Z" fill="${body}"/>
    <circle cx="50" cy="39" r="19" fill="${mark}"/>
    <rect x="46.5" y="26" width="7" height="17" rx="3.5" fill="${body === '#FFFFFF' ? ORANGE : body}"/>
    <circle cx="50" cy="50" r="4" fill="${body === '#FFFFFF' ? ORANGE : body}"/>`;
}

// scale = share of the canvas the 100x100 pin box takes
function svg(size, { background, scale, ...pinOptions }) {
  const box = size * scale;
  const offset = (size - box) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
    <g transform="translate(${offset} ${offset}) scale(${box / 100})">${pin(pinOptions)}</g>
  </svg>`;
}

const files = [
  // iOS and store icon: full square, no transparency
  ['icon.png', svg(1024, { background: NAVY, scale: 0.72 })],
  // Android adaptive icon: the launcher crops to the middle 66%, so the pin stays small
  ['android-icon-foreground.png', svg(512, { scale: 0.56 })],
  ['android-icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${NAVY}"/></svg>`],
  ['android-icon-monochrome.png', svg(432, { scale: 0.5, cutout: true })],
  ['splash-icon.png', svg(1024, { scale: 0.8 })],
  ['favicon.png', svg(48, { background: NAVY, scale: 0.8, shadow: false })],
  // Google Play listing icon: 512x512
  ['store/play-icon-512.png', svg(512, { background: NAVY, scale: 0.72 })],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, markup] of files) {
    const size = Number(markup.match(/width="(\d+)"/)[1]);
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    fs.mkdirSync(path.dirname(out(name)), { recursive: true });
    await page.screenshot({ path: out(name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('wrote', name);
  }
  await browser.close();
})();
