# Batched Broadcast Sending — Design

**Date:** 2026-05-20
**Project:** dpmarketing (team.danielphilip.com)
**Status:** Approved

## Problem

The current broadcast endpoint (`src/app/api/admin/broadcasts/route.ts`) sends every
recipient inline in a single request, looping with a 200ms sleep between sends
(`sendBroadcast` in `src/lib/email-sender.ts`). For a large list (~89,554 leads) this is:

1. **Impossible to finish** — 89,554 × 200ms ≈ 5 hours in one function call; Vercel kills
   functions at 300s. It would send ~1,500 then crash, leaving the broadcast half-done.
2. **A reputation hazard** — blasting tens of thousands of cold emails from a brand-new
   domain/account gets the domain spam-flagged and the Resend account suspended.

We need sending that (a) survives the function timeout and (b) ramps volume gradually to
protect deliverability.

## Goals

- Send arbitrarily large lists reliably, in batches, without hitting the function timeout.
- Enforce a daily volume cap that auto-ramps on a warmup curve, holding at a configurable max.
- Provide a CSV import path to load lists into `leads`.
- Keep a kill-switch and safe dry-run mode.

## Non-goals

- Dedicated IP provisioning (shared IP is fine at the ~5k/day target).
- List validation/scrubbing (done externally before import; out of scope here).
- Per-recipient A/B testing, segment-preset UI, analytics changes.

## Decisions (from brainstorming)

| Decision | Choice |
|----------|--------|
| Warmup control | Auto-ramp schedule, editable without redeploy |
| List import | CSV upload page in admin |
| Daily ceiling once warmed | ~5,000/day |
| Sending mechanism | Resend batch API (100 emails/call) |
| Throughput mechanism | Cron kickoff + self-chaining drain (works on any Vercel plan) |

## Architecture

Replace inline sending with an **enqueue → drain** pipeline.

```
Admin "Send"  ──►  enqueue all recipients into broadcast_recipients (status=pending)
                   broadcast.status = 'sending'

Daily cron  ──►  POST /api/email/broadcast-drain
                   │
                   ├─ paused?            → stop
                   ├─ today's cap (warmup curve)
                   ├─ sent today ≥ cap?  → stop
                   ├─ claim_broadcast_batch(n)   (atomic, FOR UPDATE SKIP LOCKED)
                   ├─ resend.batch.send() in chunks of 100
                   ├─ mark sent/failed + log to email_logs
                   └─ pending remain & under cap? → fire-and-forget re-invoke self
```

The cron only needs to fire **once a day** to start the chain; the endpoint re-invokes
itself until the daily cap is hit or the queue is empty. This avoids any dependency on
sub-daily cron availability (Hobby plans only allow daily crons).

## Data model

### New: `broadcast_recipients` (the queue)
```sql
create table public.broadcast_recipients (
    id           uuid primary key default gen_random_uuid(),
    broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
    lead_id      uuid references public.leads(id) on delete set null,
    email        text not null,
    first_name   text,
    status       text not null default 'pending',  -- pending | sending | sent | failed
    attempts     integer not null default 0,
    error        text,
    sent_at      timestamptz,
    created_at   timestamptz not null default now(),
    unique (broadcast_id, email)
);
create index broadcast_recipients_drain_idx
    on public.broadcast_recipients (broadcast_id, status);
create index broadcast_recipients_status_idx
    on public.broadcast_recipients (status) where status = 'pending';
alter table public.broadcast_recipients enable row level security;
```

### New: `email_settings` (single-row config)
```sql
create table public.email_settings (
    id                 boolean primary key default true,   -- enforce single row
    daily_max          integer not null default 5000,
    warmup_curve       integer[] not null
                         default '{50,100,250,500,1000,1500,2500,3500,5000}',
    warmup_started_on  date,                                -- set on first send
    paused             boolean not null default false,
    updated_at         timestamptz not null default now(),
    constraint email_settings_singleton check (id)
);
insert into public.email_settings (id) values (true) on conflict do nothing;
alter table public.email_settings enable row level security;
```

### New: `claim_broadcast_batch(p_limit int)` Postgres function
Atomically claims up to `p_limit` pending recipients (oldest first), marks them `sending`,
and returns them. Uses `FOR UPDATE SKIP LOCKED` so overlapping drain runs never grab the
same rows.
```sql
create or replace function public.claim_broadcast_batch(p_limit int)
returns setof public.broadcast_recipients
language plpgsql as $$
begin
    return query
    update public.broadcast_recipients r
       set status = 'sending', attempts = r.attempts + 1
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
```

Reuses existing `broadcasts` and `email_logs` tables unchanged. Unsubscribe and webhook
status tracking already work.

