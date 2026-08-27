-- Run this SQL in your Supabase SQL editor or psql to create the table
create table if not exists chants (
  id uuid default gen_random_uuid() primary key,
  name text,
  date date not null,
  ip inet,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  count integer not null check (count >= 0),
  created_at timestamptz default now()
);
