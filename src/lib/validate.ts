const allowedRoles = ["Creator", "Brand", "Seller", "Just Joining"] as const;
export type Role = (typeof allowedRoles)[number];

const allowedGoals = [
  "find brand deals",
  "growing as a creator",
  "discovering creators",
  "managing collaboration and deals",
] as const;

export type Goal = (typeof allowedGoals)[number];

export type WaitlistCreateInput = {
  fullName: string;
  email: string;
  role: Role;
  goals: Goal[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeGoal(goal: string): string {
  return normalizeSpaces(goal).toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function canonicalizeRole(role: string): Role | null {
  const normalized = normalizeSpaces(role).toLowerCase();
  switch (normalized) {
    case "creator":
      return "Creator";
    case "brand":
      return "Brand";
    case "seller":
      return "Seller";
    case "just joining":
    case "just-joining":
    case "just_joining":
      return "Just Joining";
    default:
      return null;
  }
}

function canonicalizeGoal(goal: string): Goal | null {
  const normalized = normalizeGoal(goal);
  switch (normalized) {
    case "find brand deals":
      return "find brand deals";
    case "growing as a creator":
    case "growingas a creator":
      return "growing as a creator";
    case "discovering creators":
    case "discovering crestors":
      return "discovering creators";
    case "managing collaboration and deals":
      return "managing collaboration and deals";
    default:
      return null;
  }
}

function splitGoals(value: string): string[] {
  // Allow a single string like: "find brand deals, growing as a creator"
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseWaitlistCreate(body: unknown): { ok: true; value: WaitlistCreateInput } | { ok: false; error: string } {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  const fullNameRaw = body.fullName ?? body.fullname ?? body.full_name;
  const emailRaw = body.email;
  const roleRaw = body.role;
  const goalsRaw =
    body.goals ??
    body.goal ??
    body.intent ??
    body.interests ??
    body.whatYouWant ??
    body.what_you_want ??
    body.what;

  if (typeof fullNameRaw !== "string" || !fullNameRaw.trim()) {
    return { ok: false, error: "fullName is required." };
  }

  if (typeof emailRaw !== "string" || !isValidEmail(emailRaw.trim().toLowerCase())) {
    return { ok: false, error: "email must be a valid email address." };
  }

  const role = typeof roleRaw === "string" ? canonicalizeRole(roleRaw) : null;
  if (!role) {
    return { ok: false, error: `role must be one of: ${allowedRoles.join(", ")}.` };
  }

  const goalsArray: unknown[] = typeof goalsRaw === "string" ? splitGoals(goalsRaw) : Array.isArray(goalsRaw) ? goalsRaw : [];

  const canonicalGoals = goalsArray
    .flatMap((g) => (typeof g === "string" ? splitGoals(g) : []))
    .map((g) => canonicalizeGoal(g))
    .filter((g): g is Goal => !!g);

  const deduped = Array.from(new Set(canonicalGoals));

  if (deduped.length === 0) {
    return {
      ok: false,
      error: `goals must include at least one of: ${allowedGoals.join(", ")}.`,
    };
  }

  return {
    ok: true,
    value: {
      fullName: normalizeSpaces(fullNameRaw),
      email: emailRaw.trim().toLowerCase(),
      role,
      goals: deduped as Goal[],
    },
  };
}
