import { NULL_ADDRESS, Reference, Topic } from '@ethersphere/bee-js'
import { Binary, Dates, System, Types } from 'cafe-utility'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBee } from '../App'
import { useBatchId } from '../BatchContext'
import { Countdown } from '../components/Countdown'
import { InputGroup } from '../components/InputGroup'
import { Post } from '../components/Post'
import { Section } from '../components/Section'
import { Spinner } from '../components/Spinner'
import { getThreadIdentiferWord } from '../Consensus'
import { MainLayout } from '../layouts/MainLayout'
import { publishPost } from '../service/Publisher'
import { ThreadMetadata } from '../Thread'
import { useToast } from '../ToastContext'

export function ThreadPage() {
    const { bee } = useBee()
    const { postBatchId, imageBatchId } = useBatchId()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [threadData, setThreadData] = useState<ThreadMetadata | null>(null)
    const [nextRefreshAt, setNextRefreshAt] = useState<Date>(new Date(Date.now() + Dates.seconds(10)))
    const [newPostText, setNewPostText] = useState<string>('')
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messageInputRef = useRef<HTMLTextAreaElement>(null)
    const [posts, setPosts] = useState<Reference[] | null>(null)
    const [resetCounter, setResetCounter] = useState(0)
    const [showPostForm, setShowPostForm] = useState<boolean>(false)
    const [uploading, setUploading] = useState<boolean>(false)

    useEffect(() => {
        let cancelled = false
        setThreadData(null)

        async function loadThread() {
            if (!id) {
                console.error('No thread ID provided')
                navigate('/threads')
                return
            }

            if (!bee) {
                console.error('No Bee instance available')
                navigate('/')
                return
            }

            try {
                const reference = new Reference(id)
                const result = await bee.downloadData(reference)

                const payload = new TextDecoder().decode(result.toUint8Array().slice(65 + 20 + 32))
                const json = Types.asObject(JSON.parse(payload))

                if (!cancelled) {
                    setThreadData({
                        reference: id,
                        title: Types.asString(json.title),
                        body: Types.asString(json.body)
                    })
                }
            } catch (error) {
                console.error('Failed to load thread:', error)
                if (!cancelled) {
                    navigate('/threads')
                }
            }
        }

        loadThread()
        return () => { cancelled = true }
    }, [id, bee, navigate])

    useEffect(() => {
        if (!threadData || !bee) return

        async function initialize() {
            setNextRefreshAt(new Date(Date.now() + Dates.seconds(10)))
            try {
                if (!bee || !threadData) return

                const feedReader = bee.makeFeedReader(
                    Topic.fromString(getThreadIdentiferWord(threadData.reference)),
                    'bc322a23377d4f71e7aa41d303b2391cb28c937c'
                )
                const result = await feedReader.downloadPayload()
                setPosts(
                    Binary.partition(result.payload.toUint8Array(), 32)
                        .map(x => new Reference(x))
                        .filter(x => !x.equals(NULL_ADDRESS))
                )
            } catch (error) {
                console.error('Failed to load thread posts:', error)
                setPosts([])
            }
        }

        return System.runAndSetInterval(initialize, Dates.seconds(10))
    }, [threadData, bee])

    async function handleSubmit() {
        if (!posts) {
            showToast('Posts have not been loaded yet', 'error')
            return
        }

        if (!newPostText && !selectedImage) {
            showToast('Please write a post or upload an image', 'error')
            return
        }

        if (!bee) {
            showToast('No Bee instance available', 'error')
            navigate('/')
            return
        }

        try {
            setUploading(true)
            await publishPost(
                bee,
                threadData ? Binary.hexToUint8Array(threadData.reference) : new Uint8Array(),
                posts && posts.length > 0 ? posts[0].toUint8Array() : NULL_ADDRESS,
                newPostText,
                selectedImage || undefined,
                postBatchId,
                imageBatchId
            )

            showToast('Your post will be visible in the feed shortly', 'success')

            setNewPostText('')
            setSelectedImage(null)
            setImagePreview(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            setResetCounter(x => x + 1)
            setShowPostForm(false)
        } catch (error) {
            console.error(error)
            showToast('Failed to publish the post, check console for more details', 'error')
        } finally {
            setUploading(false)
        }
    }

    if (!threadData) {
        return (
            <MainLayout title="Loading Thread...">
                <Spinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title={threadData.title}
            mainAction={{
                label: showPostForm ? 'Hide' : 'Post Reply',
                onClick: () => {
                    const newState = !showPostForm
                    setShowPostForm(newState)
                    if (newState) {
                        // Focus the message input when form is opened
                        setTimeout(() => {
                            messageInputRef.current?.focus()
                        }, 0)
                    }
                }
            }}
        >
            {showPostForm && (
                <Section title="Post">
                    <div className="section-body">
                        <InputGroup label="Message (optional)">
                            <textarea
                                placeholder="Write your post here"
                                value={newPostText}
                                onChange={e => setNewPostText(e.target.value)}
                                ref={messageInputRef}
                            />
                        </InputGroup>
                        <InputGroup label="Image (optional; needs local Bee)">
                            <input
                                key={`image-${resetCounter}`}
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="borderless"
                                onChange={e => {
                                    const file = e.target.files?.[0] || null
                                    setSelectedImage(file)

                                    if (file) {
                                        const reader = new FileReader()
                                        reader.onloadend = () => {
                                            setImagePreview(reader.result as string)
                                        }
                                        reader.readAsDataURL(file)
                                    } else {
                                        setImagePreview(null)
                                    }
                                }}
                            />
                            {imagePreview && (
                                <div className="image-preview">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }}
                                    />
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null)
                                            setImagePreview(null)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = ''
                                            }
                                        }}
                                        className="button-secondary"
                                        style={{ marginTop: '5px' }}
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </InputGroup>
                        <button onClick={handleSubmit} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Submit'}
                        </button>
                    </div>
                </Section>
            )}
            <Section title="Original Post">
                <p>{threadData.body}</p>
            </Section>

            {posts && !posts.length ? <p>Be the first to post here!</p> : null}
            {posts && bee ? posts.map(post => <Post key={post.toHex()} bee={bee} reference={post} />) : <Spinner />}
            <Countdown target={nextRefreshAt} prefix="Refreshing in" />
        </MainLayout>
    )
}
