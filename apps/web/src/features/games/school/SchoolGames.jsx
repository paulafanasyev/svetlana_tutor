// Игры по школьным предметам 1–11 классов: Битва (наперегонки с учителем), Квест (путь с тремя жизнями)
// и Пары (карточки «термин — значение»). Вопросы по темам ФОП лежат в data/games/packs/<предмет>.json,
// каждый пакет проверили три ИИ-критика (факты, методист, детский редактор); учитель их ещё не проверял.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useBlocker } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../../core/store.js';
import { api } from '../../../core/api.js';
import { teacherById } from '../../../data/teachers.js';
import { shuffle } from '../../../data/index.js';
import Avatar, { useEmotion } from '../../../avatar/Avatar.jsx';
import { sfx } from '../../../audio/sfx.js';
import { ProgressBar, Confetti } from '../../../ui/kit.jsx';
import { GRADES, ICONS, MODES, subjectsOfGrade, availableTracks } from '../../../data/games/subjects.js';
import { loadPack } from '../../../data/games/loadPack.js';
import { makeSchoolGameTaskType } from '../../../data/games/results.js';

const readGrade = (k) => { try { const g = Number(JSON.parse(localStorage.getItem(k))); return GRADES.includes(g) ? g : 5; } catch { return 5; } };
const writeGrade = (k, g) => { try { localStorage.setItem(k, JSON.stringify(g)); } catch { /* full storage */ } };
const readTrack = () => { try { return JSON.parse(localStorage.getItem('aet_game_track')) || 'base'; } catch { return 'base'; } };
const writeTrack = (t) => { try { localStorage.setItem('aet_game_track', JSON.stringify(t)); } catch { /* full storage */ } };

// Вопрос с перемешанными вариантами: сначала выбор, потом подсветка и объяснение.
function useShuffled(item) {
  return useMemo(() => (item ? shuffle(item.options.map((text, i) => ({ text, ok: i === item.answer }))) : []), [item]);
}

const Question = React.memo(function Question({ item, picked, onPick, locked }) {
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
});

