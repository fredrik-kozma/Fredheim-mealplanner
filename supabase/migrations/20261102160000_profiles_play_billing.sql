-- Additive Play Billing / RevenueCat columns on profiles.
-- DO NOT apply automatically from the agent — review then run in Supabase SQL editor or CLI.
-- Safe: nullable columns only; existing Stripe rows unchanged.

alter table public.profiles
  add column if not exists subscription_source text
    check (subscription_source is null or subscription_source in ('stripe', 'google_play'));

alter table public.profiles
  add column if not exists rc_expires_at timestamptz;

comment on column public.profiles.subscription_source is
  'Billing channel that last granted or owns the current entitlement: stripe | google_play';

comment on column public.profiles.rc_expires_at is
  'RevenueCat / Google Play entitlement expiration (from webhook expiration_at_ms).';
