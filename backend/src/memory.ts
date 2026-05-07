import { Reference } from '@ethersphere/bee-js'
import { Arrays, Binary } from 'cafe-utility'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { getCurrentIdentifierWord } from './shared'

export const threads: string[] = existsSync('threads.json') ? JSON.parse(readFileSync('threads.json', 'utf-8')) : []
export const posts: Record<string, string[]> = existsSync('posts.json')
    ? JSON.parse(readFileSync('posts.json', 'utf-8'))
    : {}
for (const thread of threads) {
    if (!posts[thread]) {
        posts[thread] = []
    }
}

let lastIdentifierWord = ''

export function getThreadTip() {
    if (threads.length === 0) {
        return new Uint8Array(32)
    }
    return Binary.hexToUint8Array(threads[0])
}

export function getPostTip(thread: string): Uint8Array {
    if (!posts[thread]) {
        throw Error('Thread not found')
    }
    if (posts[thread].length === 0) {
        return new Uint8Array(32)
    }
    return Binary.hexToUint8Array(posts[thread][0])
}

export function addThread(reference: Reference) {
    Arrays.unshiftAndLimit(threads, reference.toHex(), 128)
    posts[reference.toHex()] = []
    for (const key of Object.keys(posts)) {
        if (!threads.some(thread => thread === key)) {
            delete posts[key]
        }
    }
    writeFileSync('threads.json', JSON.stringify(threads))
    writeFileSync('posts.json', JSON.stringify(posts))
}

export function addPost(thread: Reference, post: Reference) {
    if (!posts[thread.toHex()]) {
        throw Error('Thread not found')
    }
    Arrays.unshiftAndLimit(posts[thread.toHex()], post.toHex(), 128)
    writeFileSync('posts.json', JSON.stringify(posts))
}

export function marshalThreads(): Uint8Array {
    const data = new Uint8Array(4096)
    for (let i = 0; i < threads.length; i++) {
        data.set(Binary.hexToUint8Array(threads[i]), i * 32)
    }
    return data
}

export function marshalPosts(thread: string): Uint8Array {
    const data = new Uint8Array(4096)
    if (!posts[thread]) {
        throw Error('Thread not found')
    }
    for (let i = 0; i < posts[thread].length; i++) {
        data.set(Binary.hexToUint8Array(posts[thread][i]), i * 32)
    }
    return data
}

export function needsNewIdentifierWord() {
    const currentIdentifierWord = getCurrentIdentifierWord()
    if (currentIdentifierWord !== lastIdentifierWord) {
        return true
    }
    return false
}

export function updateIdentifierWord(word: string) {
    lastIdentifierWord = word
}