async function reward({ user, setUser, score, t }) {
  const xp = 10 + score * 5, coins = 5 + score * 3;
  const u = await api.earn({ xp, coins }).catch(() => null);
  if (u) {
    setUser(u);
  } else if (t) {
    // Surface error to caller — the component shows a toast-like message.
    return { xp: 0, coins: 0, error: t('sg.rewardError') };
  }
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

function Finish({ title, line, prize, won, onAgain, onBack, t, errorMsg }) {
  return (
    <div className="card p-6 text-center anim-pop">
      <Confetti burst={won} />
      <div className="text-4xl">{won ? '🏆' : '🤝'}</div>
      <div className="text-2xl font-black mt-1">{title}</div>
      {line && <div className="font-black text-lg mt-2">{line}</div>}
      {prize && !prize.error && <div className="chip mt-2">{t('sg.reward', { xp: prize.xp, coins: prize.coins })}</div>}
      {errorMsg && <div className="mt-2 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">{errorMsg}</div>}
      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex-1" onClick={onAgain}>{t('sg.again')}</button>
        <button className="btn-ghost flex-1" onClick={onBack}>{t('sg.otherGame')}</button>
      </div>
    </div>
  );
}

const ROUNDS = 5;

function Battle({ pack, onBack }) {
  const { user, setUser } = useApp();
  const t = useT();
  const teacher = teacherById(user.teacherId);
  const [emotion, flash] = useEmotion();
  const [qs, setQs] = useState(() => shuffle(pack.quiz).slice(0, ROUNDS));
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ai, setAi] = useState(0);
  const [score, setScore] = useState({ you: 0, ai: 0 });
  const [prize, setPrize] = useState(null);
  const [rewardError, setRewardError] = useState(null);
  const timer = useRef(null);
  const t0 = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const item = qs[n];
  const over = n >= qs.length;

  const stableUser = user;
  const stableSetUser = setUser;
  const stablePack = pack;
  const stableTeacher = teacher;

  useEffect(() => {
    if (over || picked != null) return undefined;
    const dur = 9000 + item.q.length * 90 + Math.random() * 3000;
    const start = Date.now();
    timer.current = setInterval(() => {
      const p = (Date.now() - start) / dur;
      setAi(p);
      if (p >= 1) {
        clearInterval(timer.current);
        recordSchoolGameAnswer({ user: stableUser, pack: stablePack, mode: 'battle', topic: item.topic, correct: false, durationMs: Date.now() - questionStartedAt.current });
        setPicked(''); sfx.wrong(); flash('encourage'); setScore((s) => ({ ...s, ai: s.ai + 1 }));
      }
    }, 90);
    return () => clearInterval(timer.current);
  }, [n, over, item, stableUser, stablePack, flash]);

  useEffect(() => {
    if (!over) return;
    reward({ user: stableUser, setUser: stableSetUser, score: score.you, t }).then((p) => {
      if (p.error) setRewardError(p.error);
      else setPrize(p);
    });
    if (score.you > score.ai) sfx.levelUp();
  }, [over, score.you, score.ai, stableUser, stableSetUser, t]);

  const pick = useCallback((o) => {
    if (picked != null) return;
    clearInterval(timer.current);
    setPicked(o.text);
    recordSchoolGameAnswer({ user: stableUser, pack: stablePack, mode: 'battle', topic: item.topic, correct: o.ok, durationMs: Date.now() - questionStartedAt.current });
    if (o.ok) { sfx.correct(); flash('happy'); setScore((s) => ({ ...s, you: s.you + 1 })); }
    else { sfx.wrong(); flash('encourage'); setScore((s) => ({ ...s, ai: s.ai + 1 })); }
  }, [picked, stableUser, stablePack, item, flash]);

  const next = useCallback(() => { setPicked(null); setAi(0); setN(n + 1); questionStartedAt.current = Date.now(); }, [n]);
  const again = useCallback(() => { setQs(shuffle(pack.quiz).slice(0, ROUNDS)); setN(0); setPicked(null); setAi(0); setScore({ you: 0, ai: 0 }); setPrize(null); setRewardError(null); t0.current = Date.now(); questionStartedAt.current = Date.now(); }, [pack]);

  const won = score.you > score.ai;
  const finishTitle = won ? t('sg.battle.victory') : score.you === score.ai ? t('sg.battle.draw') : t('sg.battle.teacherWon', { name: stableTeacher.name });
  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">{t('sg.battle.round', { n: n + 1, total: qs.length })} — {score.you} : {score.ai}</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 flex justify-between font-black"><span>{t('sg.battle.you')}</span><span>{score.you}</span></div>
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
          <div className="chip">{t('sg.battle.round', { n: n + 1, total: qs.length })}</div>
          <Question item={item} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && (
            <div className="text-center">
              {picked === '' && <div className="font-black text-rose-500 mb-2">{t('sg.battle.teacherFirst', { name: teacher.name })}</div>}
              <button className="btn-primary w-full" onClick={next}>{n + 1 < qs.length ? t('sg.battle.nextRound') : t('sg.battle.results')}</button>
            </div>
          )}
        </>
      )}
      {over && <Finish won={won} title={finishTitle} line={`${score.you} : ${score.ai}`} prize={prize} onAgain={again} onBack={onBack} t={t} errorMsg={rewardError} />}
    </div>
  );
}

const STEPS = 8;

