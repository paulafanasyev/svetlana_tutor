// Cadet version mentor: Captain Andrey Nikolaevich (a fictional character) — Dmitry's Pixar portrait without glasses
// (pixar/cadet/face.js) in the PARADE uniform of a Ground Forces officer (приказ МО РФ № 525 от 09.10.2020, ред. № 733):
//  - tunic «цвета морской волны» (#214D46): the render's olive jacket is recoloured in SVG (filter #sw, shading kept),
//    closed standing collar with red piping and gold officer's «колонки», red piping down the front, gold button;
//  - parade shoulder boards of a captain: gold galloon, red piping, one red stripe (просвет), four 13 mm stars
//    (two at the shoulder end on both sides of the stripe, two on the stripe one above the other), plain gold button;
//  - gold aiguillette on the right shoulder;
//  - parade cap: sea-wave crown, red band and piping, black visor, gold cockade and chin cord.
// The face is unchanged, so the lip-sync, smile and blink layers (cadet/layers.js) fit pixel-perfect;
// the collar stays below the mouth layer box (y < 268).
import james from './james.js';
import face from './cadet/face.js';
import layers from './cadet/layers.js';

const L = 68, W = 28;
const star = (cx, cy, r) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="url(#cg)" stroke="#5a3f00" stroke-width="0.7"/>`;
};
const x0 = -L / 2, R = 3.9;
const stars = [
  star(x0 + 0.27 * L, -0.27 * W, R), star(x0 + 0.27 * L, 0.27 * W, R),
  star(x0 + 0.5 * L, 0, R), star(x0 + 0.7 * L, 0, R),
].join('');
const outline = `${x0},${-W / 2} ${L / 2 - 8},${-W / 2} ${L / 2},0 ${L / 2 - 8},${W / 2} ${x0},${W / 2}`;
const board = `
  <polygon points="${outline}" fill="url(#gl)" stroke="#b3261e" stroke-width="1.6" filter="url(#sh)"/>
  <polygon points="${outline}" fill="url(#gp)" opacity="0.35"/>
  <rect x="${x0}" y="-1.7" width="${0.8 * L}" height="3.4" fill="#b3261e"/>
  ${stars}
  <circle cx="${L / 2 - 0.13 * L}" cy="0" r="4.2" fill="url(#cg)" stroke="#5a3f00" stroke-width="0.6"/>`;

// Standing collar and the closed front of the tunic (geometry measured on the render).
const TUNIC = `
<path d="M74 280 L80 286 Q158 320 238 286 L244 280 L246 300 L222 320 L96 320 L70 300 Z" fill="url(#tf)"/>
<path d="M88 258 Q158 304 228 258 L238 286 Q158 320 80 286 Z" fill="url(#tc)"/>
<path d="M88 258 Q158 304 228 258" fill="none" stroke="#c0302a" stroke-width="2"/>
<path d="M80 286 Q158 320 238 286" fill="none" stroke="#0e2622" stroke-opacity="0.45" stroke-width="1.4"/>
<path d="M158 281 L158 320" stroke="#c0302a" stroke-width="1.8"/>
<g fill="url(#gd)" stroke="#5a3f00" stroke-width="0.6">
  <g transform="translate(120 288) rotate(24)"><rect x="-5" y="-7" width="10" height="14" rx="1.5"/><path d="M-2 -6 V6 M2 -6 V6" stroke="#7a5a10" stroke-width="1"/></g>
  <g transform="translate(197 288) rotate(-24)"><rect x="-5" y="-7" width="10" height="14" rx="1.5"/><path d="M-2 -6 V6 M2 -6 V6" stroke="#7a5a10" stroke-width="1"/></g>
</g>
<circle cx="162" cy="313" r="3.6" fill="url(#gd)" stroke="#5a3f00" stroke-width="0.6"/>`;
const AIGUILLETTE = `
<g fill="none" stroke-linecap="round">
  <path d="M62 300 C74 318 104 322 134 321" stroke="#6b4e00" stroke-width="4.2"/>
  <path d="M62 300 C74 318 104 322 134 321" stroke="url(#gd)" stroke-width="3"/>
  <path d="M62 300 C74 318 104 322 134 321" stroke="#7a5a10" stroke-width="3" stroke-dasharray="1.2 2.4" opacity="0.6"/>
  <path d="M70 296 C86 312 110 314 134 314" stroke="#6b4e00" stroke-width="4.2"/>
  <path d="M70 296 C86 312 110 314 134 314" stroke="url(#gd)" stroke-width="3"/>
  <path d="M70 296 C86 312 110 314 134 314" stroke="#7a5a10" stroke-width="3" stroke-dasharray="1.2 2.4" opacity="0.6"/>
