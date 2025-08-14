import { System } from 'cafe-utility'
import { log } from './logger'

let waiting = 0
let locked = false

export async function acquireLock() {
    if (waiting > 128) {
        throw Error('Too many waiting locks')
    }
    waiting++
    while (locked) {
        await System.sleepMillis(1000)
    }
    locked = true
    log('Locked')
}

export function unlock() {
    waiting--
    locked = false
    log('Unlocked')
}
