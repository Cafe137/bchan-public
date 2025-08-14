import { Dates } from 'cafe-utility'

export function getCurrentIdentifierWord() {
    const currentDaySegment = Math.floor((Math.floor(Date.now() / 1000) % 86400) / 675)
    return `${Dates.isoDate()}/${currentDaySegment}`
}
