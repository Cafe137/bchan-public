import { PrivateKey, RollingFeedWriter } from '@ethersphere/bee-js'
import { Arrays } from 'cafe-utility'
import { bee } from './bee'
import { MB_SIGNER, MB_STAMP } from './key'
import { acquireLock, unlock } from './lock'
import { log } from './logger'
import { marshalPosts, marshalThreads, threads } from './memory'
import { PERIOD_LENGTH, getBoardTopic, getThreadTopic } from './topics'

const SYNC_CONCURRENCY = 8

const signer = new PrivateKey(MB_SIGNER)

function boardWriter(): RollingFeedWriter {
  return bee.rollingFeed.makeWriter(getBoardTopic(), signer, PERIOD_LENGTH)
}

function threadWriter(thread: string): RollingFeedWriter {
  return bee.rollingFeed.makeWriter(getThreadTopic(thread), signer, PERIOD_LENGTH)
}

export async function publishThreadFeed(thread: string): Promise<void> {
  log(`Publishing thread ${thread}...`)
  await threadWriter(thread).uploadPayload(MB_STAMP, marshalPosts(thread))
  log('Published successfully')
}

export async function publishBoardFeed(): Promise<void> {
  log('Publishing board...')
  await boardWriter().uploadPayload(MB_STAMP, marshalThreads())
  log('Published successfully')
}

async function syncFeed(name: string, writer: RollingFeedWriter, payload: () => Uint8Array): Promise<void> {
  if (await writer.isCaughtUp()) {
    return
  }
  await acquireLock()
  try {
    // A message may have published this feed while we waited.
    if (await writer.isCaughtUp()) {
      return
    }
    log(`Feed ${name} fell behind, republishing and backfilling...`)
    await Promise.all([
      writer.uploadPayload(MB_STAMP, payload()),
      // Throws on a first-ever publish, when there is no earlier period to copy forward.
      writer.catchUp(MB_STAMP).catch(error => log(`Nothing to backfill for ${name}: ${error}`))
    ])
    log(`Feed ${name} is up to date`)
  } finally {
    unlock()
  }
}

export async function syncAllFeeds(): Promise<void> {
  const feeds = threads.map(thread => ({
    name: `thread ${thread}`,
    writer: threadWriter(thread),
    payload: () => marshalPosts(thread)
  }))
  feeds.push({ name: 'board', writer: boardWriter(), payload: () => marshalThreads() })

  for (const batch of Arrays.splitBySize(feeds, SYNC_CONCURRENCY)) {
    await Promise.all(batch.map(feed => syncFeed(feed.name, feed.writer, feed.payload)))
  }
}
