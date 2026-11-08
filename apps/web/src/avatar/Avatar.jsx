import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { speechBus } from '../audio/speechBus.js';
import { faceFor } from './faces.js';
import { FRAME_CLS, renderAvatarSVG } from './svg.js';

// Pixar-style portraits: one base render + feathered RGBA overlays that are
// cross-faded for lip-sync (A / O / E), blinking and a happy smile.
const PIXAR = new Set(['emma', 'james', 'sofia', 'alex', 'cadet']);
const LAYERS = ['A', 'O', 'E', 'happy', 'blink'];
const MOUTHS = ['A', 'O', 'E'];
// Viseme from the TTS engine -> mouth overlay (null = closed lips of the base render).
const VISEME_TO_LAYER = { rest: null, M: null, F: 'E', A: 'A', I: 'E', E: 'E', L: 'A', O: 'O', U: 'O', W: 'O' };
// Aperture lives in the frame's own vertical scale, not in its opacity: a
// translucent half-open mouth reads as a ghost blur, a squashed full-res one
// reads as a real jaw. Origins: A pivots on the upper lip (jaw drops), O and E
// close symmetrically around the lip line.
const MOUTH_SCALE = { A: (q) => 0.62 + 0.2 * q, O: (q) => 0.72 + 0.18 * q, E: (q) => 0.76 + 0.15 * q };
const MOUTH_ORIGIN = { A: '50% 15%', O: '50% 16.1%', E: '50% 17.3%' };
const HAPPY = new Set(['happy', 'encourage', 'excited', 'proud']);

