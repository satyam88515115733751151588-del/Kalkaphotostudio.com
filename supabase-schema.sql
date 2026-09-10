-- Run this once in Supabase → SQL Editor → New query → Run

create extension if not exists pgcrypto;

-- Images added via the dashboard (Cloudinary-hosted)
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text default '',
  gallery text not null default 'gallery', -- which page/section it belongs to
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Videos added via the dashboard (YouTube)
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  youtube_id text not null,
  title text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Custom HTML sections that appear as new navbar links
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nav_label text not null,
  html_content text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Row Level Security: anyone can read (your public site needs this),
-- only a logged-in dashboard user can write.
alter table images enable row level security;
alter table videos enable row level security;
alter table sections enable row level security;

create policy "public read images" on images for select using (true);
create policy "public read videos" on videos for select using (true);
create policy "public read sections" on sections for select using (true);

create policy "auth write images" on images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write videos" on videos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write sections" on sections for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
