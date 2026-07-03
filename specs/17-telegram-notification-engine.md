# Spec 17: Asynchronous Telegram Notification Engine

## Overview

A multi-tenant, asynchronous Telegram notification system that delivers real-time order alerts to merchants at zero marginal cost. This is the default notification channel for Starter and Growth plan subscribers. Pro plan subscribers additionally receive local SMS (Greenweb/BoomCast) and can configure per-event channel routing. Telegram is opt-in — stores operate normally without it.

---

## Design Decisions (Grilling Session Outcomes)

| Decision | Choice | Rationale |
|---|---|---|
| Queue trigger | Postgres DB Webhook on `orders` INSERT fires an Edge Function that inserts into `notification_queue` | Fully decoupled from Next.js checkout latency |
| Worker invocation | Supabase Cron (`pg_cron`) every 5 seconds | Industry-standard transactional outbox pattern; handles retries natively |
| Bot architecture | Single shared ShopNest bot (`TELEGRAM_BOT_TOKEN` in Edge Function env) | Merchants only paste their Chat ID; no BotFather UX complexity |
| Queue table design | Generic `notification_queue` with `channel` enum (`telegram` \| `sms`) | Extensible for Pro SMS without schema refactor |
| Pro routing | `notification_preferences` table (`merchant_id`, `event_type`, `channel`, `enabled`) | Allows Pro merchants to route specific events to specific channels |
| Concurrency safety | `SELECT ... FOR UPDATE SKIP LOCKED` in worker | Prevents double-send when pg_cron overlaps |
| Status machine | `pending → processing → sent \| failed` | `processing` acts as a soft-lock; stale rows reset after 60s |
| Observability | `error_message` column on queue row + Supabase function logs | No separate log table in v1; failures are searchable on the queue row |
| Test message delivery | Synchronous — fires from Next.js API route immediately on save | Instant merchant feedback; does not route through the queue |
| Telegram opt-in | Fully optional; stores work without it | Merchants can rely on dashboard Realtime view exclusively |
| v1 event scope | `order_created` only | All other events (`payment_confirmed`, `stock_low`, `order_shipped`) deferred |

---

## Database Schema

### 1. `merchants` table — add column

```sql
telegram_chat_id TEXT NULL
```

- **RLS**: Merchants may only `SELECT` and `UPDATE` their own row.
- Nullable — Telegram is opt-in.

### 2. `notification_queue` table — new

```typescript
// db/schema.ts addition
export const notificationQueue = pgTable('notification_queue', {
  id:             uuid('id').defaultRandom().primaryKey(),
  merchantId:     uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  channel:        text('channel', { enum: ['telegram', 'sms'] }).notNull().default('telegram'),
  recipient:      text('recipient').notNull(),        // telegram_chat_id or phone number
  messagePayload: text('message_payload').notNull(),  // plain text message string
  status:         text('status', { enum: ['pending', 'processing', 'sent', 'failed'] }).notNull().default('pending'),
  errorMessage:   text('error_message'),
  processedAt:    timestamp('processed_at'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});
```

**Indices:**
- `(status, created_at)` — primary queue worker scan
- `(merchant_id)` — for per-merchant queue inspection

### 3. `notification_preferences` table — new

```typescript
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id:         uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
    eventType:  text('event_type', {
      enum: ['order_created', 'payment_confirmed', 'stock_low', 'order_shipped', 'order_delivered'],
    }).notNull(),
    channel:    text('channel', { enum: ['telegram', 'sms'] }).notNull(),
    enabled:    boolean('enabled').notNull().default(true),
    createdAt:  timestamp('created_at').defaultNow().notNull(),
    updatedAt:  timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('notification_preferences_merchant_event_channel_unique')
      .on(t.merchantId, t.eventType, t.channel),
  ]
);
```

> **v1 Note:** Only `order_created` + `telegram` rows are active. The table is seeded when a merchant saves their Telegram Chat ID. All other `event_type` values and the `sms` channel are deferred until Pro SMS ships.

---

## Queue Trigger Flow

```
Customer submits payment details (bKash/Nagad and TxID)
       ↓
payment_confirmations INSERT
       ↓
Supabase DB Webhook fires on `payment_confirmations` INSERT
       ↓
Webhook calls Edge Function: `on-order-created-notify`
       ↓
Function checks:
  - Does merchant have telegram_chat_id set?
  - Is notification_preferences enabled for (order_created, telegram)?
       ↓
If yes → INSERT into notification_queue
  (channel='telegram', recipient=telegram_chat_id, status='pending')
       ↓
pg_cron wakes up within 5 seconds
       ↓
`dispatch-notifications` Edge Function runs
```