</g>`;
const CAP = `
<ellipse cx="165" cy="101" rx="74" ry="8" fill="#2a1408" opacity="0.38" filter="url(#bl)"/>
<g filter="url(#cs)">
  <path d="M74 56 C60 46 30 30 38 16 C48 0 110 -8 165 -8 C220 -8 282 0 292 16 C300 30 270 46 256 56 Z" fill="url(#cr)"/>
  <path d="M74 56 C60 46 30 30 38 16 C48 0 110 -8 165 -8 C220 -8 282 0 292 16 C300 30 270 46 256 56 Z" fill="url(#crs)"/>
  <path d="M39 20 C48 0 110 -8 165 -8 C220 -8 282 0 291 20" fill="none" stroke="#b3261e" stroke-width="2.2"/>
  <path d="M120 10 C150 4 190 4 214 10" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="6" stroke-linecap="round"/>
  <path d="M74 54 C120 60 210 60 256 54 L254 78 C210 84 120 84 76 78 Z" fill="url(#bd)"/>
  <path d="M74 54.5 C120 60.5 210 60.5 256 54.5" fill="none" stroke="#e2584c" stroke-width="1" opacity="0.8"/>
  <path d="M84 78 C120 85 210 85 246 78 C236 92 200 98 165 98 C130 98 94 92 84 78 Z" fill="url(#vz)"/>
  <path d="M104 86 C135 91 195 91 226 86" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round"/>
  <path d="M82 76 C120 82 210 82 248 76" fill="none" stroke="#d9b13a" stroke-width="2.6"/>
  <path d="M82 76 C120 82 210 82 248 76" fill="none" stroke="#7a5a10" stroke-width="0.8" stroke-dasharray="1.5 2" opacity="0.7"/>
  <circle cx="84" cy="76" r="3.2" fill="url(#gd)" stroke="#6b4e00" stroke-width="0.5"/>
  <circle cx="246" cy="76" r="3.2" fill="url(#gd)" stroke="#6b4e00" stroke-width="0.5"/>
  <ellipse cx="165" cy="67" rx="8" ry="9.5" fill="url(#gd)" stroke="#6b4e00" stroke-width="0.7"/>
  <ellipse cx="165" cy="67" rx="4.6" ry="5.6" fill="#b3261e" stroke="#e2b93b" stroke-width="1"/>
  <circle cx="165" cy="67" r="1.8" fill="#e2b93b"/>
  <g transform="translate(165 33)">
    <path d="M-2 -6 C-10 -14 -22 -10 -26 -2 C-18 -6 -10 -4 -4 2 Z M2 -6 C10 -14 22 -10 26 -2 C18 -6 10 -4 4 2 Z" fill="url(#gd)" stroke="#6b4e00" stroke-width="0.5"/>
    <path d="M0 -9 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6 z" fill="url(#gd)" stroke="#6b4e00" stroke-width="0.5"/>
  </g>
</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="320" height="320" viewBox="0 0 320 320">
<defs>
  <radialGradient id="cg" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff6c4"/><stop offset="0.45" stop-color="#e8c24a"/><stop offset="1" stop-color="#8c6510"/></radialGradient>
  <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dc8a"/><stop offset="0.5" stop-color="#d1a936"/><stop offset="1" stop-color="#9c7616"/></linearGradient>
  <pattern id="gp" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.4" height="4" fill="#6b4e00"/></pattern>
  <filter id="sh" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#000" flood-opacity="0.45"/></filter>
  <filter id="sw" filterUnits="userSpaceOnUse" x="0" y="0" width="320" height="320" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.21 0.35 0.14 0 0  0.48 0.8 0.32 0 0  0.435 0.725 0.29 0 0  0 -6 0 0 3.5"/>
  </filter>
  <clipPath id="jk"><path d="M0 256 H112 V296 H206 V256 H320 V320 H0 Z"/></clipPath>
  <linearGradient id="tf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26574f"/><stop offset="0.5" stop-color="#204942"/><stop offset="1" stop-color="#1b3f39"/></linearGradient>
  <linearGradient id="tc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c645a"/><stop offset="0.5" stop-color="#235048"/><stop offset="1" stop-color="#1c423c"/></linearGradient>
  <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b7368"/><stop offset="0.55" stop-color="#24544b"/><stop offset="1" stop-color="#163731"/></linearGradient>
  <radialGradient id="crs" cx="0.5" cy="0.35" r="0.65"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
  <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8342a"/><stop offset="1" stop-color="#8e1d16"/></linearGradient>
  <linearGradient id="vz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="0.35" stop-color="#151515"/><stop offset="1" stop-color="#050505"/></linearGradient>
  <radialGradient id="gd" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff3b0"/><stop offset="0.45" stop-color="#e2b93b"/><stop offset="1" stop-color="#8c6510"/></radialGradient>
  <filter id="bl" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3.5"/></filter>
  <filter id="cs" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter>
</defs>
<image href="${face}" xlink:href="${face}" x="0" y="0" width="320" height="320"/>
<image href="${face}" xlink:href="${face}" x="0" y="0" width="320" height="320" clip-path="url(#jk)" filter="url(#sw)"/>
${TUNIC}
${AIGUILLETTE}
${CAP}
<g transform="translate(68 303) rotate(-22)">${board}</g>
<g transform="translate(250 300) rotate(210)">${board}</g>
</svg>`;

const base = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default { ...james, base, layers };
