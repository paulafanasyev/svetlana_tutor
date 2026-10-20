import { useCallback, useEffect, useState } from 'react';
import { aiEngine } from './engine.js';
import { runTask as runRegisteredTask, TASK_REGISTRY } from './tasks.js';
import { checkChildSafety, learnerText, GUARDED_TASKS } from './childSafety.js';

// Child safety comes first, for every AI task and every tutor version:
//  - tutor_reply: crisis help / refusal is the answer itself (no model);
//  - any other task with learner text (corrections, writing, homework, hints): the model is skipped and the
//    rule-based fallback answers, so a dangerous text never reaches the model; the hit is reported in `safety`.
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
  return runRegisteredTask(id, input, ctx);
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
