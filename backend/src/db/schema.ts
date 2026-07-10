import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const jobs = pgTable('jobs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  handler: varchar('handler', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  priority: varchar('priority', { length: 16 }).notNull(),
  workerId: varchar('worker_id', { length: 64 }),
  queue: varchar('queue', { length: 64 }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  payload: jsonb('payload').notNull().default({}),
  retryAt: timestamp('retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workers = pgTable('workers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  region: varchar('region', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  activeJobs: integer('active_jobs').notNull().default(0),
  capacity: integer('capacity').notNull().default(200),
  cpuPercent: real('cpu_percent').notNull().default(0),
  memoryPercent: real('memory_percent').notNull().default(0),
  lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  trafficWeight: integer('traffic_weight').notNull().default(0),
})

export const alerts = pgTable('alerts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  severity: varchar('severity', { length: 16 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  resolved: boolean('resolved').notNull().default(false),
})

export const failoverEvents = pgTable('failover_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  fromWorker: varchar('from_worker', { length: 64 }).notNull(),
  toWorker: varchar('to_worker', { length: 64 }).notNull(),
  reason: text('reason').notNull(),
  jobsRerouted: integer('jobs_rerouted').notNull().default(0),
})

export const metricsState = pgTable('metrics_state', {
  id: varchar('id', { length: 32 }).primaryKey(),
  serverStartedAt: timestamp('server_started_at', { withTimezone: true }).notNull(),
  retriesToday: integer('retries_today').notNull().default(0),
  reroutesToday: integer('reroutes_today').notNull().default(0),
  successRateHistory: jsonb('success_rate_history').notNull().default([]),
  throughputHistory: jsonb('throughput_history').notNull().default([]),
  latencyHistory: jsonb('latency_history').notNull().default([]),
})
