import { Reference } from '@ethersphere/bee-js'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const BACKUP_DIR = 'backup'
const THREADS_DIR = join(BACKUP_DIR, 'threads')
const POSTS_DIR = join(BACKUP_DIR, 'posts')

mkdirSync(THREADS_DIR, { recursive: true })
mkdirSync(POSTS_DIR, { recursive: true })

export function backupThread(reference: Reference, message: Uint8Array) {
    const filename = `${Date.now()}_${reference.toHex()}.bin`
    writeFileSync(join(THREADS_DIR, filename), message)
}

export function backupPost(thread: Reference, post: Reference, message: Uint8Array) {
    const dir = join(POSTS_DIR, thread.toHex())
    mkdirSync(dir, { recursive: true })
    const filename = `${Date.now()}_${post.toHex()}.bin`
    writeFileSync(join(dir, filename), message)
}
