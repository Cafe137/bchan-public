// Protocol constants that the backend (writer) and frontend (reader) must agree on.
// A mismatch here does not throw - it derives a feed topic nobody publishes to, so the
// board just renders empty. Keep this package dependency-free: it exports plain strings
// and numbers, not `Topic`/`EthAddress` instances, so both sides can consume it without
// coupling their bee-js versions or module formats.

/**
 * Rolling feed period, in seconds. 86400 / 675 = 128 periods per day, so period
 * boundaries line up with the UTC day exactly as the old segment scheme did.
 */
export const PERIOD_LENGTH = 675

/** Base topic of the board feed (thread list). */
export const BOARD_TOPIC = 'bchan/board'

/** Base topic of a thread's feed (post list), keyed by the thread reference hex. */
export function threadTopic(thread: string): string {
    return `bchan/thread/${thread}`
}

/** Address of MB_SIGNER - the key the backend publishes both feeds with. */
export const MB_ADDRESS = 'bc322a23377d4f71e7aa41d303b2391cb28c937c'
