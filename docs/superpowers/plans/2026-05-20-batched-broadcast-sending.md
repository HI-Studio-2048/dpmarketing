# Batched Broadcast Sending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline broadcast sending with a durable queue that drains in warmup-capped batches via cron + self-chaining, so large lists send reliably without hitting the function timeout or harming domain reputation.

**Architecture:** Admin "Send" enqueues recipients into `broadcast_recipients`. A CRON_SECRET-protected drain endpoint claims bounded batches atomically (`FOR UPDATE SKIP LOCKED`), sends them via Resend's batch API (100/call), logs to `email_logs`, and re-invokes itself until the day's warmup cap or the queue is exhausted. A daily cron starts each day's chain.

**Tech Stack:** Next.js 15 (App Router) API routes, Supabase (Postgres via `@supabase/supabase-js` service role + Management API for migration), Resend batch API, Vitest for unit tests.

**Reference spec:** `docs/superpowers/specs/2026-05-20-batched-broadcast-sending-design.md`

---

## File Structure

| File | Responsibility | New/Modify |
|------|----------------|------------|
| `vitest.config.ts` | Test runner config | Create |
| `package.json` | Add `test` script + vitest dev dep | Modify |
| `supabase-schema.sql` | Append new tables + function | Modify |
| `src/lib/warmup.ts` | Pure warmup-cap calculation | Create |
| `src/lib/warmup.test.ts` | Unit tests for warmup | Create |
| `src/lib/chunk.ts` | Pure array chunking | Create |
| `src/lib/chunk.test.ts` | Unit tests for chunk | Create |
| `src/lib/resend.ts` | Add `sendBatch()` helper | Modify |
| `src/lib/broadcast-queue.ts` | Enqueue + drainOnce + sweep | Create |
| `src/app/api/email/broadcast-drain/route.ts` | Drain entrypoint (cron/self-chain) | Create |
| `src/app/api/admin/broadcasts/route.ts` | Enqueue instead of inline send | Modify |
| `src/app/api/admin/broadcasts/[id]/route.ts` | Progress counts | Create |
| `src/app/api/admin/leads/import/route.ts` | Chunked CSV upsert | Create |
| `src/app/admin/import/page.tsx` | CSV upload UI | Create |
| `src/app/admin/composer/page.tsx` | Enqueue + live progress | Modify |
| `src/app/admin/layout.tsx` | Add "Import" nav link | Modify |
| `vercel.json` | Add broadcast-drain cron | Modify |

**Testing note:** The codebase currently has no tests. We add Vitest and TDD the two pure-logic modules (`warmup`, `chunk`). The DB/route layers are verified with a dry-run integration check (Task 11) using `EMAIL_CAMPAIGN_ENABLED=false`, because full unit mocking of Supabase/Resend would add more harness than value here.

**Migration apply command (used in Task 2):** the Supabase Management API with the project PAT. The drain/queue work against project ref `eqskvquryfgqidgpaqvp`.

---

## Task 1: Add Vitest test harness

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest@^2`
Expected: adds vitest to devDependencies, exits 0.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` object, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Verify the runner works (no tests yet)**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0 or a clean no-tests message). This confirms the harness is wired.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest harness"
```

---

## Task 2: Database migration (tables + claim function)

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Append the migration to `supabase-schema.sql`**

Add to the end of the file:

```sql

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

-- Reclaim stuck 'sending' rows (crash recovery)
create or replace function public.reclaim_stuck_recipients(p_older_than_minutes int)
returns void
language sql as $$
    update public.broadcast_recipients
       set status = 'pending'
     where status = 'sending'
       and created_at < now() - (p_older_than_minutes || ' minutes')::interval;
