import { PrivateKey } from '@ethersphere/bee-js'
import { bee } from './bee'
import { MB_SIGNER, MB_STAMP } from './key'
import { log } from './logger'
import { marshalPosts, marshalThreads, threads } from './memory'
import { PERIOD_LENGTH, getBoardTopic, getThreadTopic } from './topics'

const signer = new PrivateKey(MB_SIGNER)

export async function publishThreadFeed(thread: string): Promise<void> {
  log(`Publishing thread ${thread}...`)
  const feedWriter = bee.rollingFeed.makeWriter(getThreadTopic(thread), signer, PERIOD_LENGTH)
  await feedWriter.uploadPayload(MB_STAMP, marshalPosts(thread))
  log('Published successfully')
}

export async function publishBoardFeed(): Promise<void> {
  log('Publishing board...')
  const feedWriter = bee.rollingFeed.makeWriter(getBoardTopic(), signer, PERIOD_LENGTH)
  await feedWriter.uploadPayload(MB_STAMP, marshalThreads())
  log('Published successfully')
}

export async function publishAllFeeds(): Promise<void> {
  log('Publishing all feeds...')
  for (const thread of threads) {
    await publishThreadFeed(thread)
  }
  await publishBoardFeed()
}