**Key invariant:** The `notification_queue` INSERT is NOT inside the Drizzle transactions. If the webhook or queue insert fails, the checkout process is not rolled back — notification delivery is best-effort (matches Invariant #6 in `architecture.md`).

---

## Supabase Edge Functions

### `on-order-created-notify`

**Trigger:** Supabase DB Webhook on `payment_confirmations` table INSERT.

**Responsibilities:**
1. Receive the new payment confirmation row payload.
2. Fetch the corresponding order details from `orders` table.
3. Query `merchants` for `telegram_chat_id` WHERE `id = payment.merchant_id`.
4. Query `notification_preferences` for `(merchant_id, 'order_created', 'telegram', enabled = true)`.
5. If both conditions pass: INSERT into `notification_queue` with formatted message payload containing actual TxID, payment method, and dashboard link.
6. Wrap everything in try/catch — failure must not bubble up or affect system integrity.

---

### `dispatch-notifications`

**File:** `supabase/functions/dispatch-notifications/index.ts`
**Trigger:** Supabase Cron (`pg_cron`) — every 5 seconds.

#### Worker Algorithm

```typescript
async function run() {
  // 0. Reset stale processing rows (crash recovery)
  await db.execute(sql`
    UPDATE notification_queue
    SET status = 'pending'
    WHERE status = 'processing'
      AND created_at < NOW() - INTERVAL '60 seconds'
  `);

  // 1. Claim a batch atomically (concurrency-safe)
  const batch = await db.execute(sql`
    SELECT * FROM notification_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 25
    FOR UPDATE SKIP LOCKED
  `);

  if (batch.length === 0) return;

  // 2. Mark batch as processing
  await db.update(notificationQueue)
    .set({ status: 'processing' })
    .where(inArray(notificationQueue.id, batch.map(r => r.id)));

  // 3. Deduplicate by recipient — send at most 1 per recipient per run
  //    (respects Telegram's ~1 msg/s per chat limit)
  const seen = new Set<string>();
  for (const row of batch) {
    if (seen.has(row.recipient)) {
      // Reset to pending — picked up in next cron run
      await markPending(row.id);
      continue;
    }
    seen.add(row.recipient);

    // 4. Send with 40ms spacing (25 req/s = 40ms per message)
    await sendToChannel(row);
    await sleep(40);
  }
}
```

#### `sendToChannel` Logic

```typescript
async function sendToChannel(row: NotificationQueueRow) {
  if (row.channel === 'telegram') {
    const res = await fetch(
      `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: row.recipient,
          text: row.messagePayload,
          parse_mode: 'HTML',
        }),
      }
    );

    if (res.ok) {
      await markSent(row.id);
      return;
    }

    const json = await res.json();

    // 429: Too Many Requests — pause execution and leave pending
    if (res.status === 429) {
      const retryAfter = json.parameters?.retry_after ?? 5;
      await sleep(retryAfter * 1000);
      await markPending(row.id); // reset to pending — next cron run picks it up
      return;
    }

    // All other failures — mark failed with error detail
    await markFailed(row.id, json.description ?? `HTTP ${res.status}`);
  }
}
```

#### Telegram Rate Limit Enforcement

| Limit | Rule Applied |
|---|---|
| Global: ~30 msg/s across all chats | Batch capped at 25 with 40ms sleep between sends |
| Single chat: ~1 msg/s | Recipient deduplication within each batch — excess stay `pending` |
| Group chats: ~20 msg/min | Same deduplication; excess messages queued for subsequent runs |

---

## Merchant Onboarding UX

**Location:** `(dashboard)/settings` — new "Notifications" tab added to existing tab bar.

### Tab Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Telegram Order Alerts                       [Badge: Free]  │
│  ─────────────────────────────────────────────────────────  │
│  Receive instant notifications in Telegram when a new       │
│  order is placed in your store.                             │
│                                                             │
│  How to find your Chat ID:                                  │
│  1. Open Telegram and search for @getmyid_bot               │
│  2. Tap Start — the bot instantly shows your Chat ID        │
│     (a 9–10 digit number like 123456789)                    │
│  3. Paste it below and click Save                           │
│                                                             │
│  Telegram Chat ID                                           │
│  ┌────────────────────────────────────────────┐             │
│  │  e.g. 123456789                            │             │
│  └────────────────────────────────────────────┘             │
│                                                             │
│  [Save & Send Test Message]          [Disconnect]           │
│                                                             │
│  ✅ Connected — test sent Jun 30, 2026 at 6:14 PM           │
└─────────────────────────────────────────────────────────────┘

── Pro Plan only ────────────────────────────────────────────
  Notification Routing  (configure which alerts go where)

  Event                  Telegram     SMS
  ─────────────────────────────────────────────────────────
  New Order              [✓ On]       [○ Off]
  Payment Confirmed      [deferred]   [deferred]
  Low Stock              [deferred]   [deferred]
```

