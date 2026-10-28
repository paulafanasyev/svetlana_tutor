// Игры по школьным предметам 1–11 классов: Битва (наперегонки с учителем), Квест (путь с тремя жизнями)
// и Пары (карточки «термин — значение»). Вопросы по темам ФОП лежат в data/games/packs/<предмет>.json,
// каждый пакет проверили три ИИ-критика (факты, методист, детский редактор); учитель их ещё не проверял.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../../core/store.js';
import { api } from '../../../core/api.js';
import { teacherById } from '../../../data/teachers.js';
import { shuffle } from '../../../data/index.js';
import Avatar, { useEmotion } from '../../../avatar/Avatar.jsx';
import { sfx } from '../../../audio/sfx.js';
import { ProgressBar, Confetti } from '../../../ui/kit.jsx';
import { GRADES, ICONS, MODES, subjectsOfGrade } from '../../../data/games/subjects.js';
import { loadPack } from '../../../data/games/loadPack.js';
import { makeSchoolGameTaskType } from '../../../data/games/results.js';

const readGrade = (k) => { try { const g = Number(JSON.parse(localStorage.getItem(k))); return GRADES.includes(g) ? g : 5; } catch { return 5; } };
const writeGrade = (k, g) => { try { localStorage.setItem(k, JSON.stringify(g)); } catch { /* full storage */ } };

// Вопрос с перемешанными вариантами: сначала выбор, потом подсветка и объяснение.
function useShuffled(item) {
  return useMemo(() => (item ? shuffle(item.options.map((text, i) => ({ text, ok: i === item.answer }))) : []), [item]);
}

function Question({ item, picked, onPick, locked }) {
  const opts = useShuffled(item);
  return (
    <div className="card p-5">
      <div className="text-xs font-black text-ink/50">{item.topic}</div>
      <div className="font-black text-lg mt-1 leading-snug">{item.q}</div>
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        {opts.map((o) => {
          const state = picked == null ? '' : o.ok ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : picked === o.text ? 'bg-rose-100 border-rose-400 text-rose-800' : 'opacity-60';
          return (
            <button key={o.text} disabled={locked} onClick={() => onPick(o)}
              className={`rounded-2xl border-2 border-black/10 bg-surface px-4 py-3 text-left font-bold transition hover:border-primary/40 ${state}`}>
              {o.text}
            </button>
          );
        })}
      </div>
      {picked != null && <p className="mt-3 rounded-xl bg-soft/70 px-3 py-2 text-sm font-semibold">💡 {item.explain}</p>}
    </div>
  );
}

async function reward({ user, setUser, score }) {
  const xp = 10 + score * 5, coins = 5 + score * 3;
  const u = await api.earn({ xp, coins }).catch(() => null);
  if (u) setUser(u);
  return { xp, coins };
}

function recordSchoolGameAnswer({ user, pack, mode, topic, correct, durationMs }) {
  api.addAttempt({
    taskType: makeSchoolGameTaskType(pack.slug, pack.grade, mode),
    topic: String(topic || pack.subject).slice(0, 120),
    level: String(user?.level || 'A1').slice(0, 10),
    correct: Boolean(correct),
    durationMs: Math.max(0, Math.min(3600000, Math.round(durationMs || 0))),
  }).catch(() => {});
}

function Finish({ title, line, prize, won, onAgain, onBack }) {
  return (
    <div className="card p-6 text-center anim-pop">
      <Confetti burst={won} />
      <div className="text-4xl">{won ? '🏆' : '🤝'}</div>
      <div className="text-2xl font-black mt-1">{title}</div>
      {line && <div className="font-black text-lg mt-2">{line}</div>}
      {prize && <div className="chip mt-2">🎁 Награда: ⭐ {prize.xp} · 🪙 {prize.coins}</div>}
      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={onAgain}>🔁 Ещё раз</button>
        <button className="btn-ghost flex-1" onClick={onBack}>Другая игра</button>
      </div>
    </div>
  );
}

const ROUNDS = 5;

