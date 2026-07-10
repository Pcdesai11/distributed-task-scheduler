import 'dotenv/config'
import { Worker } from 'bullmq'
import { QUEUE_NAME, createQueueConnection, type QueueJobData } from './queue/index.js'
import { runHandler } from './handlers/index.js'
import * as store from './store/postgresStore.js'

const WORKER_ID = process.env.WORKER_ID ?? 'worker-01'
const WORKER_NAME = process.env.WORKER_NAME ?? 'scheduler-primary-us-east'
const WORKER_REGION = process.env.WORKER_REGION ?? 'us-east-1'
const WORKER_CAPACITY = Number(process.env.WORKER_CAPACITY ?? 200)

async function registerWorker(): Promise<void> {
  const existing = await store.getWorker(WORKER_ID)
  await store.saveWorker({
    id: WORKER_ID,
    name: WORKER_NAME,
    region: WORKER_REGION,
    status: 'healthy',
    activeJobs: existing?.activeJobs ?? 0,
    capacity: WORKER_CAPACITY,
    cpuPercent: existing?.cpuPercent ?? 30,
    memoryPercent: existing?.memoryPercent ?? 40,
    lastHeartbeat: new Date().toISOString(),
    isPrimary: existing?.isPrimary ?? true,
    trafficWeight: existing?.trafficWeight ?? 50,
  })
}

async function heartbeat(): Promise<void> {
  const worker = await store.getWorker(WORKER_ID)
  if (!worker) return
  worker.lastHeartbeat = new Date().toISOString()
  worker.status = 'healthy'
  await store.saveWorker(worker)
}

async function processJob(data: QueueJobData): Promise<void> {
  const job = await store.getJob(data.jobId)
  if (!job) throw new Error(`Job ${data.jobId} not found`)

  const start = Date.now()
  job.status = 'running'
  job.workerId = WORKER_ID
  job.startedAt = new Date().toISOString()
  job.attempts += 1
  await store.saveJob(job)

  const worker = await store.getWorker(WORKER_ID)
  if (worker) {
    worker.activeJobs += 1
    await store.saveWorker(worker)
  }

  try {
    await runHandler(data.handler, data.payload)
    job.status = 'completed'
    job.completedAt = new Date().toISOString()
    job.durationMs = Date.now() - start
  } catch (err) {
    if (job.attempts <= job.maxRetries) {
      job.status = 'retrying'
      job.retryAt = new Date(Date.now() + 1000 * 2 ** job.attempts).toISOString()
      const metrics = await store.getMetricsState()
      metrics.retriesToday += 1
      await store.saveMetricsState(metrics)
    } else {
      job.status = 'failed'
      job.completedAt = new Date().toISOString()
    }
    job.durationMs = Date.now() - start
    throw err
  } finally {
    await store.saveJob(job)
    const w = await store.getWorker(WORKER_ID)
    if (w) {
      w.activeJobs = Math.max(0, w.activeJobs - 1)
      await store.saveWorker(w)
    }
  }
}

async function main() {
  await store.initJobCounter()
  await registerWorker()
  console.log(`Chronos worker ${WORKER_ID} (${WORKER_NAME}) starting...`)

  const connection = createQueueConnection()
  const worker = new Worker<QueueJobData>(
    QUEUE_NAME,
    async (bullJob) => processJob(bullJob.data),
    { connection, concurrency: 10 },
  )

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.data.jobId} failed:`, err.message)
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.data.jobId} completed`)
  })

  setInterval(heartbeat, 5_000)

  const shutdown = async () => {
    console.log('Shutting down worker...')
    const w = await store.getWorker(WORKER_ID)
    if (w) {
      w.status = 'offline'
      await store.saveWorker(w)
    }
    await worker.close()
    await connection.quit()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error('Worker failed to start:', err)
  process.exit(1)
})
