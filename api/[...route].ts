/**
 * Vercel Node.js Function entry point for the existing Express API.
 * The catch-all route keeps /api/health, /api/retrieve, and /api/investigate
 * on the same origin as the Vite frontend.
 */
import { app } from "../server/proxyServer";

export default app;
