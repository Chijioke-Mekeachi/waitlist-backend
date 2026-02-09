import { Router } from "express";
import type { ApiErrorBody } from "../lib/http.js";
import { loginAdmin, seedDefaultAdmin, signupAdmin, verifyAdminToken } from "../lib/adminAuth.js";
import { supabase } from "../lib/supabase.js";

export const adminRouter = Router();

seedDefaultAdmin();

function getBearerToken(req: { headers: { authorization?: unknown } }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth !== "string") return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function requireAdmin(req: any, res: any): { ok: true; admin: { email: string; createdAt: number } } | { ok: false } {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." } satisfies ApiErrorBody);
    return { ok: false };
  }

  const verified = verifyAdminToken(token);
  if (!verified.ok) {
    res.status(401).json({ error: verified.error } satisfies ApiErrorBody);
    return { ok: false };
  }

  return { ok: true, admin: verified.admin };
}

adminRouter.post("/signup", (req, res) => {
  const { email, password, inviteCode } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string" || typeof inviteCode !== "string") {
    return res.status(400).json({ error: "Body must include email, password, inviteCode." } satisfies ApiErrorBody);
  }

  const result = signupAdmin({ email, password, inviteCode });
  if (!result.ok) return res.status(403).json({ error: result.error } satisfies ApiErrorBody);
  return res.status(201).json({ admin: result.admin });
});

adminRouter.post("/login", (req, res) => {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Body must include email and password." } satisfies ApiErrorBody);
  }

  const result = loginAdmin({ email, password });
  if (!result.ok) return res.status(401).json({ error: result.error } satisfies ApiErrorBody);
  return res.status(200).json({ token: result.token, admin: result.admin });
});

adminRouter.get("/me", (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth.ok) return;
  return res.status(200).json({ admin: auth.admin });
});

adminRouter.get("/waitlist", async (req, res, next) => {
  try {
    const auth = requireAdmin(req, res);
    if (!auth.ok) return;

    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const { data, error } = await supabase
      .from("waitlist")
      .select("id, created_at, full_name, email, role, goals")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message } satisfies ApiErrorBody);
    return res.status(200).json({ entries: data ?? [], limit, offset });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/waitlist/count", async (req, res, next) => {
  try {
    const auth = requireAdmin(req, res);
    if (!auth.ok) return;

    const { count, error } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    if (error) return res.status(500).json({ error: error.message } satisfies ApiErrorBody);
    return res.status(200).json({ count: count ?? 0 });
  } catch (err) {
    next(err);
  }
});
