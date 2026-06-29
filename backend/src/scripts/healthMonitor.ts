/**
 * Standalone health monitor script — watches workers and triggers failover.
 * Run separately: npm run monitor (from backend/)
 * The main server also runs monitoring internally every 10s.
 */
import { seedAll } from '../seed.js'
import { runHealthChecks, startMonitoring } from '../services/monitoringService.js'

seedAll()

console.log('Chronos health monitor started (checks every 10s)')
runHealthChecks()
startMonitoring(10_000)
