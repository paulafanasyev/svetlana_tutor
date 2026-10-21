// Child-safety guard for every tutor version (base, cadet, lyceum, support).
// Runs BEFORE the AI (local model or rule-based fallback), so it works even without a model
// and cannot be talked out of by the learner ("ignore the rules" etc.).
//  - crisis: self-harm, suicide, abuse or violence against the child → short caring answer,
//    trusted adult + free helplines (RU 8-800-2000-122, VN 111, emergency 112 / 113);
//  - danger: requests for weapons, explosives, drugs, how to hurt people → brief refusal, back to the lesson.
// Plain words like "war", "army", "gun" in an English exercise are NOT blocked: only clear requests.
// Also used for the class chat (features/school/schoolStore.js) and to clean the model's answer (cleanModelText).

// Normalisation (audit 21.10: obfuscation like "k.i.l.l myself", "k1ll", "у б и т ь", full-width letters):
//  1) NFKC (full-width / stylised letters → plain), lower case, ё→е, zero-width characters removed;
//  2) leet digits inside words with letters (k1ll, s3lf, d1e) → letters;
//  3) Latin look-alikes inside Cyrillic words (a→а, o→о …);
//  4) punctuation → space, runs of 3+ single letters joined ("k i l l" → "kill");
//  5) letters repeated 3+ times squeezed to one.
const LOOK = { a: 'а', o: 'о', e: 'е', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', h: 'н', b: 'в' };
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
const fixMixed = (w) => (/[а-я]/.test(w) && /[a-z]/.test(w) ? w.replace(/[aoepcxykmthb]/g, (ch) => LOOK[ch]) : w);
const fixLeet = (w) => (/[a-zа-я]/.test(w) && /[0-9@$]/.test(w) ? w.replace(/[013457@$]/g, (ch) => LEET[ch]) : w);
// Runs of single letters separated by ONE space are a spelled-out word; 2+ spaces still separate words.
const joinSpelled = (s) => s.replace(/(?<![\p{L}\p{N}])\p{L}(?: \p{L}){2,}(?![\p{L}\p{N}])/gu, (m) => m.replace(/ /g, ''));
export const norm = (s) => joinSpelled(String(s == null ? '' : s).normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
  .replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, '')
  .replace(/[\p{L}\p{N}@$]+/gu, fixLeet)
  .replace(/[\u0400-\u04ffa-z0-9]+/g, fixMixed)
  .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
  .replace(/[\t\r\n]/g, ' '))
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/(\p{L})\1{2,}/gu, '$1');

const CRISIS = [
  // ru
  /суицид/, /покончить с собой/, /(убить|убью) себя/, /не хочу (больше )?жить/, /хочу умереть/, /лучше бы я умер/,
  /(порезать|режу|порезал[аи]?) (себя|руки|вены)/, /самоповрежд/, /наглотаться таблеток/, /прыгнуть с (крыши|моста)/,
  /меня (бьют|избивают|насилу|домогаются|трогают)/, /(отчим|отец|папа|мама|мать|брат|сестра|учитель|воспитатель|старшие|кто-то|он|она|они) (бьет|бьют|избивает|избивают|трогает|домогается) меня/,
  /надо мной издеваются/, /меня травят/,
  // ru slang and transliteration
  /выпил(иться|юсь|ился)/, /роскомнадзор(нуться|нусь|нулся|иться)/, /самовыпил/, /выйти в окно/, /не хочу просыпаться/,
  /\bne hochu zhit/, /\bhochu umeret/, /\bpokonchit s soboy/,
  // en
  /\bkill(ing)? myself\b/, /\bsuicid/, /\bwant to die\b/, /\bdon'?t want to live\b/, /\bself[- ]?harm/, /\bcut(ting)? myself\b/, /\bhurt(ing)? myself\b/,
  /\b(someone|he|she|they|my (dad|mom|mum|father|mother|stepfather|teacher)) (hits|beats|hurts|touches|abuses) me\b/, /\bi am (being )?(abused|bullied)\b/, /\bi'?m (being )?(abused|bullied)\b/,
  /\bkms\b/, /\bunalive\b/, /\bend (it all|my life)\b/, /\bkill me\b/,
  // vi
  /tự tử/, /muốn chết/, /không muốn sống/, /tự làm hại/, /bị (đánh đập|xâm hại|bắt nạt)/,
];

const DANGER = [
  // ru
  /как (сделать|собрать|изготовить|смастерить) (бомб|взрывчат|взрывн|оружи|пистолет|автомат|самопал|коктейль молотова|яд)/,
  /(купить|достать|где взять|заказать) (наркот|травк|закладк|оружи|пистолет|патрон)/,
  /как (убить|отравить|зарезать|застрелить) (?!время|скуку|вечер|час)/, /(взорвать|подорвать|заминировать|расстрелять) (школ|класс|здани|людей)/,
  /как (стрелять|целиться) (в людей|в человека)/,
  // en
  /\bhow (do i |to |can i )?(make|build|craft) (a |an )?(bomb|explosive|gun|weapon|poison|molotov)/, /\bhow (do i |to |can i )?(kill|poison|stab|shoot) (a |my |some|him|her|them|people|person)/,
  /\b(buy|get|order) (drugs|weed|a gun|bullets|ammo)\b/, /\b(blow up|shoot up) (a |the |my )?school\b/,
  // vi
  /cách (làm|chế|chế tạo) (bom|súng|thuốc nổ|chất độc)/, /mua (ma túy|súng|đạn)/, /cách giết/,
];

