import { Topic } from '@ethersphere/bee-js'
import { bee } from './bee'
import { MB_SIGNER, MB_STAMP } from './key'
import { log } from './logger'
import { marshalPosts, marshalThreads, threads } from './memory'
import { getCurrentIdentifierWord } from './shared'

export async function publishPosts() {
    log('About to publish...')

    for (const thread of threads) {
        log(`Publishing thread ${thread}...`)
        const feedWriter = bee.makeFeedWriter(Topic.fromString(getCurrentIdentifierWord() + thread), MB_SIGNER)
        await feedWriter.uploadPayload(MB_STAMP, marshalPosts(thread))
        log(`Published successfully`)
    }

    log('Publishing threads...')
    const feedWriter = bee.makeFeedWriter(Topic.fromString(getCurrentIdentifierWord()), MB_SIGNER)
    await feedWriter.uploadPayload(MB_STAMP, marshalThreads())
    log('Published successfully')
}
