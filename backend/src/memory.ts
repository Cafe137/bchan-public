import { Reference } from '@ethersphere/bee-js'
import { Arrays, Binary } from 'cafe-utility'
import { existsSync, readFileSync } from 'fs'
import { rename, writeFile } from 'fs/promises'

async function writeAtomic(path: string, data: string): Promise<void> {
    const tmp = `${path}.tmp`
    await writeFile(tmp, data, 'utf-8')
    await rename(tmp, path)
}

export const threads: string[] = existsSync('threads.json') ? JSON.parse(readFileSync('threads.json', 'utf-8')) : []
export const posts: Record<string, string[]> = existsSync('posts.json')
    ? JSON.parse(readFileSync('posts.json', 'utf-8'))
    : {}
for (const thread of threads) {
    if (!posts[thread]) {
        posts[thread] = []
    }
}

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

export async function addThread(reference: Reference) {
    Arrays.unshiftAndLimit(threads, reference.toHex(), 128)
    posts[reference.toHex()] = []
    for (const key of Object.keys(posts)) {
        if (!threads.some(thread => thread === key)) {
            delete posts[key]
        }
    }
    await writeAtomic('threads.json', JSON.stringify(threads))
    await writeAtomic('posts.json', JSON.stringify(posts))
}

export async function addPost(thread: Reference, post: Reference) {
    if (!posts[thread.toHex()]) {
        throw Error('Thread not found')
    }
    Arrays.unshiftAndLimit(posts[thread.toHex()], post.toHex(), 128)
    await writeAtomic('posts.json', JSON.stringify(posts))
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
