# Waitlist API (Express + TypeScript + Supabase)

## Setup

1. Create the Supabase table by running `supabase.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Install deps and run:
   - `npm install`
   - `npm run dev`

## Routes

### `GET /docs`
HTML documentation (includes JavaScript + TypeScript examples).

### `GET /docs/openapi.json`
OpenAPI 3.1 spec.

### `POST /waitlist`
Creates a waitlist entry.

Body:
```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "Creator",
  "goals": ["find brand deals", "growing as a creator"]
}
```

Notes:
- `fullName` can also be sent as `fullname` or `full_name`.
- `goals` can also be sent as `whatYouWant` / `what_you_want` / `intent` and may be a comma-separated string.
- Allowed `role`: `Creator | Brand | Seller | Just Joining`
- Allowed `goals`:
  - `find brand deals`
  - `growing as a creator`
  - `discovering creators`
  - `managing collaboration and deals`

### `GET /waitlist`
Lists entries.

Query params:
- `limit` (default `50`, max `200`)
- `offset` (default `0`)

### `GET /waitlist/count`
Returns `{ "count": number }`.

### `GET /health`
Returns `{ "ok": true }`.

## Admin (prototype)

Admin endpoints are protected by a bearer token returned from `POST /admin/login`.

Default admin (seeded in backend code):
- Email: `admin@creatorum.local`
- Password: `Admin@12345`

Invite-code signup (also hard-coded in backend code):
- `POST /admin/signup` with `inviteCode`: `CREATORUM-ADMIN-INVITE-2026`

Admin routes:
- `POST /admin/login` → `{ token }`
- `POST /admin/signup`
- `GET /admin/me`
- `GET /admin/waitlist`
- `GET /admin/waitlist/count`

## cURL

Create an entry:
```bash
curl -X POST http://localhost:3000/waitlist \
  -H 'content-type: application/json' \
  -d '{"fullname":"Ada Lovelace","email":"ada@example.com","role":"Creator","whatYouWant":"find brand deals, growing as a creator"}'
```
# waitlist-backend
