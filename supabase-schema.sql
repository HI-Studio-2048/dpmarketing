-- dpmarketing schema: leads, sequences, enrollments, email_logs, broadcasts
-- All writes happen server-side via service_role; RLS is enabled with no
-- public policies so direct anon access is blocked.

create extension if not exists "pgcrypto";

-- 1. leads
create table public.leads (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    first_name text,
    phone text,
    status text not null default 'Lead',
    source text,
    tags text[] not null default '{}',
    quiz_score integer,
    quiz_answers jsonb,
    quiz_progress text,
    city text,
    country text,
    platform text,
    device text,
    unsubscribed boolean not null default false,
    unsubscribed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index leads_status_idx on public.leads (status);
create index leads_unsubscribed_idx on public.leads (unsubscribed);
alter table public.leads enable row level security;

-- 2. sequences
create table public.sequences (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    is_active boolean not null default false,
    created_at timestamptz not null default now()
);
create index sequences_active_idx on public.sequences (is_active);
alter table public.sequences enable row level security;

-- 3. sequence_steps
create table public.sequence_steps (
    id uuid primary key default gen_random_uuid(),
    sequence_id uuid not null references public.sequences(id) on delete cascade,
    step_number integer not null,
    day_offset integer not null default 0,
    subject text not null,
    html_body text not null,
    step_key text,
    email_type text not null default 'value',
    condition jsonb,
    created_at timestamptz not null default now(),
    unique (sequence_id, step_number)
);
create index sequence_steps_sequence_idx on public.sequence_steps (sequence_id);
alter table public.sequence_steps enable row level security;

-- 4. lead_sequence_enrollments
create table public.lead_sequence_enrollments (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    sequence_id uuid not null references public.sequences(id) on delete cascade,
    enrolled_at timestamptz not null default now(),
    completed_at timestamptz,
    is_active boolean not null default true,
    unique (lead_id, sequence_id)
);
create index lse_lead_idx on public.lead_sequence_enrollments (lead_id);
create index lse_active_idx on public.lead_sequence_enrollments (is_active);
alter table public.lead_sequence_enrollments enable row level security;

-- 5. broadcasts
create table public.broadcasts (
    id uuid primary key default gen_random_uuid(),
    subject text not null,
    html_body text not null,
    segment_json jsonb not null default '{}'::jsonb,
    attachments_json jsonb default null,
    status text not null default 'draft',
    sent_at timestamptz,
    recipient_count integer,
    created_at timestamptz not null default now()
);
alter table public.broadcasts enable row level security;

-- 6. email_logs
create table public.email_logs (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid references public.leads(id) on delete set null,
    email text not null,
    campaign_type text not null,
    sequence_id uuid references public.sequences(id) on delete set null,
    step_id uuid references public.sequence_steps(id) on delete set null,
    sequence_step integer,
    sequence_key text,
    broadcast_id uuid references public.broadcasts(id) on delete set null,
    subject text not null,
    resend_id text,
    status text not null default 'sent',
    opened_at timestamptz,
    clicked_at timestamptz,
    created_at timestamptz not null default now()
);
create index email_logs_lead_idx on public.email_logs (lead_id);
create index email_logs_resend_idx on public.email_logs (resend_id);
create index email_logs_campaign_idx on public.email_logs (campaign_type);
alter table public.email_logs enable row level security;

-- updated_at trigger for leads
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger leads_touch_updated_at
    before update on public.leads
    for each row execute function public.touch_updated_at();

-- ============================================================
-- Batched broadcast sending (added 2026-05-20)
-- ============================================================

-- Queue: one row per (broadcast, recipient)
create table public.broadcast_recipients (
    id           uuid primary key default gen_random_uuid(),
    broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
    lead_id      uuid references public.leads(id) on delete set null,
    email        text not null,
    first_name   text,
    status       text not null default 'pending',  -- pending | sending | sent | failed
    attempts     integer not null default 0,
    error        text,
    claimed_at   timestamptz,                       -- when the row last entered 'sending'
    sent_at      timestamptz,
    created_at   timestamptz not null default now(),
    unique (broadcast_id, email)
);
create index broadcast_recipients_drain_idx
    on public.broadcast_recipients (broadcast_id, status);
create index broadcast_recipients_pending_idx
    on public.broadcast_recipients (status) where status = 'pending';
alter table public.broadcast_recipients enable row level security;

-- Single-row sending config
create table public.email_settings (
    id                 boolean primary key default true,
    daily_max          integer not null default 5000,
    warmup_curve       integer[] not null
                         default '{50,100,250,500,1000,1500,2500,3500,5000}',
    warmup_started_on  date,
    paused             boolean not null default false,
    updated_at         timestamptz not null default now(),
    constraint email_settings_singleton check (id)
);
insert into public.email_settings (id) values (true) on conflict do nothing;
alter table public.email_settings enable row level security;

-- Atomic batch claim: marks up to p_limit pending rows as 'sending' and returns them.
create or replace function public.claim_broadcast_batch(p_limit int)
returns setof public.broadcast_recipients
language plpgsql as $$
begin
    return query
    update public.broadcast_recipients r
       set status = 'sending', attempts = r.attempts + 1, claimed_at = now()
     where r.id in (
         select id from public.broadcast_recipients
          where status = 'pending'
          order by created_at
          limit p_limit
          for update skip locked
     )
    returning r.*;
end;
$$;

-- Reclaim stuck 'sending' rows (crash recovery)
create or replace function public.reclaim_stuck_recipients(p_older_than_minutes int)
returns void
language sql as $$
    update public.broadcast_recipients
       set status = 'pending'
     where status = 'sending'
       and claimed_at < now() - (p_older_than_minutes || ' minutes')::interval;
$$;