// Portraits ship as lazily-loaded JS modules with WebP data URLs (no extra
// static files to deploy; each teacher is ~20 KB and loads on first use).
// The cadet captain is drawn as SVG data URLs in the same format.
const LOADERS = {
  emma: () => import('./pixar/emma.js'),
  james: () => import('./pixar/james.js'),
  sofia: () => import('./pixar/sofia.js'),
  alex: () => import('./pixar/alex.js'),
  cadet: () => import('./pixar/cadet.js'),
};
const cache = {};
function usePortrait(id) {
  const [data, setData] = useState(() => cache[id] || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (cache[id]) { setData(cache[id]); return undefined; }
    const load = LOADERS[id];
    if (!load) { setFailed(true); return undefined; }
    load().then((m) => { cache[id] = m.default; if (alive) setData(m.default); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [id]);
  return { data, failed };
}
const pct = (v, size) => `${(v / size) * 100}%`;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function Avatar({ teacher, emotion = 'neutral', talking = false, frame = 'none', className = '', rounded = 'rounded-[26%]' }) {
  const id = teacher?.id;
  const { data, failed } = usePortrait(PIXAR.has(id) ? id : null);
  if (!PIXAR.has(id) || failed) return <SvgAvatar teacher={teacher} emotion={emotion} frame={frame} className={className} rounded={rounded} />;
  return <PixarAvatar teacher={teacher} data={data} emotion={emotion} talking={talking} frame={frame} className={className} rounded={rounded} />;
}

function PixarAvatar({ teacher, data, emotion, talking, frame, className, rounded }) {
  const id = teacher.id;
  const refs = useRef({});
  const target = useRef({ A: 0, O: 0, E: 0, happy: 0, blink: 0 });
  const current = useRef({ A: 0, O: 0, E: 0, happy: 0, blink: 0 });
  const mouthT = useRef({ A: 1, O: 1, E: 1 });
  const mouthC = useRef({ A: 1, O: 1, E: 1 });
  const reducedMotion = useReducedMotion();
  const happy = HAPPY.has(emotion);
  const headRef = useRef(null);
  const talkingRef = useRef(talking); talkingRef.current = talking;
  const reducedRef = useRef(reducedMotion); reducedRef.current = reducedMotion;
  // a: 0..1 blend idle->talk motion; nod is a damped spring kicked on sentence pauses
  const dyn = useRef({ a: 0, nodC: 0, nodV: 0 });
  const blinkFn = useRef(null);

  // Base layer: happy smile when idle and cheerful.
  useEffect(() => {
    if (!talking) {
      MOUTHS.forEach((k) => { target.current[k] = 0; });
      target.current.happy = happy ? 1 : 0;
    } else target.current.happy = 0;
  }, [happy, talking]);

  // Animation loop: ease every layer toward its target opacity and drive an
  // organic head sway. Fixed CSS loops read as robotic, so the sway sums
  // incommensurate sines and blends idle/talk by speech activity.
  useEffect(() => {
    let raf = 0; let prev = performance.now(); let alive = true;
    const tick = (now) => {
      if (!alive) return;
      const dt = Math.min(64, now - prev); prev = now;
      LAYERS.forEach((k) => {
        const goal = target.current[k];
        const c0 = current.current[k];
        // jaws and eyelids snap shut faster than they open
        const speed = k === 'blink' ? (goal < c0 ? 0.95 : 0.7) : k === 'happy' ? 0.12 : goal < c0 ? 0.68 : 0.5;
        const c = c0 + (goal - c0) * Math.min(1, speed * (dt / 16));
        current.current[k] = Math.abs(c - goal) < 0.01 ? goal : c;
        const el = refs.current[k];
        if (el) el.style.opacity = String(current.current[k]);
      });
      MOUTHS.forEach((k) => {
        const g = mouthT.current[k];
        const c0 = mouthC.current[k];
        const c = c0 + (g - c0) * Math.min(1, 0.65 * (dt / 16));
        mouthC.current[k] = Math.abs(c - g) < 0.01 ? g : c;
        const el = refs.current[k];
        if (el) el.style.transform = c >= 0.999 ? '' : `scaleY(${c.toFixed(3)})`;
      });
      const d = dyn.current;
      const ts = now / 1000; const dtS = dt / 1000;
      d.a += ((talkingRef.current ? 1 : 0) - d.a) * Math.min(1, dt / 250);
      d.nodV += (-d.nodC * 220 - d.nodV * 14) * dtS;
      d.nodC += d.nodV * dtS;
      if (headRef.current && !reducedRef.current) {
        const amp = 0.7 + 0.3 * Math.sin(ts * 0.31 + 1);
        const idleY = Math.sin(ts * 1.4) * 0.35;
        const idleR = Math.sin(ts * 0.47 + 2) * 0.12;
        const idleS = 1.005 + Math.sin(ts * 0.8) * 0.003;
        const talkY = Math.sin(ts * 2.3 + 0.7) * 0.32 * amp + Math.sin(ts * 3.9) * 0.18;
        const talkR = Math.sin(ts * 1.7) * 0.46 * amp + Math.sin(ts * 2.9 + 1.3) * 0.3;
        // scale >= 1.02 while rotating keeps the photo corners covered
        const talkS = 1.03 + Math.sin(ts * 1.1) * 0.004;
        const y = idleY + (talkY - idleY) * d.a + d.nodC * 1.2;
        const r = idleR + (talkR - idleR) * d.a;
        const s = idleS + (talkS - idleS) * d.a;
        headRef.current.style.transform = `translateY(${y.toFixed(3)}%) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  // Natural blinking: 2-6 s apart, occasional double or lazy half-blink, and
  // often right at a sentence pause, where a real speaker would blink.
  useEffect(() => {
    let alive = true; let t1; let t2; let t3; let lastBlink = 0;
    const doBlink = (half = false) => {
      const n = performance.now();
      if (n - lastBlink < 350) return;
      lastBlink = n;
      target.current.blink = half ? 0.55 : 1;
      clearTimeout(t2);
      t2 = setTimeout(() => { target.current.blink = 0; }, half ? 70 : 110);
      if (!half && Math.random() < 0.15) {
        t3 = setTimeout(() => {
          if (!alive) return;
          target.current.blink = 1;
          clearTimeout(t2);
          t2 = setTimeout(() => { target.current.blink = 0; }, 90);
        }, 160);
      }
    };
    blinkFn.current = doBlink;
    const loop = () => { if (!alive) return; doBlink(); t1 = setTimeout(loop, 2000 + Math.random() * 4000); };
    t1 = setTimeout(loop, 1200 + Math.random() * 2200);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); blinkFn.current = null; };
  }, []);

  // Lip-sync: real visemes from the speech engine, babble fallback if none arrive.
  useEffect(() => {
    if (!talking) return undefined;
    let last = 0; let spoke = false; let alive = true; let babbleTimer;
    const show = (layer, q = 1) => {
      MOUTHS.forEach((k) => {
        // full-res frame always; the aperture is the frame's own squash, not alpha.
        // 0.88 cap: the dark cavity blends with the face instead of reading as a pasted hole
        target.current[k] = k === layer ? 0.88 : 0;
        mouthT.current[k] = k === layer ? MOUTH_SCALE[k](q) : 1;
      });
    };
    const own = (p) => !p?.teacherId || p.teacherId === id;
    const offV = speechBus.on('viseme', (p = {}) => {
      if (!own(p)) return;
      const q = Number.isFinite(p.q) ? p.q : 1;
      spoke = true; last = performance.now();
      show(VISEME_TO_LAYER[p.v] ?? null, q);
      // sentence pause: a real speaker dips the head and often blinks there
      if (p.v === 'rest') {
        dyn.current.nodV += 8;
        if (Math.random() < 0.5) blinkFn.current?.();
      } else if (q > 0.7 && 'AOLUW'.includes(p.v)) {
        // a stressed syllable lands with a small head dip, like real jaw energy
        dyn.current.nodV += 1.5 + 2 * q;
      }
    });
    const offE = speechBus.on('end', (p = {}) => { if (own(p)) show(null); });
    // The face stays still until the first real viseme arrives (Piper synthesizes
    // for a moment after "start"), then babble only fills gaps between visemes.
    const babble = () => {
      if (!alive) return;
      if (spoke && performance.now() - last > 300) {
        const r = Math.random();
        show(r < 0.4 ? 'A' : r < 0.62 ? 'E' : r < 0.8 ? 'O' : null, 0.5 + Math.random() * 0.5);
      }
      babbleTimer = setTimeout(babble, 150 + Math.random() * 160);
    };
    babbleTimer = setTimeout(babble, 400);
    return () => { alive = false; clearTimeout(babbleTimer); offV(); offE(); show(null); };
  }, [talking, id]);

  return (
    <div className={`relative ${className}`}>
      <div className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`} style={{ background: teacher.bg }}>
        <div ref={headRef} className="relative w-full h-full" style={{ transformOrigin: '50% 90%', willChange: 'transform' }}>
          {data && <img src={data.base} alt={teacher.name || 'Teacher'} draggable="false" className="absolute inset-0 w-full h-full object-cover select-none" />}
          {data && LAYERS.map((k) => {
            const l = data.layers[k];
            if (!l) return null;
            return <img key={k} ref={(el) => { refs.current[k] = el; }} src={l.src} alt="" aria-hidden="true" draggable="false"
              className="absolute select-none pointer-events-none"
              style={{ left: pct(l.x, data.size), top: pct(l.y, data.size), width: pct(l.w, data.size), height: pct(l.h, data.size), opacity: 0, transformOrigin: MOUTH_ORIGIN[k] || '50% 50%', willChange: 'transform, opacity' }} />;
          })}
        </div>
      </div>
    </div>
  );
}

// Fallback for teachers without a Pixar render (e.g. custom ones from an API).
function SvgAvatar({ teacher, emotion, frame, className, rounded }) {
  const instanceId = useId();
  const face = useMemo(() => faceFor(teacher?.id), [teacher?.id]);
  const svg = useMemo(() => renderAvatarSVG(face, { emotion, instanceId }), [face, emotion, instanceId]);
  return (
    <div className={`relative ${className}`}>
      <div className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`} style={{ background: teacher?.bg || face.bg }}>
        <div className="w-full h-full [&>svg]:block [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}

// Small helper: flash an emotion for a moment, then return to neutral.
export function useEmotion() {
  const [emotion, setEmotion] = useState('neutral');
  const t = useRef(null);
  const flash = (e, ms = 2400) => {
    clearTimeout(t.current);
    setEmotion(e);
    if (ms) t.current = setTimeout(() => setEmotion('neutral'), ms);
  };
  useEffect(() => () => clearTimeout(t.current), []);
  return [emotion, flash];
}

export function SpeechBubble({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`anim-bubble relative bg-surface border border-black/5 shadow-lg rounded-2xl px-4 py-3 font-semibold text-[15px] leading-snug ${className}`}>
      {children}
    </div>
  );
}
