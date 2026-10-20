import { useCallback, useEffect, useState } from 'react';
import { aiEngine } from './engine.js';
import { runTask as runRegisteredTask } from './tasks.js';
import { checkChildSafety, learnerText, GUARDED_TASKS } from './childSafety.js';

// Child safety comes first: crisis help and refusals are answered here, before the model
// or the rule-based fallback, in every tutor version.
export function runGuardedTask(id, input, ctx = {}) {
  if (GUARDED_TASKS.includes(id)) {
    const hit = checkChildSafety(learnerText(input), ctx.locale);
    if (hit) {
      try { if (typeof ctx.onToken === 'function') ctx.onToken(hit.text); } catch { /* noop */ }
      return Promise.resolve({ ok: true, data: { text: hit.text, safety: hit.kind }, source: 'safety' });
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
