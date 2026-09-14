// A mismatch between backend and frontend renders an empty board, not an error.
// Keep dependency-free: plain strings and numbers only.

export const PERIOD_LENGTH = 675

export const BOARD_TOPIC = 'bchan/board'

export function threadTopic(thread: string): string {
    return `bchan/thread/${thread}`
}

export const MB_ADDRESS = 'bc322a23377d4f71e7aa41d303b2391cb28c937c'