function Quest({ pack, onBack }) {
  const { user, setUser } = useApp();
  const t = useT();
  const [qs, setQs] = useState(() => shuffle(pack.quiz).slice(0, STEPS));
  const [n, setN] = useState(0);
  const [lives, setLives] = useState(3);
  const [ok, setOk] = useState(0);
  const [picked, setPicked] = useState(null);
  const [prize, setPrize] = useState(null);
  const [rewardError, setRewardError] = useState(null);
  const t0 = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const lost = lives <= 0 && picked == null;
  const over = n >= qs.length || lost;

  const stableUser = user;
  const stableSetUser = setUser;
  const stablePack = pack;

  useEffect(() => {
    if (!over) return;
    reward({ user: stableUser, setUser: stableSetUser, score: ok, t }).then((p) => {
      if (p.error) setRewardError(p.error);
      else setPrize(p);
    });
    if (!lost) sfx.levelUp();
  }, [over, ok, lost, stableUser, stableSetUser, t]);

  const pick = useCallback((o) => {
    if (picked != null) return;
    setPicked(o.text);
    recordSchoolGameAnswer({ user: stableUser, pack: stablePack, mode: 'quest', topic: qs[n].topic, correct: o.ok, durationMs: Date.now() - questionStartedAt.current });
    if (o.ok) { sfx.correct(); setOk((x) => x + 1); } else { sfx.wrong(); setLives((l) => l - 1); }
  }, [picked, stableUser, stablePack, qs, n]);

  const next = useCallback(() => { setPicked(null); if (lives > 0) setN(n + 1); questionStartedAt.current = Date.now(); }, [n, lives]);
  const again = useCallback(() => { setQs(shuffle(pack.quiz).slice(0, STEPS)); setN(0); setLives(3); setOk(0); setPicked(null); setPrize(null); setRewardError(null); t0.current = Date.now(); questionStartedAt.current = Date.now(); }, [pack]);

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">{t('sg.quest.correctOf', { ok, total: qs.length })} — {'❤️'.repeat(Math.max(lives, 0))}</div>
      <div className="card p-3 flex items-center gap-1 overflow-x-auto" aria-label={t('sg.quest.pathLabel')}>
        {qs.map((q, i) => (
          <span key={q.id} className={`grid place-items-center h-9 min-w-9 rounded-full text-sm font-black ${i < n ? 'bg-emerald-400 text-white' : i === n && !over ? 'bg-primary text-white anim-pop' : 'bg-soft text-ink/50'}`}>{i < n ? '✓' : i + 1}</span>
        ))}
        <span className="text-2xl ml-1" aria-hidden="true">💎</span>
        <span className="ml-auto chip" aria-label={`${lives} ${lives === 1 ? 'life' : 'lives'}`}>{'❤️'.repeat(Math.max(lives, 0))}{'🖤'.repeat(3 - Math.max(lives, 0))}</span>
      </div>
      {!over && (
        <>
          <Question item={qs[n]} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && <button className="btn-primary w-full" onClick={next}>{lives > 0 ? (n + 1 < qs.length ? t('sg.quest.nextStep') : t('sg.quest.openTreasure')) : t('sg.quest.results')}</button>}
        </>
      )}
      {over && <Finish won={!lost} title={lost ? t('sg.quest.livesOver') : t('sg.quest.treasure')} line={t('sg.quest.correctOf', { ok, total: qs.length })} prize={prize} onAgain={again} onBack={onBack} t={t} errorMsg={rewardError} />}
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
  const t = useT();
  const [deck, setDeck] = useState(() => buildDeck(pack.pairs));
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [prize, setPrize] = useState(null);
  const [rewardError, setRewardError] = useState(null);
  const lock = useRef(false);
  const t0 = useRef(Date.now());
  const firstFlipAt = useRef(Date.now());
  const total = deck.length / 2;
  const done = matched.length === total;

  const stableUser = user;
  const stableSetUser = setUser;
  const stablePack = pack;

  useEffect(() => {
    if (!done) return;
    sfx.levelUp();
    reward({ user: stableUser, setUser: stableSetUser, score: Math.max(1, total * 2 - moves + 2), t }).then((p) => {
      if (p.error) setRewardError(p.error);
      else setPrize(p);
    });
  }, [done, total, moves, stableUser, stableSetUser, t]);

  const flip = useCallback((c) => {
    if (lock.current || done || open.includes(c.key) || matched.includes(c.pair)) return;
    sfx.pop();
    const now = [...open, c.key];
    setOpen(now);
    if (now.length < 2) { firstFlipAt.current = Date.now(); return; }
    lock.current = true;
    setMoves((m) => m + 1);
    [a, b] = now.map((k) => deck.find((x) => x.key === k));
    const isMatch = a.pair === b.pair && a.side !== b.side;
    recordSchoolGameAnswer({ user: stableUser, pack: stablePack, mode: 'pairs', topic: isMatch ? (a.side === 't' ? a.text : b.text) : ('Ошибочное сопоставление: ' + a.text + ' / ' + b.text), correct: isMatch, durationMs: Date.now() - firstFlipAt.current });
    if (isMatch) setTimeout(() => { sfx.match(); setMatched((m) => [...m, a.pair]); setOpen([]); lock.current = false; }, 350);
    else setTimeout(() => { sfx.wrong(); setOpen([]); lock.current = false; }, 900);
  }, [done, open, matched, deck, stableUser, stablePack]);

  const again = useCallback(() => { setDeck(buildDeck(pack.pairs)); setOpen([]); setMatchMatched([]); setMoves(0); setPrize(null); setRewardError(null); lock.current = false; t0.current = Date.now(); }, [pack]);

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">{t('sg.pairs.matched', { n: matched.length, total })}</div>
      <div className="flex gap-2"><span className="chip">{t('sg.pairs.moves', { n: moves })}</span><span className="chip">{t('sg.pairs.matched', { n: matched.length, total })}</span></div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {deck.map((c) => {
          const isMatched = matched.includes(c.pair);
          const isOpen = isMatched || open.includes(c.key);
          return (
            <button key={c.key} onClick={() => flip(c)} aria-label={isOpen ? c.text : t('sg.pairs.closedCard')}
              className={`min-h-[88px] rounded-2xl p-2 text-xs sm:text-sm font-black leading-tight flex items-center justify-center text-center transition
                ${isMatched ? 'bg-emerald-100 text-emerald-700 scale-95' : isOpen ? 'bg-surface shadow-lg border-2 border-primary/40' : 'text-white shadow-md hover:scale-[1.03]'}`}
              style={!isOpen ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : {}}>
              {isOpen ? c.text : '❓'}
            </button>
          );
        })}
      </div>
      {done && <Finish won title={t('sg.pairs.allFound')} line={t('sg.pairs.movesResult', { n: moves })} prize={prize} onAgain={again} onBack={onBack} t={t} errorMsg={rewardError} />}
    </div>
  );
}


