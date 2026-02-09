import crypto from "crypto";

export type AdminPublic = {
  email: string;
  createdAt: number;
};

type StoredAdmin = {
  email: string;
  createdAt: number;
  salt: string;
  hash: string;
};

const ADMIN_INVITE_CODE = "CREATORUM-ADMIN-INVITE-2026";
const TOKEN_SECRET = "creat0rum_admin_token_secret_v1";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

const admins = new Map<string, StoredAdmin>();

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 32, "sha256");
  return hash.toString("base64");
}

function makeSalt(): string {
  return crypto.randomBytes(16).toString("base64");
}

export function seedDefaultAdmin() {
  if (admins.size > 0) return;
  const email = normalizeEmail("admin@creatorum.local");
  const password = "Admin@12345";
  const salt = makeSalt();
  const hash = hashPassword(password, salt);
  admins.set(email, { email, createdAt: Date.now(), salt, hash });
}

export function listAdminDefaults() {
  return {
    defaultEmail: "admin@creatorum.local",
    defaultPassword: "Admin@12345",
    inviteCode: ADMIN_INVITE_CODE,
  } as const;
}

export function signupAdmin(input: { email: string; password: string; inviteCode: string }):
  | { ok: true; admin: AdminPublic }
  | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) return { ok: false, error: "email must be a valid email address." };
  if (typeof input.password !== "string" || input.password.length < 8) return { ok: false, error: "password must be at least 8 characters." };
  if (!timingSafeEqualString(input.inviteCode ?? "", ADMIN_INVITE_CODE)) return { ok: false, error: "Invalid invite code." };
  if (admins.has(email)) return { ok: false, error: "Admin already exists." };

  const salt = makeSalt();
  const hash = hashPassword(input.password, salt);
  const stored: StoredAdmin = { email, createdAt: Date.now(), salt, hash };
  admins.set(email, stored);

  return { ok: true, admin: { email: stored.email, createdAt: stored.createdAt } };
}

export function loginAdmin(input: { email: string; password: string }):
  | { ok: true; token: string; admin: AdminPublic }
  | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) return { ok: false, error: "Invalid email or password." };

  const admin = admins.get(email);
  if (!admin) return { ok: false, error: "Invalid email or password." };

  const attempted = hashPassword(input.password ?? "", admin.salt);
  if (!timingSafeEqualString(attempted, admin.hash)) return { ok: false, error: "Invalid email or password." };

  const now = Date.now();
  const payload = { email: admin.email, iat: now, exp: now + TOKEN_TTL_MS };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest();
  const token = `${payloadB64}.${base64UrlEncode(sig)}`;
  return { ok: true, token, admin: { email: admin.email, createdAt: admin.createdAt } };
}

export function verifyAdminToken(token: string): { ok: true; admin: AdminPublic } | { ok: false; error: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Invalid token." };
  const payloadB64 = parts[0];
  const sigB64 = parts[1];
  if (!payloadB64 || !sigB64) return { ok: false, error: "Invalid token." };

  const expectedSig = crypto.createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest();
  const expectedSigB64 = base64UrlEncode(expectedSig);
  if (!timingSafeEqualString(expectedSigB64, sigB64)) return { ok: false, error: "Invalid token." };

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, error: "Invalid token." };
  }

  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid token." };
  const anyPayload = payload as { email?: unknown; exp?: unknown };
  if (typeof anyPayload.email !== "string" || typeof anyPayload.exp !== "number") return { ok: false, error: "Invalid token." };
  if (Date.now() > anyPayload.exp) return { ok: false, error: "Token expired." };

  const stored = admins.get(normalizeEmail(anyPayload.email));
  if (!stored) return { ok: false, error: "Admin not found." };
  return { ok: true, admin: { email: stored.email, createdAt: stored.createdAt } };
}
