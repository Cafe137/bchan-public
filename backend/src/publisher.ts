import { Topic } from '@ethersphere/bee-js'
import { bee } from './bee'
import { MB_SIGNER, MB_STAMP } from './key'
import { log } from './logger'
import { marshalPosts, marshalThreads, threads } from './memory'
import { getCurrentIdentifierWord } from './shared'

export async function publishThreadFeed(thread: string) {
  log(`Publishing thread ${thread}...`)
  const feedWriter = bee.feed.makeWriter(Topic.fromString(getCurrentIdentifierWord() + thread), MB_SIGNER)
  await feedWriter.uploadPayload(MB_STAMP, marshalPosts(thread))
  log('Published successfully')
}

export async function publishBoardFeed() {
  log('Publishing board...')
  const feedWriter = bee.feed.makeWriter(Topic.fromString(getCurrentIdentifierWord()), MB_SIGNER)
  await feedWriter.uploadPayload(MB_STAMP, marshalThreads())
  log('Published successfully')
}

export async function publishAllFeeds() {
  log('Publishing all feeds...')
  for (const thread of threads) {
    await publishThreadFeed(thread)
  }
  await publishBoardFeed()
}
