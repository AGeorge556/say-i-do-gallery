-- Run this once in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/ffshjlriobvhthjsahbt/sql

-- ── Guestbook messages ─────────────────────────────────────────────────────
create table if not exists guestbook_messages (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  message     text        not null,
  created_at  timestamptz default now()
);

alter table guestbook_messages enable row level security;

create policy "Anyone can read guestbook messages"
  on guestbook_messages for select using (true);

create policy "Anyone can post a guestbook message"
  on guestbook_messages for insert with check (true);


-- ── RSVP responses ─────────────────────────────────────────────────────────
create table if not exists rsvp_responses (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  email       text,
  attending   text        not null check (attending in ('yes', 'no')),
  guest_count integer     default 1,
  dietary     text,
  created_at  timestamptz default now()
);

alter table rsvp_responses enable row level security;

-- Guests can submit; only the couple can read (via service key / dashboard)
create policy "Anyone can submit an RSVP"
  on rsvp_responses for insert with check (true);


-- ── Gallery storage bucket ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('wedding-gallery', 'wedding-gallery', true)
  on conflict (id) do nothing;

create policy "Anyone can upload to gallery"
  on storage.objects for insert
  with check (bucket_id = 'wedding-gallery');

create policy "Anyone can view gallery"
  on storage.objects for select
  using (bucket_id = 'wedding-gallery');
