-- Phase 1 MVP: live_callouts
-- Run this in the Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.live_callouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  business_id uuid not null,
  item_name text not null,
  category_key text not null,
  message text not null,
  status text not null default 'live' check (status in ('live', 'sold_out', 'ended', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours')
);

create index if not exists live_callouts_business_id_idx on public.live_callouts (business_id);
create index if not exists live_callouts_seller_id_idx on public.live_callouts (seller_id);
create index if not exists live_callouts_status_idx on public.live_callouts (status);
create index if not exists live_callouts_expires_at_idx on public.live_callouts (expires_at);
create index if not exists live_callouts_category_key_idx on public.live_callouts (category_key);
create index if not exists live_callouts_live_lookup_idx
  on public.live_callouts (status, expires_at desc, category_key, business_id);

grant select on public.live_callouts to anon, authenticated;
grant insert, update on public.live_callouts to authenticated;

alter table public.live_callouts enable row level security;

drop policy if exists "public can read active live callouts" on public.live_callouts;
create policy "public can read active live callouts"
  on public.live_callouts
  for select
  to public
  using (
    status = 'live'
    and expires_at > now()
  );

drop policy if exists "seller can read own live callouts" on public.live_callouts;
create policy "seller can read own live callouts"
  on public.live_callouts
  for select
  to authenticated
  using (
    auth.uid() = seller_id
  );

drop policy if exists "seller can insert own live callouts" on public.live_callouts;
create policy "seller can insert own live callouts"
  on public.live_callouts
  for insert
  to authenticated
  with check (
    auth.uid() = seller_id
  );

drop policy if exists "seller can update own live callouts" on public.live_callouts;
create policy "seller can update own live callouts"
  on public.live_callouts
  for update
  to authenticated
  using (
    auth.uid() = seller_id
  )
  with check (
    auth.uid() = seller_id
  );