function Battle({ pack, onBack }) {
  const { user, setUser } = useApp();
  const teacher = teacherById(user.teacherId);
  const [emotion, flash] = useEmotion();
  const [qs, setQs] = useState(() => shuffle(pack.quiz).slice(0, ROUNDS));
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ai, setAi] = useState(0);
  const [score, setScore] = useState({ you: 0, ai: 0 });
  const [prize, setPrize] = useState(null);
  const timer = useRef(null);
  const t0 = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const item = qs[n];
  const over = n >= qs.length;

  useEffect(() => {
    if (over || picked != null) return undefined;
    const dur = 9000 + item.q.length * 90 + Math.random() * 3000;
    const start = Date.now();
    timer.current = setInterval(() => {
      const p = (Date.now() - start) / dur;
      setAi(p);
      if (p >= 1) {
        clearInterval(timer.current);
        recordSchoolGameAnswer({ user, pack, mode: 'battle', topic: item.topic, correct: false, durationMs: Date.now() - questionStartedAt.current });
        setPicked(''); sfx.wrong(); flash('encourage'); setScore((s) => ({ ...s, ai: s.ai + 1 }));
      }
    }, 90);
    return () => clearInterval(timer.current);
  }, [n, over]); // eslint-disable-line

  useEffect(() => {
    if (!over) return;
    reward({ user, setUser, score: score.you }).then(setPrize);
    if (score.you > score.ai) sfx.levelUp();
  }, [over]); // eslint-disable-line

  const pick = (o) => {
    if (picked != null) return;
    clearInterval(timer.current);
    setPicked(o.text);
    recordSchoolGameAnswer({ user, pack, mode: 'battle', topic: item.topic, correct: o.ok, durationMs: Date.now() - questionStartedAt.current });
    if (o.ok) { sfx.correct(); flash('happy'); setScore((s) => ({ ...s, you: s.you + 1 })); }
    else { sfx.wrong(); flash('encourage'); setScore((s) => ({ ...s, ai: s.ai + 1 })); }
  };
  const next = () => { setPicked(null); setAi(0); setN(n + 1); questionStartedAt.current = Date.now(); };
  const again = () => { setQs(shuffle(pack.quiz).slice(0, ROUNDS)); setN(0); setPicked(null); setAi(0); setScore({ you: 0, ai: 0 }); setPrize(null); t0.current = Date.now(); questionStartedAt.current = Date.now(); };

  const won = score.you > score.ai;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 flex justify-between font-black"><span>🎒 Ты</span><span>{score.you}</span></div>
        <div className="card p-3 flex items-center gap-2">
          <div className="w-9 shrink-0"><Avatar teacher={teacher} emotion={emotion} rounded="rounded-lg" /></div>
          <div className="flex-1">
            <div className="flex justify-between font-black text-sm"><span>{teacher.name}</span><span>{score.ai}</span></div>
            {!over && picked == null && <ProgressBar value={ai} className="mt-1 !h-2" color="linear-gradient(90deg,#f43f5e,#f97316)" />}
          </div>
        </div>
      </div>
      {!over && (
        <>
          <div className="chip">Раунд {n + 1} / {qs.length}</div>
          <Question item={item} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && (
            <div className="text-center">
              {picked === '' && <div className="font-black text-rose-500 mb-2">⏰ {teacher.name} ответил первым!</div>}
              <button className="btn-primary w-full" onClick={next}>{n + 1 < qs.length ? 'Следующий раунд →' : 'Итоги →'}</button>
            </div>
          )}
        </>
      )}
      {over && <Finish won={won} title={won ? 'Победа!' : score.you === score.ai ? 'Ничья' : `Победил ${teacher.name}`} line={`${score.you} : ${score.ai}`} prize={prize} onAgain={again} onBack={onBack} />}
    </div>
  );
}

const STEPS = 8;

