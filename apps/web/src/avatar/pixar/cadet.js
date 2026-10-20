// Cadet version mentor: Dmitry's Pixar portrait (olive jacket) with captain's shoulder boards.
// The face is unchanged, so Dmitry's lip-sync, blink and smile layers fit pixel-perfect.
// Shoulder boards are vector (SVG over the original render), laid out as on a real captain's board
// of the Russian Armed Forces: one stripe (просвет) along the board; four small stars — two at the lower
// (shoulder) end on both sides of the stripe, two more on the stripe itself, one above the other, towards the button.
import james from './james.js';

const L = 68, W = 28; // board length (along the shoulder) and width, px in the 320 px portrait
const star = (cx, cy, r) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="url(#cg)" stroke="#6b4e00" stroke-width="0.5"/>`;
};
// Local frame: +x from the shoulder end towards the collar (button), y across the board.
const x0 = -L / 2, R = 3.7;
const stars = [
  star(x0 + 0.27 * L, -0.27 * W, R), star(x0 + 0.27 * L, 0.27 * W, R), // pair beside the stripe
  star(x0 + 0.5 * L, 0, R), star(x0 + 0.7 * L, 0, R), // two on the stripe, one above the other
].join('');
const board = `
  <polygon points="${x0},${-W / 2} ${L / 2 - 8},${-W / 2} ${L / 2},0 ${L / 2 - 8},${W / 2} ${x0},${W / 2}" fill="url(#og)" stroke="#9e1c1c" stroke-width="1.3" filter="url(#sh)"/>
  <rect x="${x0}" y="-1.6" width="${0.8 * L}" height="3.2" fill="#b3261e"/>
  ${stars}
  <circle cx="${L / 2 - 0.13 * L}" cy="0" r="4.2" fill="url(#cg)" stroke="#6b4e00" stroke-width="0.6"/>
  ${star(L / 2 - 0.13 * L, 0.2, 2.2).replace('url(#cg)', '#8a6a10')}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="320" height="320" viewBox="0 0 320 320">
<defs>
  <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#66713d"/><stop offset="1" stop-color="#3d4622"/></linearGradient>
  <radialGradient id="cg" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff3b0"/><stop offset="0.45" stop-color="#e2b93b"/><stop offset="1" stop-color="#9c7412"/></radialGradient>
  <filter id="sh" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#000" flood-opacity="0.45"/></filter>
</defs>
<image href="${james.base}" xlink:href="${james.base}" x="0" y="0" width="320" height="320"/>
<g transform="translate(68 303) rotate(-22)">${board}</g>
<g transform="translate(250 300) rotate(210)">${board}</g>
</svg>`;

const base = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default { ...james, base };