$$;
```

- [ ] **Step 2: Apply the migration to Supabase**

Save just the appended SQL block to a temp file and POST it to the Management API. Run (PowerShell or bash; bash shown):

```bash
cd /c/Users/Ezza/dpmarketing
python -c "import json; print(json.dumps({'query': open('supabase-schema.sql').read()}))" > /tmp/migrate.json
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/migrate.json \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
```

Note: the full-file re-run will error on the already-existing original tables. Instead, apply ONLY the newly appended block. Copy the block from Step 1 into `/tmp/migrate.sql`, then:

```bash
python -c "import json; print(json.dumps({'query': open('/tmp/migrate.sql').read()}))" > /tmp/migrate.json
curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" \
  --data-binary @/tmp/migrate.json \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
```

`$SUPABASE_PAT` is the Supabase personal access token already configured for this project (in the local `supabase-dp` MCP env / `~/.claude.json`).
Expected: `[]` (success).

- [ ] **Step 3: Verify objects exist**

```bash
curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" \
  -d '{"query":"select tablename from pg_tables where schemaname='"'"'public'"'"' and tablename in ('"'"'broadcast_recipients'"'"','"'"'email_settings'"'"') order by tablename"}' \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
```

Expected: rows for `broadcast_recipients` and `email_settings`.

- [ ] **Step 4: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add broadcast queue + warmup settings schema"
```

---

## Task 3: Warmup cap calculation (TDD)

**Files:**
- Create: `src/lib/warmup.ts`
- Test: `src/lib/warmup.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/warmup.test.ts
import { describe, it, expect } from "vitest";
import { daysSince, dailyCap } from "./warmup";

const CURVE = [50, 100, 250, 500, 1000, 1500, 2500, 3500, 5000];

describe("daysSince", () => {
  it("returns 0 when no start date", () => {
    expect(daysSince(null)).toBe(0);
  });
  it("returns 0 on the start day", () => {
    expect(daysSince("2026-05-20", new Date("2026-05-20T09:00:00Z"))).toBe(0);
  });
  it("returns whole days elapsed", () => {
    expect(daysSince("2026-05-20", new Date("2026-05-23T09:00:00Z"))).toBe(3);
  });
});

describe("dailyCap", () => {
  it("uses curve[0] before warmup has started", () => {
    expect(dailyCap(null, 5000, CURVE)).toBe(50);
  });
  it("uses curve[day] during warmup", () => {
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-05-20T09:00:00Z"))).toBe(50);
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-05-23T09:00:00Z"))).toBe(500);
  });
  it("holds at daily_max past the end of the curve", () => {
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-07-01T09:00:00Z"))).toBe(5000);
  });
  it("respects a custom daily_max past the curve", () => {
    expect(dailyCap("2026-05-20", 8000, CURVE, new Date("2026-07-01T09:00:00Z"))).toBe(8000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/warmup.test.ts`
Expected: FAIL — cannot find module `./warmup`.

- [ ] **Step 3: Implement `src/lib/warmup.ts`**

```ts
// src/lib/warmup.ts

/** Whole UTC days between a YYYY-MM-DD start date and `today`. 0 if no start. */
export function daysSince(startedOn: string | null, today: Date = new Date()): number {
  if (!startedOn) return 0;
  const start = new Date(`${startedOn}T00:00:00Z`).getTime();
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.floor((t - start) / 86_400_000));
}

/**
 * Emails allowed today.
 * Before warmup starts (startedOn null) -> curve[0].
 * During warmup -> curve[dayIndex].
 * Past the curve -> dailyMax.
 */
export function dailyCap(
  startedOn: string | null,
  dailyMax: number,
  curve: number[],
  today: Date = new Date()
): number {
  if (curve.length === 0) return dailyMax;
  if (!startedOn) return curve[0];
  const day = daysSince(startedOn, today);
  return day < curve.length ? curve[day] : dailyMax;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/warmup.test.ts`
