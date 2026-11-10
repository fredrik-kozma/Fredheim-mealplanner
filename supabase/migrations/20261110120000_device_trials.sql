-- Android in-app trial clock. One row per hashed device id.
-- DO NOT apply automatically from the agent — review, then run in the
-- Supabase SQL editor or CLI. The device-trial edge function (service role)
-- is the only writer. Clients have no policies and no table grants.

create table if not exists public.device_trials (
  device_hash text primary key,
  first_seen timestamptz not null default now(),
  app_version text,
  platform text,
  constraint device_trials_hash_hex check (device_hash ~ '^[0-9a-f]{64}$'),
  constraint device_trials_platform check (platform is null or platform = 'android')
);

comment on table public.device_trials is
  'First time an Android install was seen, keyed by SHA-256(salt || ANDROID_ID). Written only by the device-trial edge function. Trial end is first_seen + 14 days.';

alter table public.device_trials enable row level security;

revoke all on table public.device_trials from public;
revoke all on table public.device_trials from anon;
revoke all on table public.device_trials from authenticated;
