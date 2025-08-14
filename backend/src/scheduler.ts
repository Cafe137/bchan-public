import { Dates, System } from 'cafe-utility'
import { acquireLock, unlock } from './lock'
import { log } from './logger'
import { needsNewIdentifierWord, updateIdentifierWord } from './memory'
import { publishPosts } from './publisher'
import { getCurrentIdentifierWord } from './shared'

export function runScheduler() {
    System.forever(
        async () => {
            if (needsNewIdentifierWord()) {
                log('New identifier word needed')
                await acquireLock()
                try {
                    const word = getCurrentIdentifierWord()
                    updateIdentifierWord(word)
                    await publishPosts()
                } finally {
                    unlock()
                }
            }
        },
        Dates.seconds(5),
        console.log
    )
}