function Quest({ pack, onBack }) {
  const { user, setUser } = useApp();
  const [qs, setQs] = useState(() => shuffle(pack.quiz).slice(0, STEPS));
  const [n, setN] = useState(0);
  const [lives, setLives] = useState(3);
  const [ok, setOk] = useState(0);
  const [picked, setPicked] = useState(null);
  const [prize, setPrize] = useState(null);
  const t0 = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const lost = lives <= 0 && picked == null;
  const over = n >= qs.length || lost;

  useEffect(() => {
    if (!over) return;
    reward({ user, setUser, score: ok }).then(setPrize);
    if (!lost) sfx.levelUp();
  }, [over]); // eslint-disable-line

  const pick = (o) => {
    if (picked != null) return;
    setPicked(o.text);
    recordSchoolGameAnswer({ user, pack, mode: 'quest', topic: qs[n].topic, correct: o.ok, durationMs: Date.now() - questionStartedAt.current });
    if (o.ok) { sfx.correct(); setOk((x) => x + 1); } else { sfx.wrong(); setLives((l) => l - 1); }
  };
  const next = () => { setPicked(null); if (lives > 0) setN(n + 1); questionStartedAt.current = Date.now(); };
  const again = () => { setQs(shuffle(pack.quiz).slice(0, STEPS)); setN(0); setLives(3); setOk(0); setPicked(null); setPrize(null); t0.current = Date.now(); questionStartedAt.current = Date.now(); };

  return (
    <div className="space-y-4">
      <div className="card p-3 flex items-center gap-1 overflow-x-auto" aria-label="Путь квеста">
        {qs.map((q, i) => (
          <span key={q.id} className={`grid place-items-center h-9 min-w-9 rounded-full text-sm font-black ${i < n ? 'bg-emerald-400 text-white' : i === n && !over ? 'bg-primary text-white anim-pop' : 'bg-soft text-ink/50'}`}>{i < n ? '✓' : i + 1}</span>
        ))}
        <span className="text-2xl ml-1" aria-hidden="true">💎</span>
        <span className="ml-auto chip">{'❤️'.repeat(Math.max(lives, 0))}{'🖤'.repeat(3 - Math.max(lives, 0))}</span>
      </div>
      {!over && (
        <>
          <Question item={qs[n]} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && <button className="btn-primary w-full" onClick={next}>{lives > 0 ? (n + 1 < qs.length ? 'Дальше по пути →' : 'Открыть сокровище →') : 'Итоги →'}</button>}
        </>
      )}
      {over && <Finish won={!lost} title={lost ? 'Жизни кончились, попробуй ещё!' : 'Сокровище твоё!'} line={`Верно: ${ok} из ${qs.length}`} prize={prize} onAgain={again} onBack={onBack} />}
    </div>
  );
}

const MAX_PAIRS = 6;

function buildDeck(pairs) {
  return shuffle(shuffle(pairs).slice(0, MAX_PAIRS).flatMap((p) => [
    { key: p.id + 't', pair: p.id, text: p.term, side: 't' },
    { key: p.id + 'm', pair: p.id, text: p.meaning, side: 'm' },
  ]));
}

function Pairs({ pack, onBack }) {
  const { user, setUser } = useApp();
  const [deck, setDeck] = useState(() => buildDeck(pack.pairs));
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [prize, setPrize] = useState(null);
  const lock = useRef(false);
  const t0 = useRef(Date.now());
  const firstFlipAt = useRef(Date.now());
  const total = deck.length / 2;
  const done = matched.length === total;

  useEffect(() => {
    if (!done) return;
    sfx.levelUp();
    reward({ user, setUser, score: Math.max(1, total * 2 - moves + 2) }).then(setPrize);
  }, [done]); // eslint-disable-line

  const flip = (c) => {
    if (lock.current || done || open.includes(c.key) || matched.includes(c.pair)) return;
    sfx.pop();
    const now = [...open, c.key];
    setOpen(now);
    if (now.length < 2) { firstFlipAt.current = Date.now(); return; }
    lock.current = true;
    setMoves((m) => m + 1);
    const [a, b] = now.map((k) => deck.find((x) => x.key === k));
    const isMatch = a.pair === b.pair && a.side !== b.side;
    recordSchoolGameAnswer({ user, pack, mode: 'pairs', topic: isMatch ? (a.side === 't' ? a.text : b.text) : ('Ошибочное сопоставление: ' + a.text + ' / ' + b.text), correct: isMatch, durationMs: Date.now() - firstFlipAt.current });
    if (isMatch) setTimeout(() => { sfx.match(); setMatched((m) => [...m, a.pair]); setOpen([]); lock.current = false; }, 350);
    else setTimeout(() => { sfx.wrong(); setOpen([]); lock.current = false; }, 900);
  };
  const again = () => { setDeck(buildDeck(pack.pairs)); setOpen([]); setMatched([]); setMoves(0); setPrize(null); lock.current = false; t0.current = Date.now(); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2"><span className="chip">🎬 Ходы: {moves}</span><span className="chip">✅ {matched.length}/{total}</span></div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {deck.map((c) => {
          const isMatched = matched.includes(c.pair);
          const isOpen = isMatched || open.includes(c.key);
          return (
            <button key={c.key} onClick={() => flip(c)} aria-label={isOpen ? c.text : 'Закрытая карточка'}
              className={`min-h-[88px] rounded-2xl p-2 text-xs sm:text-sm font-black leading-tight flex items-center justify-center text-center transition
                ${isMatched ? 'bg-emerald-100 text-emerald-700 scale-95' : isOpen ? 'bg-surface shadow-lg border-2 border-primary/40' : 'text-white shadow-md hover:scale-[1.03]'}`}
              style={!isOpen ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : {}}>
              {isOpen ? c.text : '❓'}
            </button>
          );
        })}
      </div>
      {done && <Finish won title="Все пары найдены!" line={`Ходов: ${moves}`} prize={prize} onAgain={again} onBack={onBack} />}
    </div>
  );
}


