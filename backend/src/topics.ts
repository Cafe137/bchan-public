import { BOARD_TOPIC, PERIOD_LENGTH, threadTopic } from '@bchan/shared'
import { Topic } from '@ethersphere/bee-js'

export { PERIOD_LENGTH } from '@bchan/shared'

export function getBoardTopic() {
    return Topic.fromString(BOARD_TOPIC)
}

export function getThreadTopic(thread: string) {
    return Topic.fromString(threadTopic(thread))
}

// Must match bee-js's own periodIndex.
export function getCurrentPeriod(): number {
    return Math.floor(Date.now() / 1000 / PERIOD_LENGTH)
}
