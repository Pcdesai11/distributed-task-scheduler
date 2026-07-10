import 'dotenv/config'
import { Queue, Worker, type JobsOptions } from 'bullmq'

export const QUEUE_NAME = 'chronos-jobs'
export const JOB_NAME = 'run-job'

export interface QueueJobData {
  jobId: string
  handler: string
  payload: Record<string, unknown>
}

function parseRedisUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
  }
}

export const redisConnection = parseRedisUrl(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
)

export const jobQueue = new Queue<QueueJobData>(QUEUE_NAME, {
  connection: redisConnection,
})

const PRIORITY_MAP = {
  critical: 1,
  high: 2,
  normal: 3,
  low: 4,
} as const

export function getQueueJobOptions(
  priority: keyof typeof PRIORITY_MAP,
  maxRetries: number,
): JobsOptions {
  return {
    priority: PRIORITY_MAP[priority],
    attempts: maxRetries + 1,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  }
}

export async function enqueueJob(
  data: QueueJobData,
  priority: keyof typeof PRIORITY_MAP,
  maxRetries: number,
): Promise<void> {
  await jobQueue.add(JOB_NAME, data, getQueueJobOptions(priority, maxRetries))
}

export { Worker, redisConnection as createQueueConnection }