### Server Action / API Route: `POST /api/dashboard/notifications/telegram`

1. **Validate** `telegram_chat_id` against `/^-?\d{7,13}$/` (Telegram IDs are 7–13 digits; group IDs are negative).
2. **Update** `merchants.telegram_chat_id` for the authenticated merchant (session from `auth.api.getSession()`).
3. **Upsert** `notification_preferences`: `{ eventType: 'order_created', channel: 'telegram', enabled: true }`.
4. **Fire test message** synchronously via Telegram API:
   ```
   ✅ Success! Your store is now connected to live order alerts.
   Powered by ShopNest 🛒
   ```
5. **On Telegram error** (chat not found, bot blocked, invalid ID): Return `422` with user-facing message:
   > "We couldn't reach that Chat ID. Make sure you've started a chat with @ShopNestBot first, then try again."
6. **On success**: Return `200` with `{ connected: true, testedAt: ISO_TIMESTAMP }`. Store `testedAt` in merchant session or a `telegram_connected_at` column (TBD — or just show "Connected" without a timestamp if storage overhead isn't worth it).

### Disconnect Flow (DELETE/PATCH)

- Sets `merchants.telegram_chat_id` to `NULL`.
- Sets all `notification_preferences` rows for this merchant with `channel = 'telegram'` to `enabled = false`.
- Does **not** delete `pending` queue rows — they are skipped by `on-order-created-notify` on the next order since preferences are now disabled.

---

## Telegram Message Format

### New Order Alert (`order_created`)

```
🛒 <b>New Order — #ORD-00123</b>

<b>Customer:</b> Rahim Uddin
<b>Phone:</b> 01712345678
<b>Amount:</b> ৳1,450

<b>Items:</b>
• Katan Saree (White) × 1 — ৳1,200
• Delivery (Inside Dhaka) — ৳250

<b>Payment:</b> bKash
<b>TxID:</b> BK20250101ABC123

<a href="https://shopnest.com.bd/dashboard/orders/ORD-00123">View in Dashboard →</a>
```

- Uses HTML parse mode for bold/link formatting.
- Dashboard link is always absolute (uses `shopnest.com.bd` root domain, not merchant subdomain).

---

## Build Plan Unit

**Unit 17** — depends on:
- Unit 6 (Order creation — `orders` table and checkout flow exist)
- Unit 10 (Settings page — tab structure exists)
- Unit 12 (Subscriptions — plan check for Pro routing UI gating)

---

## New Files

| Path | Description |
|---|---|
| `supabase/functions/on-order-created-notify/index.ts` | DB Webhook handler — inserts into `notification_queue` |
| `supabase/functions/dispatch-notifications/index.ts` | pg_cron worker — claims and dispatches pending queue rows |
| `db/queries/notifications.ts` | Typed Drizzle queries for `notification_queue` and `notification_preferences` |
| `app/(dashboard)/settings/_components/NotificationsTab.tsx` | Merchant-facing Notifications tab UI |
| `app/api/dashboard/notifications/telegram/route.ts` | Save Chat ID, fire test message |
| `lib/validations/notifications.ts` | Zod schema for Chat ID input |

## Modified Files

| Path | Change |
|---|---|
| `db/schema.ts` | Add `telegram_chat_id` to `merchants`; add `notification_queue` and `notification_preferences` tables |
| `app/(dashboard)/settings/page.tsx` | Add "Notifications" tab |
| `.specify/memory/constitution.md` (Technology Stack & Architecture) | Add new tables to Storage Model; add new Edge Functions to Background Tasks table |
| `.specify/memory/constitution.md` (Product Scope & Boundaries) | Update Notifications section and In Scope list |
| `specs/00-build-plan.md` | Append Unit 17 |

---

## Deferred Items

| Item | Deferred To |
|---|---|
| `payment_confirmed` Telegram event | v2 |
| `stock_low` Telegram event | v3 (SMS unit) |
| `order_shipped` / `order_delivered` Telegram events | v2 |
| Pro per-event SMS routing UI | v3 (when SMS ships) |
| Per-merchant bot tokens | v2 if platform scale demands |
| `notification_logs` audit table | v2 |
| Group chat ID support | v2 |
| Greenweb/BoomCast SMS integration | v3 |
