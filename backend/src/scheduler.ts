import { Dates, System } from 'cafe-utility'
import { acquireLock, unlock } from './lock'
import { log } from './logger'
import { needsNewIdentifierWord, updateIdentifierWord } from './memory'
import { publishAllFeeds } from './publisher'
import { getCurrentIdentifierWord } from './topics'

export function runScheduler() {
    System.forever(
        async () => {
            if (needsNewIdentifierWord()) {
                log('New identifier word needed')
                await acquireLock()
                try {
                    const word = getCurrentIdentifierWord()
                    updateIdentifierWord(word)
                    await publishAllFeeds()
                } finally {
                    unlock()
                }
            }
        },
        Dates.seconds(5),
        console.log
    )
}
