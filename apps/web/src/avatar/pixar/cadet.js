// Cadet version mentor: captain (reserve), officer-educator of a cadet corps.
// Flat illustration drawn in code as SVG (no binary files): base portrait + lip-sync overlays,
// in the same format as the other portraits. Replace with a final render later if needed.
const eyeOpen = (cx) => `<ellipse cx="${cx}" cy="150" rx="11" ry="12" fill="#fff"/><circle cx="${cx + 1}" cy="151" r="7.5" fill="#4a6b5f"/><circle cx="${cx + 1}" cy="151" r="4" fill="#1d2220"/><circle cx="${cx + 3.5}" cy="147.5" r="2.2" fill="#fff"/><path d="M${cx - 12} 146 Q${cx} 135 ${cx + 12} 146" stroke="#3a2c26" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const eyeClosed = (cx) => `<path d="M${cx - 12} 146 Q${cx} 135 ${cx + 12} 146" stroke="#3a2c26" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${cx - 12} 150 Q${cx} 158 ${cx + 12} 150" stroke="#3a2c26" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const eyeHappy = (cx) => `<ellipse cx="${cx}" cy="151" rx="11" ry="9" fill="#fff"/><circle cx="${cx + 1}" cy="151" r="7" fill="#4a6b5f"/><circle cx="${cx + 1}" cy="151" r="3.8" fill="#1d2220"/><circle cx="${cx + 3.5}" cy="148" r="2" fill="#fff"/><path d="M${cx - 13} 158 Q${cx} 151 ${cx + 13} 158" fill="#eeb48b"/><path d="M${cx - 12} 146 Q${cx} 136 ${cx + 12} 146" stroke="#3a2c26" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const MOUTH = {
  closed: '<path d="M144 205 Q160 212 176 205" stroke="#8e3f3c" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
  A: '<path d="M142 202 Q160 200 178 202 Q172 226 160 227 Q148 226 142 202Z" fill="#6b2427"/><path d="M147 203 Q160 202 173 203 L171 207 Q160 208 149 207Z" fill="#fff"/><ellipse cx="160" cy="220" rx="8" ry="4" fill="#c4555a"/>',
  O: '<ellipse cx="160" cy="210" rx="9" ry="12" fill="#6b2427"/><ellipse cx="160" cy="217" rx="5.5" ry="3.5" fill="#c4555a"/>',
  E: '<path d="M140 203 Q160 199 180 203 Q172 216 160 216 Q148 216 140 203Z" fill="#6b2427"/><path d="M145 204 Q160 201 175 204 L173 208 Q160 209 147 208Z" fill="#fff"/>',
  smile: '<path d="M138 200 Q160 206 182 200 Q176 222 160 223 Q144 222 138 200Z" fill="#6b2427"/><path d="M142 201 Q160 206 178 201 L175 207 Q160 210 145 207Z" fill="#fff"/><ellipse cx="160" cy="217" rx="9" ry="3.5" fill="#c4555a"/>',
};
const STAR = (x, y) => `<path d="M${x} ${y} l1.3 2.7 3 .3-2.3 2 .7 3-2.7-1.6-2.7 1.6.7-3-2.3-2 3-.3z" fill="#d9b44a"/>`;
// Captain: one stripe (просвет) and four small stars on each shoulder board.
const BOARD_L = `<g transform="rotate(-14 60 266)"><rect x="28" y="256" width="66" height="22" rx="6" fill="#56703E" stroke="#3a4d29" stroke-width="1.5"/><rect x="28" y="265" width="66" height="4" fill="#B8323A"/><circle cx="88" cy="267" r="3" fill="#d9b44a"/>${STAR(44, 259)}${STAR(58, 259)}${STAR(51, 270)}${STAR(72, 263)}</g>`;
const BOARD_R = `<g transform="rotate(14 260 266)"><rect x="226" y="256" width="66" height="22" rx="6" fill="#56703E" stroke="#3a4d29" stroke-width="1.5"/><rect x="226" y="265" width="66" height="4" fill="#B8323A"/><circle cx="232" cy="267" r="3" fill="#d9b44a"/>${STAR(276, 259)}${STAR(262, 259)}${STAR(269, 270)}${STAR(248, 263)}</g>`;

