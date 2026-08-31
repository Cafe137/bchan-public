import { BOARD_TOPIC, MB_ADDRESS, threadTopic } from '@bchan/shared'
import { EthAddress, Topic } from '@ethersphere/bee-js'

export { PERIOD_LENGTH } from '@bchan/shared'

export const WRITER = '00000000000000000000000000000000000000000000000000000000000016ca'

// Owner of both feeds - the MB_SIGNER key the backend publishes with.
export const MB_OWNER = new EthAddress(MB_ADDRESS)

export function getBoardTopic() {
    return Topic.fromString(BOARD_TOPIC)
}

export function getThreadTopic(thread: string) {
    return Topic.fromString(threadTopic(thread))
}
