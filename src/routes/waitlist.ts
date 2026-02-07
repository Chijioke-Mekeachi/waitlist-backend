import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { parseWaitlistCreate } from "../lib/validate.js";

export const waitlistRouter = Router();

waitlistRouter.post("/", async (req, res, next) => {
  try {
    const parsed = parseWaitlistCreate(req.body);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    const { fullName, email, role, goals } = parsed.value;

    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        full_name: fullName,
        email,
        role,
        goals,
      })
      .select("id, created_at, full_name, email, role, goals")
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Email already on waitlist." });
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ entry: data });
  } catch (err) {
    next(err);
  }
});

waitlistRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const { data, error } = await supabase
      .from("waitlist")
      .select("id, created_at, full_name, email, role, goals")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ entries: data, limit, offset });
  } catch (err) {
    next(err);
  }
});

waitlistRouter.get("/count", async (_req, res, next) => {
  try {
    const { count, error } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ count: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