function portrait({ mouth = 'closed', eyes = eyeOpen } = {}) {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9ECDF"/><stop offset="1" stop-color="#D5DBC6"/></linearGradient><linearGradient id="jk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B7542"/><stop offset="1" stop-color="#3F552D"/></linearGradient><linearGradient id="cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#617C47"/><stop offset="1" stop-color="#465E33"/></linearGradient><radialGradient id="sk" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#F6CDA6"/><stop offset="1" stop-color="#E2A57C"/></radialGradient></defs>`
    + '<rect width="320" height="320" fill="url(#bg)"/>'
    + '<path d="M20 320 Q24 262 70 248 L130 232 L190 232 L250 248 Q296 262 300 320Z" fill="url(#jk)"/>'
    + '<path d="M132 232 L160 290 L188 232Z" fill="#F4F4EE"/><path d="M153 246 L167 246 L171 300 L160 314 L149 300Z" fill="#3B4A2C"/><path d="M152 240 L168 240 L166 250 L154 250Z" fill="#33411F"/>'
    + '<path d="M130 232 L160 296 L150 320 L106 320 L112 262Z" fill="#4C6537"/><path d="M190 232 L160 296 L170 320 L214 320 L208 262Z" fill="#4C6537"/>'
    + BOARD_L + BOARD_R
    + '<path d="M138 205 L182 205 L184 240 Q160 252 136 240Z" fill="#DE9E76"/>'
    + '<path d="M136 230 L160 252 L146 262 L128 238Z" fill="#fff"/><path d="M184 230 L160 252 L174 262 L192 238Z" fill="#fff"/>'
    + '<ellipse cx="103" cy="160" rx="11" ry="17" fill="#E2A27A"/><ellipse cx="217" cy="160" rx="11" ry="17" fill="#E2A27A"/>'
    + '<path d="M106 135 Q104 96 160 94 Q216 96 214 135 L212 180 Q206 226 160 232 Q114 226 108 180Z" fill="url(#sk)"/>'
    + '<path d="M106 140 Q106 118 116 108 L118 150 Q112 146 106 140Z" fill="#3a2c26"/><path d="M214 140 Q214 118 204 108 L202 150 Q208 146 214 140Z" fill="#3a2c26"/>'
    + '<path d="M84 100 Q92 52 160 48 Q228 52 236 100 Q200 112 160 112 Q120 112 84 100Z" fill="url(#cap)"/><rect x="104" y="98" width="112" height="20" rx="4" fill="#B8323A"/>'
    + '<path d="M104 116 Q160 106 216 116 Q214 134 160 132 Q106 134 104 116Z" fill="#1F2420"/><path d="M110 118 Q160 110 210 118" stroke="#3c443d" stroke-width="2" fill="none"/>'
    + '<circle cx="160" cy="104" r="9" fill="#d9b44a"/><circle cx="160" cy="104" r="5" fill="#B8323A"/><circle cx="160" cy="104" r="2.2" fill="#d9b44a"/>'
    + '<path d="M120 70 Q160 60 200 70" stroke="#6f8b54" stroke-width="3" fill="none" opacity=".6"/>'
    + eyes(136) + eyes(184)
    + '<path d="M160 158 Q154 180 152 184 Q160 189 168 184" stroke="#bf7f5c" stroke-width="3" fill="none" stroke-linecap="round"/>'
    + '<ellipse cx="124" cy="186" rx="11" ry="6" fill="#E88F7E" opacity=".35"/><ellipse cx="196" cy="186" rx="11" ry="6" fill="#E88F7E" opacity=".35"/>'
    + MOUTH[mouth];
}
// A layer is the same drawing cropped to its box with the viewBox, so it lines up pixel-perfect.
const url = (body, box = [0, 0, 320, 320]) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}">${body}</svg>`)}`;
const MOUTH_BOX = [134, 192, 52, 40];
const EYES_BOX = [118, 132, 84, 34];
const HAPPY_BOX = [118, 132, 84, 96];
const layer = (box, opts) => ({ x: box[0], y: box[1], w: box[2], h: box[3], src: url(portrait(opts), box) });

export default {
  size: 320,
  base: url(portrait()),
  layers: {
    A: layer(MOUTH_BOX, { mouth: 'A' }),
    O: layer(MOUTH_BOX, { mouth: 'O' }),
    E: layer(MOUTH_BOX, { mouth: 'E' }),
    happy: layer(HAPPY_BOX, { mouth: 'smile', eyes: eyeHappy }),
    blink: layer(EYES_BOX, { eyes: eyeClosed }),
  },
};
