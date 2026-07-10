import type { JobHandler } from '../config.js'

export type HandlerFn = (payload: Record<string, unknown>) => Promise<void>

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

async function webhookRetry(payload: Record<string, unknown>): Promise<void> {
  const url = String(payload.url ?? 'https://httpbin.org/post')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Chronos-Worker/1.0' },
    body: JSON.stringify(payload.body ?? { ok: true }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Webhook failed: ${res.status}`)
}

async function emailDigest(payload: Record<string, unknown>): Promise<void> {
  await sleep(300)
  const to = String(payload.to ?? 'user@example.com')
  console.log(`[email-digest] Sent digest to ${to}`)
}

async function reportExport(payload: Record<string, unknown>): Promise<void> {
  await sleep(500)
  const format = String(payload.format ?? 'csv')
  console.log(`[report-export] Generated ${format} report (${payload.rows ?? 100} rows)`)
}

async function invoiceSync(payload: Record<string, unknown>): Promise<void> {
  await sleep(400)
  const batch = Number(payload.batchSize ?? 50)
  console.log(`[invoice-sync] Synced ${batch} invoices`)
}

async function dataBackfill(payload: Record<string, unknown>): Promise<void> {
  await sleep(600)
  const records = Number(payload.records ?? 1000)
  console.log(`[data-backfill] Backfilled ${records} records`)
}

async function generic(payload: Record<string, unknown>): Promise<void> {
  await sleep(200)
  console.log('[generic] Job completed', payload)
}

export const handlers: Record<JobHandler, HandlerFn> = {
  'webhook-retry': webhookRetry,
  'email-digest': emailDigest,
  'report-export': reportExport,
  'invoice-sync': invoiceSync,
  'data-backfill': dataBackfill,
  generic,
}

export async function runHandler(
  handler: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const fn = handlers[handler as JobHandler] ?? handlers.generic
  await fn(payload)
}
