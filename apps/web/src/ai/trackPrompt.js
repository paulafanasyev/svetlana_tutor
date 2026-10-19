// Adds the selected tutor version (track) to every local-AI request.
// Patched once at the engine level, so all tasks (chat, corrections, homework check) follow the same track.
import { aiEngine } from './engine.js';
import { currentTrack } from '../data/tracks.js';

export function withTrack(messages, track = currentTrack()) {
  if (!track?.prompt || !Array.isArray(messages)) return messages;
  const i = messages.findIndex((m) => m && m.role === 'system');
  const out = messages.slice();
  if (i >= 0) out[i] = { ...out[i], content: `${out[i].content} ${track.prompt}` };
  else out.unshift({ role: 'system', content: track.prompt });
  return out;
}

if (!aiEngine.__trackPatched) {
  const chat = aiEngine.chat.bind(aiEngine);
  aiEngine.chat = (messages, options) => chat(withTrack(messages), options);
  aiEngine.__trackPatched = true;
}
