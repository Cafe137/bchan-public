import { Bee, EthAddress, NULL_ADDRESS, Reference, Topic } from '@ethersphere/bee-js'
import { Binary, Dates, Types, Uint8ArrayReader } from 'cafe-utility'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, ProofRow } from './components/Modal'
import { Spinner } from './components/Spinner'
import { getThreadIdentiferWord } from './Consensus'

export type ThreadMetadata = {
    reference: string
    title: string
    body: string
    timestamp?: number
    postCount?: number
    lastPostTime?: number
}

interface Props {
    bee: Bee
    reference: Reference
}

export function Thread({ bee, reference }: Props) {
    const navigate = useNavigate()
    const refHex = reference.toHex()
    const [payload, setPayload] = useState<ThreadMetadata | null>(null)
    const [digest, setDigest] = useState<string | null>(null)
    const [signature, setSignature] = useState<string | null>(null)
    const [previous, setPrevious] = useState<string | null>(null)
    const [owner, setOwner] = useState<EthAddress | null>(null)
    const [postCount, setPostCount] = useState<number | null>(null)
    const [lastPostTime, setLastPostTime] = useState<number | null>(null)
    const [showProofModal, setShowProofModal] = useState(false)

    // Always define useMemo for activity styling, even if not used yet
    const activityStyle = useMemo(() => {
        if (!lastPostTime) return { borderStyle: {}, colorClass: '', color: '' }

        const now = Date.now()
        const ageInHours = (now - lastPostTime) / (1000 * 60 * 60)

        // Color coding based on post age - simplified to 3 variants
        let borderStyle = {}
        let colorClass = ''
        let color = ''

        if (ageInHours < 1) {
            // Less than 1 hour - subtle orange
            borderStyle = {
                border: '1px solid #ff9900'
            }
            colorClass = 'activity-hot'
            color = '#ff3333'
        } else if (ageInHours < 24) {
            // Less than 24 hours - subtle red
            borderStyle = {
                border: '1px solid #ff3333'
            }
            colorClass = 'activity-recent'
            color = '#ff9900'
        } else {
            // More than 24 hours - subtle blue
            borderStyle = {
                border: '1px solid #3399ff'
            }
            colorClass = 'activity-old'
            color = '#3399ff'
        }

        return { borderStyle, colorClass, color }
    }, [lastPostTime])

    useEffect(() => {
        async function loadThreadData() {
            const ref = new Reference(refHex)
            const data = await bee.data.download(ref)
            const reader = new Uint8ArrayReader(data.toUint8Array())
            setSignature(Binary.uint8ArrayToHex(reader.read(65)))
            setOwner(new EthAddress(reader.read(20)))
            setPrevious(Binary.uint8ArrayToHex(reader.read(32)))
            const payload = data.toUint8Array().slice(65 + 32 + 20)
            setDigest(Binary.uint8ArrayToHex(data.toUint8Array().slice(65)))
            const json = Types.asObject(JSON.parse(new TextDecoder().decode(payload)))

            // Set payload immediately for faster rendering
            const threadData = {
                reference: refHex,
                title: Types.asString(json.title),
                body: Types.asString(json.body)
            }
            setPayload(threadData)

            // Fetch post count asynchronously after basic thread data is displayed
            try {
                const feedReader = bee.feed.makeReader(
                    Topic.fromString(getThreadIdentiferWord(refHex)),
                    'bc322a23377d4f71e7aa41d303b2391cb28c937c'
                )
                const result = await feedReader.downloadPayload()
                const posts = Binary.partition(result.payload.toUint8Array(), 32)
                    .map(x => new Reference(x))
                    .filter(x => !x.equals(NULL_ADDRESS))

                const count = posts.length
                setPostCount(count)

                // Get the most recent post time (first 32 bytes = most recent post)
                if (posts.length > 0) {
                    try {
                        const mostRecentPostRef = posts[0]
                        const postData = await bee.data.download(mostRecentPostRef)
                        const postReader = new Uint8ArrayReader(postData.toUint8Array())
                        postReader.read(65) // Skip signature
                        postReader.read(20) // Skip owner
                        postReader.read(32) // Skip previous
                        postReader.read(32) // Skip thread
                        const timestamp = Binary.uint64ToNumber(postReader.read(8), 'LE')
                        setLastPostTime(Number(timestamp))

                        // Update payload with post count and last post time
                        setPayload({
                            ...threadData,
                            postCount: count,
                            lastPostTime: Number(timestamp)
                        })
                    } catch (error) {
                        console.error('Failed to fetch most recent post:', error)
                        // Update payload with post count only
                        setPayload({
                            ...threadData,
                            postCount: count
                        })
                    }
                } else {
                    // Update payload with post count only
                    setPayload({
                        ...threadData,
                        postCount: count
                    })
                }
            } catch (error) {
                console.error('Failed to load post count:', error)
            }
        }

        loadThreadData()
    }, [bee, refHex])

    function onOpen() {
        if (!payload) return
        navigate(`/thread/${payload.reference}`)
    }

    function showProof() {
        if (!owner) return
        setShowProofModal(true)
    }

    if (!payload) {
        return <Spinner />
    }

    return (
        <>
            {showProofModal && owner && (
                <Modal title="Proof" onClose={() => setShowProofModal(false)}>
                    <ProofRow label="Signature" value={signature ?? ''} />
                    <ProofRow label="Owner" value={owner.toHex()} />
                    <ProofRow label="Previous" value={previous ?? ''} />
                    <ProofRow label="Reference" value={refHex} />
                    <ProofRow label="Digest" value={digest ?? ''} />
                </Modal>
            )}
            <div className="thread" style={activityStyle.borderStyle} onClick={onOpen}>
                <h2>{payload.title}</h2>
                <p className="thread-subtitle">{payload.body.slice(0, 120)}</p>
                <div className="thread-info">
                    <span className="post-count">
                        {postCount !== null ? `${postCount} post${postCount !== 1 ? 's' : ''}` : '...'}
                    </span>
                    {lastPostTime && (
                        <span
                            className="timestamp"
                            title={`Last post ${Dates.getTimeDelta(lastPostTime).toLowerCase()} ago`}
                        >
                            {`${Dates.getTimeDelta(lastPostTime).toLowerCase()} ago`}
                        </span>
                    )}
                    <p
                        className="proof-button"
                        style={{ marginLeft: 'auto' }}
                        onClick={e => {
                            e.stopPropagation()
                            showProof()
                        }}
                    >
                        Proof
                    </p>
                </div>
            </div>
        </>
    )
}
