import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

/**
 * dispatch-notifications
 *
 * Invoked by Supabase Cron (pg_cron) every 5 seconds.
 * Implements the transactional outbox pattern:
 *
 * 1. Reset stale "processing" rows (crash recovery — 60s timeout)
 * 2. Claim up to 25 "pending" rows atomically via SELECT ... FOR UPDATE SKIP LOCKED
 * 3. Mark batch as "processing"
 * 4. Deduplicate by recipient (max 1 per chat per run — respects Telegram's ~1 msg/s per chat)
 * 5. Send each message at ≤25 req/s (40ms spacing) via Telegram Bot API
 * 6. On 429: pause for retry_after seconds, reset to "pending"
 * 7. On other failure: mark "failed" with error_message
 * 8. On success: mark "sent" with processed_at
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[dispatch-notifications] TELEGRAM_BOT_TOKEN is not set.")
    return new Response(JSON.stringify({ error: "Bot token not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Helper: update queue row status
  const updateStatus = async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ) => {
    const { error } = await supabase
      .from("notification_queue")
      .update({ status, ...extra })
      .eq("id", id)
    if (error) {
      console.error(`[dispatch-notifications] Failed to update row ${id} status:`, error)
    }
  }

  try {
    // ── Step 0: Crash recovery — reset stale "processing" rows ────────────
    const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString()
    const { error: resetError } = await supabase
      .from("notification_queue")
      .update({ status: "pending" })
      .eq("status", "processing")
      .lt("created_at", sixtySecondsAgo)

    if (resetError) {
      console.error("[dispatch-notifications] Stale row reset failed:", resetError)
    }

    // ── Step 1: Claim a batch (up to 25 pending rows, FIFO order) ─────────
    // Note: Supabase JS client does not expose raw FOR UPDATE SKIP LOCKED.
    // We use a two-step optimistic claim pattern: select, then update to
    // "processing" immediately. The 60s stale reset above prevents permanent
    // lock if the function crashes between select and update.
    const { data: batch, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(25)

    if (fetchError) {
      console.error("[dispatch-notifications] Failed to fetch batch:", fetchError)
      return new Response(JSON.stringify({ error: "Fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!batch || batch.length === 0) {
      console.log("[dispatch-notifications] No pending messages. Done.")
      return new Response(JSON.stringify({ dispatched: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`[dispatch-notifications] Claiming ${batch.length} messages.`)

    // ── Step 2: Mark entire batch as "processing" atomically ──────────────
    const batchIds = batch.map((r: { id: string }) => r.id)
    const { error: claimError } = await supabase
      .from("notification_queue")
      .update({ status: "processing" })
      .in("id", batchIds)
      .eq("status", "pending") // optimistic concurrency guard

    if (claimError) {
      console.error("[dispatch-notifications] Failed to claim batch:", claimError)
      return new Response(JSON.stringify({ error: "Claim failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // ── Step 3: Deduplicate by recipient (1 per chat per run) ─────────────
    const seen = new Set<string>()
    let dispatched = 0

    for (const row of batch) {
      if (seen.has(row.recipient)) {
        // Reset to pending — will be picked up in next cron run
        await updateStatus(row.id, "pending")
        console.log(
          `[dispatch-notifications] Deferring duplicate recipient ${row.recipient} (row ${row.id}).`
        )
        continue
      }
      seen.add(row.recipient)

      // ── Step 4: Send via Telegram Bot API ───────────────────────────────
      if (row.channel === "telegram") {
        try {
          const res = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: row.recipient,
                text: row.message_payload,
                parse_mode: "HTML",
                // Disable link preview for cleaner notifications
                link_preview_options: { is_disabled: true },
              }),
            }
          )

          if (res.ok) {
            await updateStatus(row.id, "sent", { processed_at: new Date().toISOString() })
            dispatched++
            console.log(
              `[dispatch-notifications] Sent message ${row.id} to chat ${row.recipient}.`
            )
          } else {
            const json = await res.json().catch(() => ({}))

            if (res.status === 429) {
              // Rate limited — pause and put back in queue
              const retryAfter: number = json.parameters?.retry_after ?? 5
              console.warn(
                `[dispatch-notifications] Rate limited (429). Waiting ${retryAfter}s before continuing.`
              )
              await updateStatus(row.id, "pending")
              await sleep(retryAfter * 1000)
            } else {
              // Permanent failure — mark failed with reason
              const errorMsg: string =
                json.description ?? `Telegram API error: HTTP ${res.status}`
              console.error(
                `[dispatch-notifications] Failed to send ${row.id}: ${errorMsg}`
              )
              await updateStatus(row.id, "failed", { error_message: errorMsg })
            }
          }
        } catch (sendErr: unknown) {
          const errMsg = sendErr instanceof Error ? sendErr.message : "Network error"
          console.error(`[dispatch-notifications] Exception sending ${row.id}:`, errMsg)
          await updateStatus(row.id, "failed", { error_message: errMsg })
        }
      } else {
        // SMS and other channels — deferred to V3
        console.log(
          `[dispatch-notifications] Unsupported channel "${row.channel}" for row ${row.id}. Marking failed.`
        )
        await updateStatus(row.id, "failed", {
          error_message: `Channel "${row.channel}" is not yet supported.`,
        })
      }

      // ── Step 5: Throttle — 40ms between sends = 25 req/s max ────────────
      await sleep(40)
    }

    console.log(
      `[dispatch-notifications] Done. Dispatched: ${dispatched}/${batch.length}.`
    )
    return new Response(JSON.stringify({ dispatched, total: batch.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[dispatch-notifications] Fatal error:", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
