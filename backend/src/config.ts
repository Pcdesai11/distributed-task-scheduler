import type { JobPriority } from '../types.js'

export const JOB_HANDLERS = [
  'webhook-retry',
  'email-digest',
  'report-export',
  'invoice-sync',
  'data-backfill',
  'generic',
] as const

export type JobHandler = (typeof JOB_HANDLERS)[number]

export function isValidHandler(handler: string): handler is JobHandler {
  return (JOB_HANDLERS as readonly string[]).includes(handler)
}

export function resolveHandler(name: string, explicit?: string): JobHandler {
  if (explicit && isValidHandler(explicit)) return explicit
  const base = name.split('-')[0]
  const candidate = JOB_HANDLERS.find((h) => h.startsWith(base) || name.includes(h))
  return candidate ?? 'generic'
}

export const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
}

export const SUCCESS_RATE_TARGET = 0.995
