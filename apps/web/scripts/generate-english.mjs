// Reproducible English-core generator (P0.1).
// Run: node scripts/generate-english.mjs   (from apps/web)
// Reads the committed base packs, applies grade/difficulty/context tags, expands grammar & listening
// from real templates, adds a curated vocabulary seed, validates, and writes generated/*.json.
// buildEnglish() is pure (no writes) so tests can verify determinism and integrity.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tagItem } from './english-src/tags.mjs';
import { generateGrammar } from './english-src/grammar-templates.mjs';
import { generateListening } from './english-src/listening-templates.mjs';
import { VOCAB_EXTRA } from './english-src/vocab-extra.mjs';
import { VOCAB_EXTRA2 } from './english-src/vocab-extra2.mjs';

const GEN_DIR = new URL('../src/data/generated/', import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(name, GEN_DIR), 'utf8'));

const GRAMMAR_TARGET = 500;
const LISTENING_TARGET = 60;
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const TOPICS = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city', 'shopping', 'work', 'technology', 'feelings'];

function stripVi(v) {
  if (Array.isArray(v)) return v.map(stripVi);
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) { if (k !== 'vi') o[k] = stripVi(x); } return o; }
  return v;
}
const nextIdNum = (items, prefix) => items.reduce((m, x) => { const n = Number(String(x.id).replace(prefix, '')); return Number.isFinite(n) ? Math.max(m, n) : m; }, 0);

export function buildEnglish() {
  const baseVocab = readJson('vocabulary.json');
  const baseGrammar = readJson('grammar.json');
  const baseListening = readJson('listening.json');

  // ---- vocabulary: tag base, then add curated seed (dedup by lowercase en) ----
  const vocabulary = baseVocab.map((w) => tagItem(stripVi(w), 'vocabulary'));
  const seenEn = new Set(vocabulary.map((w) => w.en.toLowerCase()));
  let vn = nextIdNum(vocabulary, 'w');
  for (const [en, ru, level, topic, pos, exEn, exRu] of [...VOCAB_EXTRA, ...VOCAB_EXTRA2]) {
    const key = en.toLowerCase();
    if (seenEn.has(key)) continue;
    seenEn.add(key);
    vn += 1;
    vocabulary.push(tagItem({ id: `w${String(vn).padStart(4, '0')}`, en, ru, level, topic, pos, exEn, exRu }, 'vocabulary'));
  }

  // ---- grammar: tag base, then generate up to target (dedup against base) ----
  const grammar = baseGrammar.map((g) => tagItem(stripVi(g), 'grammar'));
  const gKey = (g) => g.type === 'reorder' ? `R:${g.correct}` : g.type === 'findError' ? `E:${g.sentence}` : `C:${g.sentence}`;
  const gSeen = new Set(grammar.map(gKey));
  let gn = nextIdNum(grammar, 'g');
  const need = Math.max(0, GRAMMAR_TARGET - grammar.length);
  for (const item of generateGrammar(need * 4 + 50, 7)) {
    if (grammar.length >= GRAMMAR_TARGET) break;
    const key = gKey(item);
    if (gSeen.has(key)) continue;
    gSeen.add(key);
    gn += 1;
    grammar.push(tagItem({ id: `g${String(gn).padStart(3, '0')}`, ...item }, 'grammar'));
  }

  // ---- listening: tag base, then generate up to target (dedup against base) ----
  const listening = baseListening.map((l) => tagItem(stripVi(l), 'listening'));
  const lKey = (l) => l.title.en + '|' + l.lines.map((x) => x.en).join('/');
  const lSeen = new Set(listening.map(lKey));
  let ln = nextIdNum(listening, 'l');
  for (const d of generateListening((LISTENING_TARGET - listening.length) * 4 + 20, 11)) {
    if (listening.length >= LISTENING_TARGET) break;
    const key = lKey(d);
    if (lSeen.has(key)) continue;
    lSeen.add(key);
    ln += 1;
    listening.push(tagItem({ id: `l${String(ln).padStart(3, '0')}`, ...d }, 'listening'));
  }

  const stats = { vocabulary: vocabulary.length, grammar: grammar.length, listening: listening.length };
  validate({ vocabulary, grammar, listening });
  return { vocabulary, grammar, listening, stats };
}

