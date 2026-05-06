import { NULL_ADDRESS, Reference, Topic } from '@ethersphere/bee-js'
import { Binary, Dates, System } from 'cafe-utility'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBee } from '../App'
import { useBatchId } from '../BatchContext'
import { getBoardIdentifierWord } from '../Consensus'
import { Thread } from '../Thread'
import { Countdown } from '../components/Countdown'
import { InputGroup } from '../components/InputGroup'
import { Section } from '../components/Section'
import { Spinner } from '../components/Spinner'
import { MainLayout } from '../layouts/MainLayout'
import { publishThread } from '../service/Publisher'

export function BoardPage() {
    const { bee } = useBee()
    const { postBatchId } = useBatchId()
    const navigate = useNavigate()
    const location = useLocation()
    const [nextRefreshAt, setNextRefreshAt] = useState<Date>(new Date(Date.now() + Dates.seconds(10)))
    const [threadTitle, setThreadTitle] = useState<string>('')
    const [threadBody, setThreadBody] = useState<string>('')
    const [threads, setThreads] = useState<Reference[] | null>(null)
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

        const intervalId = System.runAndSetInterval(initialize, Dates.seconds(10))
        return () => {
            if (typeof intervalId === 'number') {
                clearInterval(intervalId)
            }
        }
    }, [bee])

    async function handleSubmit() {
        if (!threads) {
            alert('Threads have not been loaded yet')
            return
        }

        if (!threadTitle || !threadBody) {
            alert('Please write a title and a body')
            return
        }

        try {
            if (!bee) throw new Error('Bee instance not available')
            await publishThread(bee, threadTitle, threadBody, threads[0] ?? NULL_ADDRESS, postBatchId)
            alert('Your thread will be visible in the feed shortly')
            setThreadTitle('')
            setThreadBody('')
            setShowThreadForm(false)
        } catch (error) {
            console.error(error)
            alert('Failed to publish the thread, check console for more details')
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