export const HELP = {
  ru: 'Мне очень важно, что ты об этом сказал(а). Ты не один (не одна). Пожалуйста, прямо сейчас поговори со взрослым, которому доверяешь: родители, классный руководитель, воспитатель, школьный психолог. Можно бесплатно и анонимно позвонить на Детский телефон доверия 8-800-2000-122. Если опасность прямо сейчас — звони 112.',
  en: "I'm really glad you told me. You are not alone. Please talk right now to an adult you trust: a parent, your class teacher, a school counsellor. In Russia you can call the free children's helpline 8-800-2000-122 (anonymous); in Vietnam call 111. If you are in danger right now, call 112 (Russia) or 113 (Vietnam).",
};

export const REFUSE = {
  ru: 'С этим я помогать не буду: это опасно. Давай вернёмся к уроку. Если тебе или кому-то рядом грозит опасность, скажи взрослому или позвони 112.',
  en: "I can't help with that: it's dangerous. Let's get back to our lesson. If you or someone near you is in danger, tell an adult or call 112 (Russia) / 113 (Vietnam).",
};

/** @returns {null | { kind: 'crisis' | 'danger', text: string }} */
export function checkChildSafety(text, locale = 'ru') {
  const s = norm(text);
  if (!s.trim()) return null;
  const lang = locale === 'en' ? 'en' : 'ru';
  if (CRISIS.some((re) => re.test(s))) return { kind: 'crisis', text: HELP[lang] };
  if (DANGER.some((re) => re.test(s))) return { kind: 'danger', text: REFUSE[lang] };
  return null;
}

// Every field through which a learner's own words reach an AI task (audit 21.10: phrase, vocab, answers, point… were missed).
const LEARNER_FIELDS = ['text', 'message', 'question', 'prompt', 'sentence', 'answer', 'answers', 'transcript', 'essay', 'writing',
  'phrase', 'vocab', 'point', 'word', 'words', 'reply', 'input', 'userText', 'query', 'note'];
const flat = (v, depth = 0) => {
  if (typeof v === 'string') return [v];
  if (depth > 2 || v == null || typeof v !== 'object') return [];
  return (Array.isArray(v) ? v : Object.values(v)).flatMap((x) => flat(x, depth + 1));
};

/** Text the learner typed or said, whatever the task input shape is. */
export function learnerText(input) {
  if (input == null) return '';
  if (typeof input === 'string') return input;
  return LEARNER_FIELDS.flatMap((k) => flat(input[k])).join(' ');
}

// ---- Contacts and links (audit 21.10): a child's phone / e-mail / address never goes into the class chat,
// and the model never shows links or phone numbers (it can make them up). Help lines are kept.
const KEEP_PHONES = ['8-800-2000-122', '88002000122', '112', '111', '113'];
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:ru|рф|com|net|org|su|io|me|info|xyz|vn|online|site|club)(?:\/\S*)?/giu;
const EMAIL_RE = /[\p{L}0-9._%+-]+@[\p{L}0-9.-]+\.\p{L}{2,}/gu;
const PHONE_RE = /(?:\+|\b)\d[\d\s().-]{8,}\d\b/g;
const TG_RE = /(?:^|\s)@[a-z0-9_]{4,}\b/gi;
const ADDR_RE = /(?<!\p{L})(?:ул|улица|проспект|пр-т|переулок|пер|дом|д|кв|квартира|подъезд)\.?\s+(?:[\p{L}-]+\s+)?\d+\p{L}?(?:[\s,]*(?:д|дом|кв|к)\.?\s*\d+)*/giu;
// Not a phone: help lines, big numbers written by thousands (1 000 000), sums like 12.5 - 3.25, fewer than 10 digits.
const isNotPhone = (m) => {
  const digits = m.replace(/\D/g, '');
  return KEEP_PHONES.includes(m.replace(/[^\d-]/g, '')) || KEEP_PHONES.includes(digits)
    || /^\d{1,3}(?:[ .]\d{3})+$/.test(m.trim()) || digits.length < 10 || digits.length > 13;
};
export const HIDDEN = '[скрыто]';

/** Masks phones, e-mails, links, @nicknames and street addresses. Returns { text, masked }. */
export function maskContacts(text, { addresses = true } = {}) {
  let masked = false;
  const hide = (m) => { masked = true; return m.startsWith(' ') ? ` ${HIDDEN}` : HIDDEN; };
  let s = String(text || '')
    .replace(EMAIL_RE, hide)
    .replace(URL_RE, hide)
    .replace(PHONE_RE, (m) => (isNotPhone(m) ? m : hide(m)))
    .replace(TG_RE, hide);
  if (addresses) s = s.replace(ADDR_RE, hide);
  return { text: s, masked };
}

/**
 * The model's answer is not trusted either: links / phones / contacts are removed, and an answer that itself
 * contains dangerous instructions is replaced by the refusal. Returns the cleaned text.
 */
export function cleanModelText(text, locale = 'ru') {
  if (typeof text !== 'string' || !text) return text;
  const hit = checkChildSafety(text, locale);
  if (hit && hit.kind === 'danger') return hit.text;
  return maskContacts(text, { addresses: false }).text;
}

// Tasks that answer the learner directly in free text: on a hit they get the care / refusal message.
// Every other AI task with learner text is still checked: on a hit the model is skipped (rule-based fallback only).
export const GUARDED_TASKS = ['tutor_reply'];
