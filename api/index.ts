import type { Request, Response } from "express";
import { app } from "../server/proxyServer.js";

const API_ROUTES: Record<string, string> = {
  health: "/api/health",
  retrieve: "/api/retrieve",
  investigate: "/api/investigate",
};

/**
 * Shared Vercel function entry for the Express API. vercel.json rewrites
 * /api/:path* here and places the captured route in the __route query value.
 */
export default function handler(req: Request, res: Response): void {
  const requestUrl = new URL(req.url || "/", "http://vercel.local");
  const routeName = requestUrl.searchParams.get("__route") || "";
  const routePath = API_ROUTES[routeName];

  if (!routePath) {
    res.status(404).json({ success: false, error: "Unknown API route." });
    return;
  }

  requestUrl.searchParams.delete("__route");
  const remainingQuery = requestUrl.searchParams.toString();
  req.url = remainingQuery ? `${routePath}?${remainingQuery}` : routePath;
  app(req, res);
}
