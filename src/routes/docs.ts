import { Router } from "express";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getBaseUrl(req: { protocol: string; get(name: string): string | undefined }): string {
  const host = req.get("x-forwarded-host") ?? req.get("host") ?? "localhost";
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${host}`;
}

export const docsRouter = Router();

docsRouter.get("/", (req, res) => {
  const baseUrl = getBaseUrl(req);

  const jsExample = `// Create a waitlist entry (JavaScript)
const res = await fetch("${baseUrl}/waitlist", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    role: "Creator",
    goals: ["find brand deals", "growing as a creator"],
  }),
});

if (!res.ok) throw new Error(await res.text());
const json = await res.json();
console.log(json.entry);`;

  const tsExample = `// Create a waitlist entry (TypeScript)
type Role = "Creator" | "Brand" | "Seller" | "Just Joining";
type Goal =
  | "find brand deals"
  | "growing as a creator"
  | "discovering creators"
  | "managing collaboration and deals";

type WaitlistCreateBody = {
  fullName: string;
  email: string;
  role: Role;
  goals: Goal[];
};

type WaitlistEntry = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  role: Role;
  goals: Goal[];
};

type WaitlistCreateResponse = { entry: WaitlistEntry } | { error: string };

const body: WaitlistCreateBody = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  role: "Creator",
  goals: ["find brand deals"],
};

const res = await fetch("${baseUrl}/waitlist", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const json = (await res.json()) as WaitlistCreateResponse;
if (!res.ok) throw new Error("error" in json ? json.error : "Request failed");
console.log(json.entry.id);`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Waitlist API Docs</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; line-height: 1.45; }
      h1 { margin: 0 0 8px; }
      .muted { opacity: 0.75; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      pre { padding: 12px; border: 1px solid rgba(127,127,127,0.35); border-radius: 10px; overflow: auto; }
      .card { padding: 14px; border: 1px solid rgba(127,127,127,0.35); border-radius: 12px; margin: 12px 0; }
      ul { margin: 8px 0 0 22px; }
      a { color: inherit; }
      .row { display: grid; gap: 12px; grid-template-columns: 1fr; }
      @media (min-width: 900px) { .row { grid-template-columns: 1fr 1fr; } }
    </style>
  </head>
  <body>
    <h1>Waitlist API</h1>
    <div class="muted">Base URL: <code>${escapeHtml(baseUrl)}</code></div>

    <div class="card">
      <div><strong>OpenAPI</strong>: <a href="/docs/openapi.json"><code>/docs/openapi.json</code></a></div>
    </div>

    <div class="card">
      <div><strong>Routes</strong></div>
      <ul>
        <li><code>GET /health</code> → <code>{ "ok": true }</code></li>
        <li><code>POST /waitlist</code> → create entry</li>
        <li><code>GET /waitlist</code> → list entries (<code>limit</code>, <code>offset</code>)</li>
        <li><code>GET /waitlist/count</code> → <code>{ "count": number }</code></li>
      </ul>
    </div>

    <div class="card">
      <div><strong>POST /waitlist</strong></div>
      <div class="muted">Accepts JSON: <code>{ fullName, email, role, goals }</code></div>
      <ul>
        <li><code>fullName</code>: string (also accepts <code>fullname</code> or <code>full_name</code>)</li>
        <li><code>email</code>: string</li>
        <li><code>role</code>: <code>Creator | Brand | Seller | Just Joining</code></li>
        <li><code>goals</code>: array of strings (also accepts <code>whatYouWant</code>/<code>what_you_want</code>/<code>intent</code>, and comma-separated strings)</li>
      </ul>
      <div class="muted" style="margin-top:8px">Allowed goals:</div>
      <ul>
        <li><code>find brand deals</code></li>
        <li><code>growing as a creator</code></li>
        <li><code>discovering creators</code></li>
        <li><code>managing collaboration and deals</code></li>
      </ul>
    </div>

    <div class="row">
      <div class="card">
        <div><strong>JavaScript</strong></div>
        <pre><code>${escapeHtml(jsExample)}</code></pre>
      </div>
      <div class="card">
        <div><strong>TypeScript</strong></div>
        <pre><code>${escapeHtml(tsExample)}</code></pre>
      </div>
    </div>
  </body>
</html>`;

  res.status(200).type("html").send(html);
});

docsRouter.get("/openapi.json", (req, res) => {
  const baseUrl = getBaseUrl(req);

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Waitlist API",
      version: "0.1.0",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "OK",
              content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] } } },
            },
          },
        },
      },
      "/waitlist": {
        post: {
          summary: "Create waitlist entry",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WaitlistCreateBody" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { entry: { $ref: "#/components/schemas/WaitlistEntry" } }, required: ["entry"] },
                },
              },
            },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "409": { description: "Duplicate email", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        get: {
          summary: "List waitlist entries",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      entries: { type: "array", items: { $ref: "#/components/schemas/WaitlistEntry" } },
                      limit: { type: "integer" },
                      offset: { type: "integer" },
                    },
                    required: ["entries", "limit", "offset"],
                  },
                },
              },
            },
            "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/waitlist/count": {
        get: {
          summary: "Count waitlist entries",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { count: { type: "integer" } }, required: ["count"] },
                },
              },
            },
            "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Role: { type: "string", enum: ["Creator", "Brand", "Seller", "Just Joining"] },
        Goal: {
          type: "string",
          enum: ["find brand deals", "growing as a creator", "discovering creators", "managing collaboration and deals"],
        },
        WaitlistCreateBody: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
            goals: { type: "array", items: { $ref: "#/components/schemas/Goal" }, minItems: 1 },
          },
          required: ["fullName", "email", "role", "goals"],
          additionalProperties: true,
        },
        WaitlistEntry: {
          type: "object",
          properties: {
            id: { type: "string" },
            created_at: { type: "string" },
            full_name: { type: "string" },
            email: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
            goals: { type: "array", items: { $ref: "#/components/schemas/Goal" } },
          },
          required: ["id", "created_at", "full_name", "email", "role", "goals"],
        },
        Error: { type: "object", properties: { error: { type: "string" } }, required: ["error"] },
      },
    },
  } as const;

  res.status(200).json(spec);
});

