-- Run this in the Supabase SQL editor.
-- It creates the table used by this API.

create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  role text not null check (role in ('Creator', 'Brand', 'Seller', 'Just Joining')),
  goals text[] not null default '{}'
);

-- Normalize emails by enforcing lower-case at write time in the API.
create unique index if not exists waitlist_email_unique on public.waitlist (email);