function validate({ vocabulary, grammar, listening }) {
  const fail = (m) => { throw new Error(`english validation: ${m}`); };
  const distinct = (a) => new Set(a.map((x) => String(x).trim().toLowerCase())).size === a.length;
  const tagsOk = (x) => Array.isArray(x.grades) && x.grades.length === 2 && x.grades[0] >= 2 && x.grades[1] <= 11 && x.difficulty >= 1 && x.difficulty <= 4 && typeof x.context === 'string';

  const vids = new Set();
  for (const w of vocabulary) {
    if (!w.en || !w.ru || !w.exEn || !w.exRu) fail(`vocab ${w.id}: missing text`);
    if (!LEVELS.includes(w.level) || !TOPICS.includes(w.topic)) fail(`vocab ${w.id}: bad level/topic`);
    if (!tagsOk(w)) fail(`vocab ${w.id}: bad tags`);
    if (vids.has(w.id)) fail(`vocab ${w.id}: duplicate id`);
    vids.add(w.id);
  }
  const gids = new Set();
  for (const g of grammar) {
    if (gids.has(g.id)) fail(`grammar ${g.id}: duplicate id`); gids.add(g.id);
    if (!LEVELS.includes(g.level) || !tagsOk(g) || !g.explain?.en || !g.explain?.ru) fail(`grammar ${g.id}: meta`);
    if (g.type === 'choose') {
      if (!g.sentence.includes('___')) fail(`grammar ${g.id}: no gap`);
      if (!Array.isArray(g.options) || g.options.length < 3 || !distinct(g.options)) fail(`grammar ${g.id}: options`);
      if (!Number.isInteger(g.answer) || g.answer < 0 || g.answer >= g.options.length) fail(`grammar ${g.id}: answer`);
    } else if (g.type === 'reorder') {
      if (!Array.isArray(g.words) || typeof g.correct !== 'string') fail(`grammar ${g.id}: reorder shape`);
      if ([...g.words].sort().join('|') !== g.correct.split(' ').sort().join('|')) fail(`grammar ${g.id}: reorder tokens`);
    } else if (g.type === 'findError') {
      const toks = g.sentence.split(' ');
      if (!Number.isInteger(g.errorIndex) || g.errorIndex < 0 || g.errorIndex >= toks.length || !g.correction) fail(`grammar ${g.id}: findError`);
    } else fail(`grammar ${g.id}: unknown type ${g.type}`);
  }
  const lids = new Set();
  for (const l of listening) {
    if (lids.has(l.id)) fail(`listening ${l.id}: duplicate id`); lids.add(l.id);
    if (!l.title?.en || !l.title?.ru || !Array.isArray(l.lines) || l.lines.length < 2 || !tagsOk(l)) fail(`listening ${l.id}: meta`);
    if (!Array.isArray(l.questions) || !l.questions.length) fail(`listening ${l.id}: no questions`);
    for (const qq of l.questions) {
      if (!qq.en || !qq.ru || !Array.isArray(qq.options) || qq.options.length < 3 || !distinct(qq.options)) fail(`listening ${l.id}: question options`);
      if (!Number.isInteger(qq.answer) || qq.answer < 0 || qq.answer >= qq.options.length) fail(`listening ${l.id}: question answer`);
    }
  }
}

function main() {
  const { vocabulary, grammar, listening, stats } = buildEnglish();
  const write = (name, data) => writeFileSync(new URL(name, GEN_DIR), JSON.stringify(data, null, 1) + '\n');
  write('vocabulary.json', vocabulary);
  write('grammar.json', grammar);
  write('listening.json', listening);
  console.log('English core generated:', JSON.stringify(stats));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();