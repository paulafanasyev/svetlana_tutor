// Vercel serverless entry for the Express API (apps/api/src/app.js exports a factory).
// Node-file-trace follows these imports and packs apps/api dependencies + Prisma engines
// into the function bundle. The /api/:path* rewrite in vercel.json routes all requests here.
import { createApp } from '../apps/api/src/app.js';

const app = createApp();

export default app;