function Memory({ pack, onBack }) {
  const { user, setUser } = useApp();
  const [items, setItems] = useState(() => shuffle(pack.quiz).slice(0, Math.min(5, pack.quiz.length)));
  const [testItems, setTestItems] = useState([]);
  const [phase, setPhase] = useState('study');
  const [studyN, setStudyN] = useState(0);
  const [testN, setTestN] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ok, setOk] = useState(0);
  const [prize, setPrize] = useState(null);
  const questionStartedAt = useRef(Date.now());
  const over = phase === 'recall' && testN >= testItems.length;
  const item = testItems[testN];

  useEffect(() => {
    if (!over) return;
    reward({ user, setUser, score: ok }).then(setPrize);
  }, [over]); // eslint-disable-line

  const beginRecall = () => {
    setTestItems(shuffle(items));
    setTestN(0);
    setPicked(null);
    setPhase('recall');
    questionStartedAt.current = Date.now();
  };
  const pick = (option) => {
    if (picked != null || !item) return;
    setPicked(option.text);
    recordSchoolGameAnswer({ user, pack, mode: 'memory', topic: item.topic, correct: option.ok, durationMs: Date.now() - questionStartedAt.current });
    if (option.ok) { setOk((x) => x + 1); sfx.correct(); } else sfx.wrong();
  };
  const nextRecall = () => {
    if (testN + 1 >= testItems.length) setTestN(testItems.length);
    else { setTestN(testN + 1); setPicked(null); questionStartedAt.current = Date.now(); }
  };
  const again = () => {
    setItems(shuffle(pack.quiz).slice(0, Math.min(5, pack.quiz.length)));
    setTestItems([]);
    setPhase('study');
    setStudyN(0);
    setTestN(0);
    setPicked(null);
    setOk(0);
    setPrize(null);
    questionStartedAt.current = Date.now();
  };

  return (
    <div className="space-y-4">
      {phase === 'study' && (
        <>
          <div className="card p-5 space-y-3">
            <div className="chip">Этап 1 из 2 · Карточка {studyN + 1} из {items.length}</div>
            <div className="text-xs font-black text-ink/50">{items[studyN].topic}</div>
            <div className="text-xl font-black leading-snug">{items[studyN].q}</div>
            <div className="rounded-2xl bg-soft p-4">
              <div className="text-xs font-black text-ink/50">Запомни ответ</div>
              <div className="text-lg font-black mt-1">{items[studyN].options[items[studyN].answer]}</div>
              <p className="text-sm font-semibold text-ink/60 mt-2">{items[studyN].explain}</p>
            </div>
            <p className="text-sm font-semibold text-ink/60">Свяжи вопрос с ответом: датой, формулой, термином или определением. Через несколько карточек система попросит вспомнить ответ без показа подсказки.</p>
          </div>
          <button className="btn-primary w-full" onClick={() => {
            if (studyN + 1 < items.length) setStudyN(studyN + 1);
            else beginRecall();
          }}>{studyN + 1 < items.length ? 'Запомнил — следующая карточка →' : 'Проверить память →'}</button>
        </>
      )}
      {phase === 'recall' && !over && item && (
        <>
          <div className="chip">Этап 2 из 2 · Вспомни ответ {testN + 1} из {testItems.length}</div>
          <Question item={item} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && <button className="btn-primary w-full" onClick={nextRecall}>{testN + 1 < testItems.length ? 'Следующее задание →' : 'Посмотреть результат →'}</button>}
        </>
      )}
      {over && <Finish won={ok >= Math.ceil(testItems.length * 0.8)} title="Проверка памяти завершена" line={'Вспомнил: ' + ok + ' из ' + testItems.length} prize={prize} onAgain={again} onBack={onBack} />}
    </div>
  );
}
const GAMES = { battle: Battle, quest: Quest, pairs: Pairs, memory: Memory };