function Memory({ pack, onBack }) {
  const { user, setUser } = useApp();
  const t = useT();
  const [items, setItems] = useState(() => shuffle(pack.quiz).slice(0, Math.min(5, pack.quiz.length)));
  const [testItems, setTestItems] = useState([]);
  const [phase, setPhase] = useState('study');
  const [studyN, setStudyN] = useState(0);
  const [testN, setTestN] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ok, setOk] = useState(0);
  const [prize, setPrize] = useState(null);
  const [rewardError, setRewardError] = useState(null);
  const questionStartedAt = useRef(Date.now());
  const over = phase === 'recall' && testN >= testItems.length;
  const item = testItems[testN];

  const stableUser = user;
  const stableSetUser = setUser;

  useEffect(() => {
    if (!over) return;
    reward({ user: stableUser, setUser: stableSetUser, score: ok, t }).then((p) => {
      if (p.error) setRewardError(p.error);
      else setPrize(p);
    });
  }, [over, ok, stableUser, stableSetUser, t]);

  const beginRecall = useCallback(() => {
    setTestItems(shuffle(items));
    setTestN(0);
    setPicked(null);
    setPhase('recall');
    questionStartedAt.current = Date.now();
  }, [items]);

  const pick = useCallback((option) => {
    if (picked != null || !item) return;
    setPicked(option.text);
    recordSchoolGameAnswer({ user: stableUser, pack, mode: 'memory', topic: item.topic, correct: option.ok, durationMs: Date.now() - questionStartedAt.current });
    if (option.ok) { setOk((x) => x + 1); sfx.correct(); } else sfx.wrong();
  }, [picked, item, stableUser, pack]);

  const nextRecall = useCallback(() => {
    if (testN + 1 >= testItems.length) setTestN(testItems.length);
    else { setTestN(testN + 1); setPicked(null); questionStartedAt.current = Date.now(); }
  }, [testN, testItems]);

  const again = useCallback(() => {
    setItems(shuffle(pack.quiz).slice(0, Math.min(5, pack.quiz.length)));
    setTestItems([]);
    setPhase('study');
    setStudyN(0);
    setTestN(0);
    setPicked(null);
    setOk(0);
    setPrize(null);
    setRewardError(null);
    questionStartedAt.current = Date.now();
  }, [pack]);

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">
        {phase === 'study' ? t('sg.memory.stage1', { n: studyN + 1, total: items.length }) : t('sg.memory.stage2', { n: testN + 1, total: testItems.length })}
      </div>
      {phase === 'study' && (
        <>
          <div className="card p-5 space-y-3">
            <div className="chip">{t('sg.memory.stage1', { n: studyN + 1, total: items.length })}</div>
            <div className="text-xs font-black text-ink/50">{items[studyN].topic}</div>
            <div className="text-xl font-black leading-snug">{items[studyN].q}</div>
            <div className="rounded-2xl bg-soft p-4">
              <div className="text-xs font-black text-ink/50">{t('sg.memory.rememberAnswer')}</div>
              <div className="text-lg font-black mt-1">{items[studyN].options[items[studyN].answer]}</div>
              <p className="text-sm font-semibold text-ink/60 mt-2">{items[studyN].explain}</p>
            </div>
            <p className="text-sm font-semibold text-ink/60">{t('sg.memory.hint')}</p>
          </div>
          <button className="btn-primary w-full" onClick={() => {
            if (studyN + 1 < items.length) setStudyN(studyN + 1);
            else beginRecall();
          }}>{studyN + 1 < items.length ? t('sg.memory.rememberedNext') : t('sg.memory.testMemory')}</button>
        </>
      )}
      {phase === 'recall' && !over && item && (
        <>
          <div className="chip">{t('sg.memory.stage2', { n: testN + 1, total: testItems.length })}</div>
          <Question item={item} picked={picked} onPick={pick} locked={picked != null} />
          {picked != null && <button className="btn-primary w-full" onClick={nextRecall}>{testN + 1 < testItems.length ? t('sg.memory.nextTask') : t('sg.memory.seeResult')}</button>}
        </>
      )}
      {over && <Finish won={ok >= Math.ceil(testItems.length * 0.8)} title={t('sg.memory.done')} line={t('sg.memory.remembered', { ok, total: testItems.length })} prize={prize} onAgain={again} onBack={onBack} t={t} errorMsg={rewardError} />}
    </div>
  );
}
const GAMES = { battle: Battle, quest: Quest, pairs: Pairs, memory: Memory };

