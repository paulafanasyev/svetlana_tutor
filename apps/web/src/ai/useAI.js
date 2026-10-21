import { useCallback, useEffect, useState } from 'react';
import { aiEngine } from './engine.js';
import { runTask as runRegisteredTask, TASK_REGISTRY } from './tasks.js';
import { checkChildSafety, learnerText, GUARDED_TASKS, cleanModelText } from './childSafety.js';

// The model's answer is cleaned too (audit 21.10): links, phones and contacts are removed and an answer with
// dangerous instructions is replaced by the refusal. Strings are cleaned up to 3 levels deep in `data`.
function cleanData(v, locale, depth = 0) {
  if (typeof v === 'string') return cleanModelText(v, locale);
  if (depth > 3 || v == null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => cleanData(x, locale, depth + 1));
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = cleanData(x, locale, depth + 1);
  return out;
}
const cleanResult = (r, locale) => (r && r.data != null && r.source !== 'safety' ? { ...r, data: cleanData(r.data, locale) } : r);

// Child safety comes first, for every AI task and every tutor version:
//  - tutor_reply: crisis help / refusal is the answer itself (no model);
//  - any other task with learner text (corrections, writing, homework, hints): the model is skipped and the
//    rule-based fallback answers, so a dangerous text never reaches the model; the hit is reported in `safety`;
//  - whatever answers (model or fallback), its text goes through cleanModelText before the UI sees it.
export function runGuardedTask(id, input, ctx = {}) {
  const hit = checkChildSafety(learnerText(input), ctx.locale);
  if (hit) {
    if (GUARDED_TASKS.includes(id)) {
      try { if (typeof ctx.onToken === 'function') ctx.onToken(hit.text); } catch { /* noop */ }
      return Promise.resolve({ ok: true, data: { text: hit.text, safety: hit.kind }, source: 'safety' });
    }
    const task = TASK_REGISTRY[id];
    if (task && typeof task.fallback === 'function') {
      try { return Promise.resolve({ ok: true, data: task.fallback(input, ctx), source: 'fallback', safety: hit.kind }); } catch { /* fall through */ }
    }
  }
  return Promise.resolve(runRegisteredTask(id, input, ctx)).then((r) => cleanResult(r, ctx.locale));
}

export function useAI() {
  const [snapshot, setSnapshot] = useState(aiEngine.state);
  useEffect(() => aiEngine.subscribe(setSnapshot), []);
  const load = useCallback((modelId) => aiEngine.load(modelId), []);
  const enable = useCallback((modelId) => aiEngine.enable(modelId), []);
  const disable = useCallback(() => aiEngine.disable(), []);
  const selectModel = useCallback((modelId) => aiEngine.selectModel(modelId), []);
  const clearCache = useCallback(() => aiEngine.clearCache(), []);
  const runTask = useCallback((id, input, ctx = {}) => runGuardedTask(id, input, ctx), []);
  return {
    ...snapshot,
    model: aiEngine.selectedModel,
    ready: snapshot.status === 'ready',
    load,
    enable,
    disable,
    selectModel,
    clearCache,
    runTask,
  };
}