export default function SchoolGames() {
  const { user } = useApp();
  const [params, setParams] = useSearchParams();
  const gKey = `aet_grade_${user.id}`;
  const grade = GRADES.includes(Number(params.get('g'))) ? Number(params.get('g')) : readGrade(gKey);
  const slug = params.get('s') || '';
  const mode = params.get('m') || '';
  const cell = subjectsOfGrade(grade).find((c) => c.slug === slug) || null;
  const [pack, setPack] = useState(null);
  const [err, setErr] = useState(false);

  const go = (next) => { sfx.click(); setParams(Object.fromEntries(Object.entries({ g: grade, ...next }).filter(([, v]) => v !== '' && v != null))); };
  const setGrade = (g) => { writeGrade(gKey, g); go({ g, s: '', m: '' }); };

  useEffect(() => {
    setPack(null); setErr(false);
    if (!cell) return;
    let alive = true;
    loadPack(cell.slug, grade).then((p) => { if (alive) { setPack(p); setErr(!p); } }).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [cell?.slug, grade]); // eslint-disable-line

  const Game = GAMES[mode];
  const m = MODES.find((x) => x.id === mode);
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="h1">🎮 Игры по предметам</h1>
        <p className="text-sm font-semibold text-ink/60 mt-1">Вопросы по темам федеральной программы твоего класса. Отвечай, побеждай учителя и собирай награды.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Класс">
        <span className="font-black mr-1">Класс:</span>
        {GRADES.map((g) => (
          <button key={g} onClick={() => setGrade(g)} aria-pressed={g === grade} className={`rounded-full min-w-[2.5rem] px-3 py-1.5 text-sm font-black ${g === grade ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{g}</button>
        ))}
      </div>

      {!cell && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {subjectsOfGrade(grade).map((c) => (
            <button key={c.slug} onClick={() => go({ s: c.slug, m: '' })} className="card p-4 text-left hover:brightness-95 transition flex flex-col gap-1">
              <span className="text-3xl" aria-hidden="true">{ICONS[c.slug] || '📘'}</span>
              <span className="font-black leading-tight">{c.subject}</span>
            </button>
          ))}
        </div>
      )}

      {cell && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className="text-sm font-bold text-primary" onClick={() => go({ s: '', m: '' })}>← Все предметы</button>
            <span className="font-black">{ICONS[cell.slug]} {cell.subject}, {grade} класс{m ? ` · ${m.icon} ${m.name}` : ''}</span>
            {m && <button className="ml-auto text-sm font-bold text-primary" onClick={() => go({ s: cell.slug, m: '' })}>Сменить игру</button>}
          </div>
          {err && <div className="card p-5 font-semibold text-ink/60">Вопросы для этого класса пока не готовы.</div>}
          {!err && !pack && <div className="card p-5 font-semibold text-ink/50">Загружаю вопросы…</div>}
          {pack && !Game && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MODES.map((x) => (
                <button key={x.id} onClick={() => go({ s: cell.slug, m: x.id })} className="rounded-3xl p-5 text-left text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl hover:-translate-y-1 transition">
                  <div className="text-4xl">{x.icon}</div>
                  <div className="mt-1 text-lg font-black">{x.name}</div>
                  <div className="text-sm font-semibold text-white/85">{x.desc}</div>
                </button>
              ))}
            </div>
          )}
          {pack && Game && <Game key={`${cell.slug}-${grade}-${mode}`} pack={pack} onBack={() => go({ s: cell.slug, m: '' })} />}
          {pack && (
            <p className="text-xs font-semibold text-ink/50">
              Вопросы составлены по темам ФОП и проверены тремя ИИ-критиками (факты, методика, понятность для детей){pack.review?.date ? `, ${pack.review.date.split('-').reverse().join('.')}` : ''}. Учитель их ещё не проверял: если нашёл ошибку, скажи учителю или родителю.
            </p>
          )}
        </div>
      )}

      <Link to="/games" className="inline-block text-sm font-bold text-primary underline">🔤 Игры по английскому</Link>
    </div>
  );
}
