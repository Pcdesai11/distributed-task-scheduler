CREATE TABLE "alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"severity" varchar(16) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failover_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"from_worker" varchar(64) NOT NULL,
	"to_worker" varchar(64) NOT NULL,
	"reason" text NOT NULL,
	"jobs_rerouted" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"handler" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"priority" varchar(16) NOT NULL,
	"worker_id" varchar(64),
	"queue" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics_state" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"server_started_at" timestamp with time zone NOT NULL,
	"retries_today" integer DEFAULT 0 NOT NULL,
	"reroutes_today" integer DEFAULT 0 NOT NULL,
	"success_rate_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"throughput_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latency_history" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"region" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"active_jobs" integer DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 200 NOT NULL,
	"cpu_percent" real DEFAULT 0 NOT NULL,
	"memory_percent" real DEFAULT 0 NOT NULL,
	"last_heartbeat" timestamp with time zone NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"traffic_weight" integer DEFAULT 0 NOT NULL
);
