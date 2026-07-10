/**
 * Standalone health monitor — polls worker heartbeats and triggers failover.
 * Run: npm run monitor (from backend/)
 */
import 'dotenv/config'
import { runHealthChecks } from '../routes/workers.js'

console.log('Chronos health monitor started (checks every 10s)')
runHealthChecks().catch(console.error)
setInterval(() => runHealthChecks().catch(console.error), 10_000)