## Warmup curve

Day index = days since `warmup_started_on` (0-based). Cap for the day:

```
curve = email_settings.warmup_curve   # default [50,100,250,500,1000,1500,2500,3500,5000]
cap(day) = day < len(curve) ? curve[day] : daily_max   # daily_max default 5000
```

`warmup_started_on` is set to today the first time any broadcast email is sent. Both
`warmup_curve` and `daily_max` live in the `email_settings` row, so pace can change without a
redeploy.

"Sent today" = count of `email_logs` rows with `campaign_type='broadcast'` and
`created_at::date = current_date`.

## Components

| Unit | Responsibility | Interface |
|------|----------------|-----------|
| `src/lib/warmup.ts` | Pure cap calculation | `dailyCap(startedOn, daysToday, dailyMax, curve) → number` |
| `src/lib/broadcast-queue.ts` | Enqueue recipients; claim+send one bounded batch; mark results | `enqueueBroadcast(...)`, `drainOnce() → {sent, failed, remaining, capReached}` |
| `src/lib/resend.ts` | Add a batch-send helper wrapping `resend.batch.send()` in 100-chunks | `sendBatch(messages[]) → results[]` |
| `POST /api/email/broadcast-drain` | Cron/self-chain entrypoint; auth, pause check, cap check, calls `drainOnce`, re-chains | CRON_SECRET bearer |
| `POST /api/admin/broadcasts` | Change: enqueue instead of inline send | existing admin auth |
| `GET /api/admin/broadcasts/[id]` | Progress counts for the composer | existing admin auth |
| `POST /api/admin/leads/import` | Chunked CSV upsert into `leads` | existing admin auth |
| `/admin/import` page | CSV upload UI | — |
| Composer + status panel | Live progress bar; cap/sent-today/queue/pause display + toggle | — |

## Data flow

1. **Import:** admin uploads CSV → `/api/admin/leads/import` parses and upserts into `leads`
   in chunks of ~500 (dedupe on email).
2. **Create broadcast:** admin clicks Send → `/api/admin/broadcasts` resolves the segment,
   inserts a `broadcasts` row (status `sending`), bulk-inserts `broadcast_recipients`
   (status `pending`) in chunks, excluding `unsubscribed=true`. Returns immediately.
3. **Drain:** daily cron POSTs `/api/email/broadcast-drain`. It checks pause + cap, claims a
   batch, sends via Resend batch API, logs each to `email_logs`, marks recipients sent/failed.
   If work + headroom remain, it re-invokes itself.
4. **Progress:** composer polls `/api/admin/broadcasts/[id]` for sent/total/failed.
5. **Completion:** when no pending recipients remain for a broadcast, its status flips to `sent`.

## Error handling

- **Send failure (Resend error / 429):** increment `attempts`; if `attempts < 3` set back to
  `pending` (retried next claim); else `failed` with `error` text. Failures never block the queue.
- **Rate limits:** batch API (100/call) keeps call volume low; a short inter-chunk delay plus
  retry-on-429 handles bursts.
- **Concurrency:** `claim_broadcast_batch` with `FOR UPDATE SKIP LOCKED` guarantees no
  double-send even if two drains overlap.
- **Crash mid-batch:** rows left in `sending` are reclaimed by a sweep (rows in `sending`
  older than 15 minutes reset to `pending`) at the start of each drain.
- **Kill switch:** `email_settings.paused = true` halts all drains immediately.
- **Dry run:** `EMAIL_CAMPAIGN_ENABLED=false` claims/logs but skips real Resend calls.

## Per-run sizing

- Per-run claim cap: `min(1000, remaining_daily_cap)`.
- Batch chunk: 100 (Resend max).
- 1000 sends ≈ 10 batch calls ≈ well under 300s. Self-chaining covers the rest of the day's cap.

## Testing

- **Unit:** `dailyCap()` across day indices (start, mid-curve, past-curve, custom max);
  batch chunking (e.g. 250 → [100,100,50]).
- **Integration (dry run):** enqueue a synthetic broadcast with `EMAIL_CAMPAIGN_ENABLED=false`;
  assert recipients claimed + `email_logs` written, no real sends, cap respected.
- **Live smoke:** enqueue to a handful of real addresses with the flag on; confirm delivery,
  progress bar, completion flip.
- Clean up all test rows after.

## Rollout

1. Apply migration (tables + function); append the file to `supabase-schema.sql`.
2. Ship code with `EMAIL_CAMPAIGN_ENABLED=false`; verify dry run in production.
3. Import the (pre-scrubbed) list via CSV.
4. Send a small live test.
5. Flip `EMAIL_CAMPAIGN_ENABLED=true`; warmup curve governs the ramp from day one.
