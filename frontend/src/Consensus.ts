import { Dates } from 'cafe-utility'

export const WRITER = '00000000000000000000000000000000000000000000000000000000000016ca'

export function getThreadIdentiferWord(thread: string) {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}${thread}`
}

export function getBoardIdentifierWord() {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}`
}
