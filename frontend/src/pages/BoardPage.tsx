import { identicon } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { NULL_ADDRESS, Reference, Topic } from '@ethersphere/bee-js'
import { Binary, Dates, System, Types } from 'cafe-utility'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBee } from '../App'
import { useBatchId } from '../BatchContext'
import { useToast } from '../ToastContext'
import { getBoardIdentifierWord, getThreadIdentiferWord } from '../Consensus'
import { Thread } from '../Thread'
import { Countdown } from '../components/Countdown'
import { InputGroup } from '../components/InputGroup'
import { Section } from '../components/Section'
import { Spinner } from '../components/Spinner'
import { MainLayout } from '../layouts/MainLayout'
import { publishThread } from '../service/Publisher'

type RecentPostItem = {
    reference: string
    owner: string
    timestamp: number
    text: string | null
    image: string | null
    threadReference: string
    threadTitle: string
}

export function BoardPage() {
    const { bee } = useBee()
    const { postBatchId } = useBatchId()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const [nextRefreshAt, setNextRefreshAt] = useState<Date>(new Date(Date.now() + Dates.seconds(10)))
    const [threadTitle, setThreadTitle] = useState<string>('')
    const [threadBody, setThreadBody] = useState<string>('')
    const [threads, setThreads] = useState<Reference[] | null>(null)
    const threadsRef = useRef<Reference[] | null>(null)
    const [recentPosts, setRecentPosts] = useState<RecentPostItem[] | null>(null)
    const [showThreadForm, setShowThreadForm] = useState<boolean>(false)
    const titleInputRef = useRef<HTMLInputElement>(null)

    // Redirect from /threads to root path
    useEffect(() => {
        if (location.pathname === '/threads') {
            navigate('/', { replace: true })
        }
    }, [location.pathname, navigate])

    useEffect(() => {
        async function initialize() {
            setNextRefreshAt(new Date(Date.now() + Dates.seconds(10)))
            if (bee) {
                try {
                    const feedReader = bee.makeFeedReader(
                        Topic.fromString(getBoardIdentifierWord()),
                        'bc322a23377d4f71e7aa41d303b2391cb28c937c'
                    )
                    const result = await feedReader.downloadPayload()
                    setThreads(Binary.partition(result.payload.toUint8Array(), 32).map(x => new Reference(x)))
                } catch (error) {
                    console.error('Failed to load threads:', error)
                    setThreads([])
                }
            }
        }

        return System.runAndSetInterval(initialize, Dates.seconds(10))
    }, [bee])

    useEffect(() => {
        threadsRef.current = threads
    }, [threads])

    useEffect(() => {
        if (!bee) return
        const currentBee = bee

        async function loadRecentPosts() {
            const currentThreads = threadsRef.current
            if (!currentThreads) return

            const nonNullThreads = currentThreads.filter(t => !t.equals(NULL_ADDRESS))
            const allPosts: RecentPostItem[] = []

            await Promise.all(
                nonNullThreads.map(async threadRef => {
                    try {
                        const threadData = await currentBee.downloadData(threadRef)
                        const bytes = threadData.toUint8Array()
                        const threadPayload = new TextDecoder().decode(bytes.slice(117))
                        const threadJson = Types.asObject(JSON.parse(threadPayload))
                        const threadTitle = Types.asString(threadJson.title)

                        const feedReader = currentBee.makeFeedReader(
                            Topic.fromString(getThreadIdentiferWord(threadRef.toHex())),
                            'bc322a23377d4f71e7aa41d303b2391cb28c937c'
                        )
                        const result = await feedReader.downloadPayload()
                        const postRefs = Binary.partition(result.payload.toUint8Array(), 32)
                            .map(x => new Reference(x))
                            .filter(x => !x.equals(NULL_ADDRESS))

                        await Promise.all(
                            postRefs.slice(0, 3).map(async postRef => {
                                try {
                                    const postData = await currentBee.downloadData(postRef)
                                    const pb = postData.toUint8Array()
                                    const owner = Binary.uint8ArrayToHex(pb.slice(65, 85))
                                    const timestamp = Number(Binary.uint64ToNumber(pb.slice(149, 157), 'LE'))
                                    const postJson = Types.asObject(JSON.parse(new TextDecoder().decode(pb.slice(157))))
                                    allPosts.push({
                                        reference: postRef.toHex(),
                                        owner,
                                        timestamp,
                                        text: postJson.message ? Types.asString(postJson.message) : null,
                                        image: postJson.image ? `${currentBee.url}/bytes/${Types.asString(postJson.image)}` : null,
                                        threadReference: threadRef.toHex(),
                                        threadTitle
                                    })
                                } catch {
                                    // skip posts that fail to load
                                }
                            })
                        )
                    } catch {
                        // skip threads that fail to load
                    }
                })
            )

            allPosts.sort((a, b) => b.timestamp - a.timestamp)
            setRecentPosts(allPosts.slice(0, 10))
        }

        return System.runAndSetInterval(loadRecentPosts, Dates.seconds(30))
    }, [bee])

    async function handleSubmit() {
        if (!threads) {
            showToast('Threads have not been loaded yet', 'error')
            return
        }

        if (!threadTitle || !threadBody) {
            showToast('Please write a title and a body', 'error')
            return
        }

        try {
            if (!bee) throw new Error('Bee instance not available')
            await publishThread(bee, threadTitle, threadBody, threads[0] ?? NULL_ADDRESS, postBatchId)
            showToast('Your thread will be visible in the feed shortly', 'success')
            setThreadTitle('')
            setThreadBody('')
            setShowThreadForm(false)
        } catch (error) {
            console.error(error)
            showToast('Failed to publish the thread, check console for more details', 'error')
        }
    }

    return (
        <MainLayout
            title="All Threads"
            mainAction={{
                label: showThreadForm ? 'Hide' : 'New Thread',
                onClick: () => {
                    const newState = !showThreadForm
                    setShowThreadForm(newState)
                    if (newState) {
                        // Focus the title input when form is opened
                        setTimeout(() => {
                            titleInputRef.current?.focus()
                        }, 0)
                    }
                }
            }}
        >
            {showThreadForm && (
                <Section title="Start a new thread">
                    <InputGroup label="Title">
                        <input
                            type="text"
                            value={threadTitle}
                            onChange={e => setThreadTitle(e.target.value)}
                            ref={titleInputRef}
                        />
                    </InputGroup>
                    <InputGroup label="Body">
                        <textarea
                            placeholder="Write something..."
                            value={threadBody}
                            onChange={e => setThreadBody(e.target.value)}
                        />
                    </InputGroup>
                    <button onClick={handleSubmit}>Submit</button>
                </Section>
            )}
            <section>
                <div className="section-title">Recent Posts</div>
                {recentPosts === null ? (
                    <div className="section-body"><Spinner /></div>
                ) : recentPosts.length === 0 ? (
                    <div className="section-body"><p>No posts yet.</p></div>
                ) : (
                    <div className="recent-posts-list">
                        {recentPosts.map(post => (
                            <div
                                key={post.reference}
                                className="recent-post-item"
                                onClick={() => navigate(`/thread/${post.threadReference}`)}
                            >
                                <img
                                    src={createAvatar(identicon, { seed: post.owner }).toDataUri()}
                                    className="recent-post-avatar"
                                    width={32}
                                    height={32}
                                />
                                <div className="recent-post-content">
                                    <div className="recent-post-meta">
                                        <span className="recent-post-thread">{post.threadTitle}</span>
                                        <span className="timestamp">
                                            {post.owner.slice(0, 8)} · {Dates.getTimeDelta(post.timestamp).toLowerCase()} ago
                                        </span>
                                    </div>
                                    {post.image ? (
                                        <img src={post.image} className="recent-post-image" />
                                    ) : post.text ? (
                                        <p className="recent-post-text">
                                            {post.text.length > 120 ? post.text.slice(0, 120) + '…' : post.text}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            <div className="thread-container">
                {threads ? (
                    threads.length > 0 ? (
                        threads
                            .filter(x => !x.equals(NULL_ADDRESS))
                            .map(thread => <Thread key={thread.toHex()} bee={bee!} reference={thread} />)
                    ) : (
                        <p>No threads found. Be the first to create one!</p>
                    )
                ) : (
                    <Spinner />
                )}
            </div>
            <Countdown target={nextRefreshAt} prefix="Refreshing in" />
        </MainLayout>
    )
}
