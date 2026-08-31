import { Dates, System } from 'cafe-utility'
import { acquireLock, unlock } from './lock'
import { log } from './logger'
import { syncAllFeeds } from './publisher'
import { getCurrentPeriod } from './topics'

export function runScheduler() {
    let lastSyncedPeriod = -1

    System.forever(
        async () => {
            const period = getCurrentPeriod()
            if (period === lastSyncedPeriod) {
                return
            }
            log(`Period ${period} started, checking feeds...`)
            await acquireLock()
            try {
                await syncAllFeeds()
                // Set last, so a partial failure retries on the next tick.
                lastSyncedPeriod = period
            } finally {
                unlock()
            }
        },
        Dates.seconds(5),
        console.log
    )
}