export default function SchoolGames() {
  const { user } = useApp();
  const t = useT();
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const gKey = `aet_grade_${user.id}`;
  const grade = GRADES.includes(Number(params.get('g'))) ? Number(params.get('g')) : readGrade(gKey);
  const slug = params.get('s') || '';
  const mode = params.get('m') || '';
  const [gameTrack, setGameTrack] = useState(readTrack);
  const subjects = useMemo(() => subjectsOfGrade(grade), [grade]);
  const cell = subjects.find((c) => c.slug === slug) || null;
  const [pack, setPack] = useState(null);
  const [err, setErr] = useState(false);
  const tracks = useMemo(() => availableTracks(), []);
  const gameInProgress = Boolean(mode && pack);

  // Block navigation away from an in-progress game
  const blocker = useBlocker(gameInProgress);
  useEffect(() => {
    if (!gameInProgress) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [gameInProgress]);

  const go = useCallback((next) => { sfx.click(); setParams(Object.fromEntries(Object.entries({ g: grade, ...next }).filter(([, v]) => v !== '' && v != null))); }, [grade, setParams]);
  const setGrade = useCallback((g) => { writeGrade(gKey, g); go({ g, s: '', m: '' }); }, [gKey, go]);
  const changeTrack = useCallback((tid) => { writeTrack(tid); setGameTrack(tid); setPack(null); setErr(false); }, []);

  useEffect(() => {
    setPack(null); setErr(false);
    if (!cell) return;
    let alive = true;
    loadPack(cell.slug, grade, gameTrack).then((p) => { if (alive) { setPack(p); setErr(!p); } }).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [cell?.slug, grade, gameTrack]);

  const Game = GAMES[mode];
  const m = MODES.find((x) => x.id === mode);
  const reviewDate = pack?.review?.date ? `, ${pack.review.date.split('-').reverse().join('.')}` : '';
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Confirmation dialog when navigating away from in-progress game */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={t('sg.leaveConfirm')}>
          <div className="card p-6 max-w-sm mx-4 space-y-3">
            <div className="font-black text-lg">{t('sg.leaveConfirm')}</div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => blocker.proceed()}>{t('common.close') || 'Leave'}</button>
              <button className="btn-ghost flex-1" onClick={() => blocker.reset()}>{t('common.cancel') || 'Stay'}</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="h1">🎮 {t('sg.title')}</h1>
        <p className="text-sm font-semibold text-ink/60 mt-1">{t('sg.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('sg.grade')}>
        <span className="font-black mr-1">{t('sg.grade')}</span>
        {GRADES.map((g) => (
          <button key={g} onClick={() => setGrade(g)} aria-pressed={g === grade} aria-current={g === grade ? 'step' : undefined} className={`rounded-full min-w-[2.5rem] px-3 py-1.5 text-sm font-black ${g === grade ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{g}</button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('sg.track')}>
        <span className="font-black mr-1">{t('sg.track')}</span>
        {tracks.map((tr) => (
          <button key={tr.id} onClick={() => changeTrack(tr.id)} aria-pressed={tr.id === gameTrack} aria-current={tr.id === gameTrack ? 'step' : undefined} className={`rounded-full px-3 py-1.5 text-sm font-black ${tr.id === gameTrack ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{tr.emoji} {tr[locale] || tr.ru}</button>
        ))}
      </div>

      {!cell && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {subjects.map((c) => (
            <button key={c.slug} onClick={() => go({ s: c.slug, m: '' })} className="card p-4 text-left hover:brightness-95 transition flex flex-col gap-1" aria-label={c.subject}>
              <span className="text-3xl" aria-hidden="true">{ICONS[c.slug] || '📘'}</span>
              <span className="font-black leading-tight">{c.subject}</span>
            </button>
          ))}
        </div>
      )}

      {cell && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className="text-sm font-bold text-primary" onClick={() => go({ s: '', m: '' })}>{t('sg.allSubjects')}</button>
            <span className="font-black">{ICONS[cell.slug]} {cell.subject}, {grade} {t('cab.class')}{m ? ` · ${m.icon} ${t(m.nameKey)}` : ''}</span>
            {m && <button className="ml-auto text-sm font-bold text-primary" onClick={() => go({ s: cell.slug, m: '' })}>{t('sg.changeGame')}</button>}
          </div>
          {err && <div className="card p-5 font-semibold text-ink/60" role="alert">{t('sg.notReady')}</div>}
          {!err && !pack && <div className="card p-5 font-semibold text-ink/50">{t('sg.loading')}</div>}
          {pack && !Game && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MODES.map((x) => (
                <button key={x.id} onClick={() => go({ s: cell.slug, m: x.id })} className="rounded-3xl p-5 text-left text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl hover:-translate-y-1 transition" aria-label={`${t(x.nameKey)}: ${t(x.descKey)}`}>
                  <div className="text-4xl">{x.icon}</div>
                  <div className="mt-1 text-lg font-black">{t(x.nameKey)}</div>
                  <div className="text-sm font-semibold text-white/85">{t(x.descKey)}</div>
                </button>
              ))}
            </div>
          )}
          {pack && Game && <Game key={`${cell.slug}-${grade}-${mode}`} pack={pack} onBack={() => go({ s: cell.slug, m: '' })} />}
          {pack && (
            <p className="text-xs font-semibold text-ink/50">
              {t('sg.disclaimer', { date: reviewDate })}
            </p>
          )}
        </div>
      )}

      <Link to="/games" className="inline-block text-sm font-bold text-primary underline">{t('sg.englishGames')}</Link>
    </div>
  );
}
