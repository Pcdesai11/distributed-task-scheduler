import 'dotenv/config'
import { Queue, Worker, type JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

export const QUEUE_NAME = 'chronos-jobs'

export interface QueueJobData {
  jobId: string
  handler: string
  payload: Record<string, unknown>
}

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const jobQueue = new Queue<QueueJobData>(QUEUE_NAME, { connection })

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
  await jobQueue.add(data.handler, data, getQueueJobOptions(priority, maxRetries))
}

export function createQueueConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })
}

export { Worker, connection }
