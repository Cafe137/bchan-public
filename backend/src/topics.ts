import { BOARD_TOPIC, threadTopic } from '@bchan/shared'
import { Topic } from '@ethersphere/bee-js'
import { Dates } from 'cafe-utility'

export { PERIOD_LENGTH } from '@bchan/shared'

export function getBoardTopic() {
    return Topic.fromString(BOARD_TOPIC)
}

export function getThreadTopic(thread: string) {
    return Topic.fromString(threadTopic(thread))
}

// Only used to detect period rollover in the scheduler; no longer a feed topic.
export function getCurrentIdentifierWord() {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}`
}
