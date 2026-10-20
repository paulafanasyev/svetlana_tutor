// Child-safety guard for every tutor version (base, cadet, lyceum, support).
// Runs BEFORE the AI (local model or rule-based fallback), so it works even without a model
// and cannot be talked out of by the learner ("ignore the rules" etc.).
//  - crisis: self-harm, suicide, abuse or violence against the child → short caring answer,
//    trusted adult + free helplines (RU 8-800-2000-122, VN 111, emergency 112 / 113);
//  - danger: requests for weapons, explosives, drugs, how to hurt people → brief refusal, back to the lesson.
// Plain words like "war", "army", "gun" in an English exercise are NOT blocked: only clear requests.

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');

const CRISIS = [
  // ru
  /суицид/, /покончить с собой/, /(убить|убью) себя/, /не хочу (больше )?жить/, /хочу умереть/, /лучше бы я умер/,
  /(порезать|режу|порезал[аи]?) (себя|руки|вены)/, /самоповрежд/, /наглотаться таблеток/, /прыгнуть с (крыши|моста)/,
  /меня (бьют|избивают|насилу|домогаются|трогают)/, /(отчим|отец|папа|мама|мать|брат|сестра|учитель|воспитатель|старшие|кто-то|он|она|они) (бьет|бьют|избивает|избивают|трогает|домогается) меня/,
  /надо мной издеваются/, /меня травят/,
  // en
  /\bkill(ing)? myself\b/, /\bsuicid/, /\bwant to die\b/, /\bdon'?t want to live\b/, /\bself[- ]?harm/, /\bcut(ting)? myself\b/, /\bhurt(ing)? myself\b/,
  /\b(someone|he|she|they|my (dad|mom|mum|father|mother|stepfather|teacher)) (hits|beats|hurts|touches|abuses) me\b/, /\bi am (being )?(abused|bullied)\b/, /\bi'?m (being )?(abused|bullied)\b/,
  // vi
  /tự tử/, /muốn chết/, /không muốn sống/, /tự làm hại/, /bị (đánh đập|xâm hại|bắt nạt)/,
];

const DANGER = [
  // ru
  /как (сделать|собрать|изготовить|смастерить) (бомб|взрывчат|взрывн|оружи|пистолет|автомат|самопал|коктейль молотова|яд)/,
  /(купить|достать|где взять|заказать) (наркот|травк|закладк|оружи|пистолет|патрон)/,
  /как (убить|отравить|зарезать|застрелить) /, /(взорвать|подорвать|заминировать|расстрелять) (школ|класс|здани|людей)/,
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

/** Text the learner typed or said, whatever the task input shape is. */
export function learnerText(input) {
  if (input == null) return '';
  if (typeof input === 'string') return input;
  return [input.text, input.message, input.question, input.prompt].filter((x) => typeof x === 'string').join(' ');
}

// Tasks that answer the learner directly in free text.
export const GUARDED_TASKS = ['tutor_reply'];
