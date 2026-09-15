-- Run this SQL in your Supabase SQL editor or psql to create the tables
create table if not exists chants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete set null,
  name text, -- for anonymous submissions
  date date not null,
  ip inet,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  count integer not null check (count >= 0),
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique,
  phone text unique,
  device_id text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (email, phone)
);

create table if not exists otp_codes (
  id uuid default gen_random_uuid() primary key,
  contact text not null, -- email or phone
  code text not null,
  type text not null check (type in ('signup', 'signin')),
  expires_at timestamptz not null,
  attempts integer default 0,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_phone on users(phone);
create index if not exists idx_users_device on users(device_id);
create index if not exists idx_chants_user_id on chants(user_id);
create index if not exists idx_chants_date on chants(date);
create index if not exists idx_otp_contact on otp_codes(contact);
create index if not exists idx_otp_expires on otp_codes(expires_at);

-- Migration for existing tables:
-- ALTER TABLE chants ADD COLUMN user_id uuid references users(id) on delete set null;
-- ALTER TABLE names ADD COLUMN IF NOT EXISTS device_id text;
-- ALTER TABLE names DROP CONSTRAINT IF EXISTS names_name_key;
-- ALTER TABLE names ADD CONSTRAINT names_name_device_id_key UNIQUE (name, device_id);