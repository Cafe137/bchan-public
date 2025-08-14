import { Dates } from 'cafe-utility'

export const WRITER = '0000000000000000000000000000000000000000000000000000000000000d08'

export function getThreadIdentiferWord(thread: string) {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}${thread}`
}

export function getBoardIdentifierWord() {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}`
}