Expected: PASS (8 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/warmup.ts src/lib/warmup.test.ts
git commit -m "feat: warmup daily-cap calculation"
```

---

## Task 4: Array chunking helper (TDD)

**Files:**
- Create: `src/lib/chunk.ts`
- Test: `src/lib/chunk.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/chunk.test.ts
import { describe, it, expect } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("splits into full + remainder", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("returns one chunk when size >= length", () => {
    expect(chunk([1, 2], 100)).toEqual([[1, 2]]);
  });
  it("returns [] for empty input", () => {
    expect(chunk([], 100)).toEqual([]);
  });
  it("chunks 250 into 100/100/50", () => {
    const arr = Array.from({ length: 250 }, (_, i) => i);
    const out = chunk(arr, 100);
    expect(out.map((c) => c.length)).toEqual([100, 100, 50]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/chunk.test.ts`
Expected: FAIL — cannot find module `./chunk`.

- [ ] **Step 3: Implement `src/lib/chunk.ts`**

```ts
// src/lib/chunk.ts
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/chunk.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chunk.ts src/lib/chunk.test.ts
git commit -m "feat: array chunk helper"
```

---

## Task 5: Resend batch-send helper

**Files:**
- Modify: `src/lib/resend.ts`

- [ ] **Step 1: Add `sendBatch` and the `BatchMessage` type**

Append to `src/lib/resend.ts`:

```ts
import { chunk } from "./chunk";

export interface BatchMessage {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

export interface BatchResult {
  to: string;
  id: string | null;
  error: string | null;
}

/**
 * Send up to any number of messages using Resend's batch API (100 per call).
 * Returns one result per input message, in order.
 */
export async function sendBatch(messages: BatchMessage[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (const group of chunk(messages, 100)) {
    const payload = group.map((m) => ({
      from: EMAIL_FROM,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      headers: m.headers,
    }));

    try {
      const { data, error } = await resend.batch.send(payload);
      if (error) {
        for (const m of group) results.push({ to: m.to, id: null, error: error.message });
        continue;
      }
      const sent = (data?.data ?? []) as Array<{ id: string }>;
      group.forEach((m, i) => {
        const id = sent[i]?.id ?? null;
        results.push({ to: m.to, id, error: id ? null : "no id returned" });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "batch send failed";
      for (const m of group) results.push({ to: m.to, id: null, error: msg });
    }
  }

  return results;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: Resend batch-send helper"
```

---

## Task 6: Broadcast queue library (enqueue + drain)

**Files:**
- Create: `src/lib/broadcast-queue.ts`

- [ ] **Step 1: Implement `src/lib/broadcast-queue.ts`**

```ts
// src/lib/broadcast-queue.ts
import { supabase } from "./supabase-server";
import { sendBatch, type BatchMessage } from "./resend";
import { dailyCap } from "./warmup";
import { chunk } from "./chunk";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://team.danielphilip.com";
const EMAIL_CAMPAIGN_ENABLED = process.env.EMAIL_CAMPAIGN_ENABLED === "true";
const PER_RUN_BATCH = 1000;
const STUCK_MINUTES = 15;

interface DrainResult {
  sent: number;
  failed: number;
  remaining: number;
  capReached: boolean;
  paused: boolean;
}

interface RecipientRow {
  id: string;
  broadcast_id: string;
  lead_id: string | null;
  email: string;
  first_name: string | null;
  attempts: number;
}

/** Insert pending recipient rows for a broadcast, excluding unsubscribed leads. */
export async function enqueueBroadcast(
  broadcastId: string,
  segmentStatus: string | undefined
): Promise<number> {
  let query = supabase
    .from("leads")
    .select("id, email, first_name")
    .eq("unsubscribed", false);
  if (segmentStatus) query = query.eq("status", segmentStatus);

  const { data: leads, error } = await query;
  if (error) throw new Error(`enqueue: failed to read leads: ${error.message}`);

  const rows = (leads || []).map((l: { id: string; email: string; first_name: string | null }) => ({
    broadcast_id: broadcastId,
    lead_id: l.id,
    email: l.email,
    first_name: l.first_name,
    status: "pending",
  }));

  let inserted = 0;
  for (const group of chunk(rows, 500)) {
    const { error: insErr } = await supabase
      .from("broadcast_recipients")
      .upsert(group, { onConflict: "broadcast_id,email", ignoreDuplicates: true });
    if (insErr) throw new Error(`enqueue: insert failed: ${insErr.message}`);
    inserted += group.length;
  }
  return inserted;
}

async function getSettings() {
  const { data } = await supabase
    .from("email_settings")
    .select("daily_max, warmup_curve, warmup_started_on, paused")
    .eq("id", true)
    .single();
  return (
    data || { daily_max: 5000, warmup_curve: [], warmup_started_on: null, paused: false }
  );
}

/** Count broadcast emails logged today (UTC). */
async function sentToday(): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("campaign_type", "broadcast")
    .gte("created_at", start.toISOString());
  return count || 0;
}

async function countPending(): Promise<number> {
  const { count } = await supabase
    .from("broadcast_recipients")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count || 0;
}

/** Process one bounded batch. Returns counts + whether more work/cap remains. */
export async function drainOnce(): Promise<DrainResult> {
  const settings = await getSettings();
  if (settings.paused) {
    return { sent: 0, failed: 0, remaining: await countPending(), capReached: false, paused: true };
  }

  // Reclaim crashed 'sending' rows first.
  await supabase.rpc("reclaim_stuck_recipients", { p_older_than_minutes: STUCK_MINUTES });

  const cap = dailyCap(settings.warmup_started_on, settings.daily_max, settings.warmup_curve);
  const already = await sentToday();
  const remainingCap = Math.max(0, cap - already);
  if (remainingCap === 0) {
    return { sent: 0, failed: 0, remaining: await countPending(), capReached: true, paused: false };
  }

  const claimLimit = Math.min(PER_RUN_BATCH, remainingCap);
  const { data: claimed, error: claimErr } = await supabase.rpc("claim_broadcast_batch", {
    p_limit: claimLimit,
  });
  if (claimErr) throw new Error(`drain: claim failed: ${claimErr.message}`);
  const batch = (claimed || []) as RecipientRow[];
  if (batch.length === 0) {
    return { sent: 0, failed: 0, remaining: 0, capReached: false, paused: false };
  }

  // Set warmup_started_on the first time we ever send.
  if (!settings.warmup_started_on) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("email_settings").update({ warmup_started_on: today }).eq("id", true);
  }

  // Fetch the broadcast subject/body once (all claimed rows share a broadcast in practice,
  // but support multiple by grouping).
  const broadcastIds = [...new Set(batch.map((r) => r.broadcast_id))];
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("id, subject, html_body")
    .in("id", broadcastIds);
  const byId = new Map(
    (broadcasts || []).map((b: { id: string; subject: string; html_body: string }) => [b.id, b])
  );

  let sent = 0;
  let failed = 0;

  if (!EMAIL_CAMPAIGN_ENABLED) {
    // Dry run: log + mark sent without calling Resend.
    for (const r of batch) {
      const b = byId.get(r.broadcast_id);
      await supabase.from("email_logs").insert({
        lead_id: r.lead_id,
        email: r.email,
        campaign_type: "broadcast",
        broadcast_id: r.broadcast_id,
        subject: b?.subject || "",
        resend_id: null,
        status: "sent",
      });
      await supabase
        .from("broadcast_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    }
    return { sent, failed, remaining: await countPending(), capReached: false, paused: false };
  }

  // Build personalized messages.
  const messages: BatchMessage[] = batch.map((r) => {
    const b = byId.get(r.broadcast_id);
    const unsubscribeUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(r.email)}`;
    const html = (b?.html_body || "")
      .replace(/{{first_name}}/g, r.first_name || "")
      .replace(/{{email}}/g, r.email)
      .replace(/{{unsubscribe_url}}/g, unsubscribeUrl);
    return {
      to: r.email,
      subject: b?.subject || "",
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    };
  });

  const results = await sendBatch(messages);

  // results are in the same order as `batch`.
  for (let i = 0; i < batch.length; i++) {
    const r = batch[i];
    const res = results[i];
    const b = byId.get(r.broadcast_id);
    if (res.id) {
      await supabase.from("email_logs").insert({
        lead_id: r.lead_id,
        email: r.email,
        campaign_type: "broadcast",
        broadcast_id: r.broadcast_id,
        subject: b?.subject || "",
        resend_id: res.id,
        status: "sent",
      });
      await supabase
        .from("broadcast_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    } else {
      const giveUp = r.attempts >= 3;
      await supabase
        .from("broadcast_recipients")
        .update({ status: giveUp ? "failed" : "pending", error: res.error })
        .eq("id", r.id);
      failed++;
    }
  }

  // Mark broadcasts complete when no pending rows remain for them.
  for (const bid of broadcastIds) {
    const { count } = await supabase
      .from("broadcast_recipients")
      .select("id", { count: "exact", head: true })
      .eq("broadcast_id", bid)
      .in("status", ["pending", "sending"]);
    if ((count || 0) === 0) {
      await supabase
        .from("broadcasts")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", bid);
    }
  }

  return { sent, failed, remaining: await countPending(), capReached: false, paused: false };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/broadcast-queue.ts
git commit -m "feat: broadcast queue enqueue + drain library"
```

---

## Task 7: Drain API route (cron + self-chain)

**Files:**
- Create: `src/app/api/email/broadcast-drain/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/email/broadcast-drain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { drainOnce } from "@/lib/broadcast-queue";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainOnce();

    // Self-chain: if more work and headroom remain, kick the next batch without waiting.
    if (!result.paused && !result.capReached && result.remaining > 0) {
      const url = new URL("/api/email/broadcast-drain", request.url);
      void fetch(url.toString(), {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "drain failed";
    console.error("[broadcast-drain]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow GET so Vercel Cron (which issues GET) can trigger the same logic.
export async function GET(request: NextRequest) {
  return POST(request);
}
```

- [ ] **Step 2: Confirm middleware lets it through**

Read `src/middleware.ts`: the auth gate only applies to paths starting with `/admin` or `/api/admin`. `/api/email/broadcast-drain` is not gated, so it passes to the route's own CRON_SECRET check. No middleware change needed.

- [ ] **Step 3: Build to verify the route compiles**

Run: `npm run build`
Expected: build succeeds; `/api/email/broadcast-drain` appears in the route list.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/email/broadcast-drain/route.ts
git commit -m "feat: broadcast drain endpoint with self-chaining"
```

---

## Task 8: Switch broadcasts route to enqueue

**Files:**
- Modify: `src/app/api/admin/broadcasts/route.ts`

- [ ] **Step 1: Replace the inline-send body**

Replace the entire contents of `src/app/api/admin/broadcasts/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { enqueueBroadcast } from "@/lib/broadcast-queue";

/**
 * POST /api/admin/broadcasts
 *
 * Create a broadcast and enqueue its recipients. Sending happens asynchronously
 * via /api/email/broadcast-drain (cron + self-chain), warmup-capped.
 *
 * Body:
 * - subject: string
 * - html_body: string (supports {{first_name}}, {{email}}, {{unsubscribe_url}})
 * - segment_json: { status?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, html_body, segment_json } = body;

    if (!subject || !html_body) {
      return NextResponse.json(
        { error: "subject and html_body are required" },
        { status: 400 }
      );
    }

    const { data: broadcast, error: bErr } = await supabase
      .from("broadcasts")
      .insert({
        subject,
        html_body,
        segment_json: segment_json || {},
        status: "sending",
      })
      .select()
      .single();

    if (bErr || !broadcast) {
      console.error("Error creating broadcast:", bErr);
      return NextResponse.json({ error: "Failed to create broadcast" }, { status: 500 });
    }

    const enqueued = await enqueueBroadcast(broadcast.id, segment_json?.status);

    await supabase
      .from("broadcasts")
      .update({ recipient_count: enqueued })
      .eq("id", broadcast.id);

    // Kick off the first drain immediately (best-effort).
    const url = new URL("/api/email/broadcast-drain", request.url);
    void fetch(url.toString(), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      enqueued,
      message: "Broadcast queued; sending will ramp per warmup schedule.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Broadcast API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/broadcasts/route.ts
git commit -m "feat: broadcasts route enqueues instead of inline send"
```

---

## Task 9: Broadcast progress route

**Files:**
- Create: `src/app/api/admin/broadcasts/[id]/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/admin/broadcasts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: broadcast } = await supabase
    .from("broadcasts")
    .select("id, subject, status, recipient_count, sent_at")
    .eq("id", id)
    .single();

  if (!broadcast) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const counts: Record<string, number> = { pending: 0, sending: 0, sent: 0, failed: 0 };
  for (const status of Object.keys(counts)) {
    const { count } = await supabase
      .from("broadcast_recipients")
      .select("id", { count: "exact", head: true })
      .eq("broadcast_id", id)
      .eq("status", status);
    counts[status] = count || 0;
  }

  const total = counts.pending + counts.sending + counts.sent + counts.failed;
  return NextResponse.json({ broadcast, counts, total });
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: route compiles; `/api/admin/broadcasts/[id]` appears.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/broadcasts/[id]/route.ts"
git commit -m "feat: broadcast progress endpoint"
```

---

## Task 10: CSV import (API + page)

**Files:**
- Create: `src/app/api/admin/leads/import/route.ts`
- Create: `src/app/admin/import/page.tsx`

- [ ] **Step 1: Implement the import API**

```ts
// src/app/api/admin/leads/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { chunk } from "@/lib/chunk";

/**
 * POST /api/admin/leads/import
 * Body: { rows: Array<{ email: string; first_name?: string; phone?: string; status?: string; source?: string }> }
 * Upserts into leads (dedupe on email), in chunks.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : null;
    if (!rows) {
      return NextResponse.json({ error: "rows[] required" }, { status: 400 });
    }

    const cleaned = rows
      .map((r: Record<string, unknown>) => ({
        email: String(r.email || "").toLowerCase().trim(),
        first_name: r.first_name ? String(r.first_name) : null,
        phone: r.phone ? String(r.phone) : null,
        status: r.status ? String(r.status) : "Lead",
        source: r.source ? String(r.source) : "csv-import",
        updated_at: new Date().toISOString(),
      }))
      .filter((r: { email: string }) => r.email.includes("@"));

    let upserted = 0;
    for (const group of chunk(cleaned, 500)) {
      const { error } = await supabase
        .from("leads")
        .upsert(group, { onConflict: "email" });
      if (error) {
        return NextResponse.json(
          { error: `Upsert failed after ${upserted}: ${error.message}` },
          { status: 500 }
        );
      }
      upserted += group.length;
    }

    return NextResponse.json({ success: true, upserted, skipped: rows.length - cleaned.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement the import page (parses CSV client-side, posts in chunks)**

```tsx
// src/app/admin/import/page.tsx
"use client";

import { useState } from "react";

interface Row {
  email: string;
  first_name?: string;
  phone?: string;
  status?: string;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const ei = idx("email");
  const fi = idx("first_name");
  const pi = idx("phone");
  const si = idx("status");
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const email = (cols[ei] || "").trim();
    if (!email) continue;
    rows.push({
      email,
      first_name: fi >= 0 ? (cols[fi] || "").trim() : undefined,
      phone: pi >= 0 ? (cols[pi] || "").trim() : undefined,
      status: si >= 0 ? (cols[si] || "").trim() : undefined,
    });
  }
  return rows;
}

export default function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(String(reader.result || "")));
    reader.readAsText(file);
  }

  async function upload() {
    setBusy(true);
    setLog([]);
    let done = 0;
    const size = 1000;
    for (let i = 0; i < rows.length; i += size) {
      const slice = rows.slice(i, i + size);
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: slice }),
      });
      const data = await res.json();
      done += slice.length;
      setLog((l) => [...l, res.ok ? `Imported ${done}/${rows.length}` : `Error: ${data.error}`]);
      if (!res.ok) break;
    }
    setBusy(false);
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Import Leads (CSV)</h1>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-slate-600">
          CSV with a header row. Recognized columns: <code>email</code> (required),{" "}
          <code>first_name</code>, <code>phone</code>, <code>status</code>. Existing emails are
          updated, not duplicated.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={onFile} />
        {rows.length > 0 && (
          <p className="text-sm font-medium">{rows.length} rows parsed.</p>
        )}
        <button
          onClick={upload}
          disabled={busy || rows.length === 0}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {busy ? "Importing..." : "Import"}
        </button>
        {log.length > 0 && (
          <div className="rounded bg-slate-50 p-4 font-mono text-xs">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: both routes/pages compile.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/leads/import/route.ts src/app/admin/import/page.tsx
git commit -m "feat: CSV lead import (api + page)"
```

---

## Task 11: Composer progress + status panel + nav

**Files:**
- Modify: `src/app/admin/composer/page.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Replace composer with enqueue + progress polling**

Replace the entire contents of `src/app/admin/composer/page.tsx` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Progress {
  counts: { pending: number; sending: number; sent: number; failed: number };
  total: number;
  broadcast: { status: string };
}

export default function ComposerPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Lead");
  const [loading, setLoading] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!broadcastId) return;
    async function poll() {
      const res = await fetch(`/api/admin/broadcasts/${broadcastId}`);
      if (res.ok) {
        const data = (await res.json()) as Progress;
        setProgress(data);
        if (data.broadcast.status === "sent" && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      }
    }
    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [broadcastId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !htmlBody) {
      alert("Subject and body are required");
      return;
    }
    setLoading(true);
    setProgress(null);
    setBroadcastId(null);
    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html_body: htmlBody,
          segment_json: { status: selectedStatus },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setBroadcastId(data.broadcast_id);
        setSubject("");
        setHtmlBody("");
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to queue broadcast:", error);
      alert("Failed to queue broadcast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Email Composer</h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Send to (Status)</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 md:w-48"
            >
              <option value="Lead">All Leads</option>
              <option value="Checkout Started">Checkout Started</option>
              <option value="Buyer">Buyers</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">HTML Body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              rows={12}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? "Queuing..." : "Queue Broadcast"}
          </button>
        </form>

        {progress && (
          <div className="mt-6 rounded bg-slate-50 p-4">
            <p className="text-sm font-medium">
              Status: {progress.broadcast.status} — {progress.counts.sent}/{progress.total} sent
              {progress.counts.failed > 0 ? `, ${progress.counts.failed} failed` : ""}
            </p>
            <div className="mt-2 h-2 w-full rounded bg-slate-200">
              <div
                className="h-2 rounded bg-green-600"
                style={{
                  width: `${progress.total ? (progress.counts.sent / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sending ramps per the warmup schedule; large lists send over several days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the "Import" nav link**

In `src/app/admin/layout.tsx`, change the `navItems` array to include Import after Leads:

```tsx
  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Leads", href: "/admin/leads", icon: "👥" },
    { label: "Import", href: "/admin/import", icon: "📥" },
    { label: "Sequences", href: "/admin/sequences", icon: "📧" },
    { label: "Composer", href: "/admin/composer", icon: "✍️" },
    { label: "Analytics", href: "/admin/analytics", icon: "📈" },
  ];
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/composer/page.tsx src/app/admin/layout.tsx
git commit -m "feat: composer live progress + import nav link"
```

---

## Task 12: Add drain cron to vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add the cron entry**

Replace `vercel.json` with:

```json
{
  "crons": [
    {
      "path": "/api/email/cron",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/email/broadcast-drain",
      "schedule": "0 14 * * *"
    }
  ]
}
```

(14:00 UTC start; the endpoint self-chains through the rest of the day's cap. One daily cron is enough on any Vercel plan.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: daily broadcast-drain cron"
```

---

## Task 13: Dry-run integration verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: all warmup + chunk tests PASS.

- [ ] **Step 2: Deploy to production (env still has EMAIL_CAMPAIGN_ENABLED=false)**

Run: `vercel --prod --yes`
Expected: deploy succeeds.

- [ ] **Step 3: Seed two test leads via the public API**

```bash
curl -s -X POST https://team.danielphilip.com/api/leads -H "Content-Type: application/json" -d '{"email":"drain-test-1@example.com","first_name":"One","status":"Lead"}'
curl -s -X POST https://team.danielphilip.com/api/leads -H "Content-Type: application/json" -d '{"email":"drain-test-2@example.com","first_name":"Two","status":"Lead"}'
```

Expected: both return `success: true`.

- [ ] **Step 4: Create a broadcast via the DB (dry-run path), then trigger drain**

Insert a broadcast + recipients directly is unnecessary — instead call the admin route is gated by cookie. For verification, create the broadcast row and recipients with the Management API, then hit the drain endpoint with CRON_SECRET. Use the SUPABASE_PAT and CRON_SECRET values:

```bash
# create broadcast
curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" \
  -d '{"query":"insert into broadcasts (subject, html_body, segment_json, status) values ('"'"'Dry run'"'"','"'"'<p>hi {{first_name}}</p>'"'"','"'"'{\"status\":\"Lead\"}'"'"','"'"'sending'"'"') returning id"}' \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
# enqueue recipients for that broadcast id (replace <BID>)
curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" \
  -d '{"query":"insert into broadcast_recipients (broadcast_id, email, first_name, status) select '"'"'<BID>'"'"', email, first_name, '"'"'pending'"'"' from leads where email like '"'"'drain-test-%'"'"'"}' \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
# trigger drain
curl -s -X POST https://team.danielphilip.com/api/email/broadcast-drain -H "Authorization: Bearer $CRON_SECRET"
```

Expected: drain returns `{ success: true, sent: 2, ... }`; no real email sent (flag is false); `email_logs` has 2 broadcast rows; recipients marked `sent`; broadcast flips to `sent`.

- [ ] **Step 5: Verify and clean up test data**

```bash
curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" \
  -d '{"query":"delete from email_logs where email like '"'"'drain-test-%'"'"'; delete from broadcast_recipients where email like '"'"'drain-test-%'"'"'; delete from broadcasts where subject='"'"'Dry run'"'"'; delete from leads where email like '"'"'drain-test-%'"'"'; select count(*) as leftover from leads where email like '"'"'drain-test-%'"'"'"}' \
  "https://api.supabase.com/v1/projects/eqskvquryfgqidgpaqvp/database/query"
```

Expected: `leftover = 0`.

- [ ] **Step 6: Final commit (if any tracked changes remain) and summary**

No code changes expected in this task. Report results.

---

## Self-Review Notes

- **Spec coverage:** queue table (Task 2), email_settings + warmup_curve (Task 2/3), claim function w/ SKIP LOCKED (Task 2), batch API (Task 5), drain + self-chain (Tasks 6–7), enqueue (Tasks 6, 8), progress endpoint (Task 9), CSV import (Task 10), composer progress + status/pause display (Task 11 — note: pause toggle UI deferred; `paused` is settable directly in `email_settings`, drain honors it), drain cron (Task 12), dry-run + kill-switch + warmup ramp (Task 13). 
- **Pause toggle:** the spec's status panel included a pause toggle; this plan ships the `paused` flag end-to-end (drain honors it) but exposes it via the settings row rather than a button, to keep scope tight. Flagged for the reviewer; a toggle button can be a fast follow if wanted.
- **Type consistency:** `drainOnce` returns `{sent, failed, remaining, capReached, paused}` used identically in the route; `BatchMessage`/`BatchResult` shared between `resend.ts` and `broadcast-queue.ts`; `chunk` signature consistent across importers.
- **Secrets:** `$SUPABASE_PAT` and `$CRON_SECRET` are referenced as env placeholders, not hardcoded.
