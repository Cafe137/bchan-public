import { useEffect, useState } from 'react'
import { DEFAULT_IMAGE_BATCH_ID, DEFAULT_POST_BATCH_ID, useBatchId } from '../BatchContext'
import './BatchIDSettings.css'
import { Horizontal } from './Horizontal'
import { InputGroup } from './InputGroup'
import { Section } from './Section'

export function BatchIDSettings() {
    const { postBatchId, setPostBatchId, imageBatchId, setImageBatchId } = useBatchId()
    const [postBatchIdInput, setPostBatchIdInput] = useState<string>(postBatchId)
    const [imageBatchIdInput, setImageBatchIdInput] = useState<string>(imageBatchId)
    const [postError, setPostError] = useState<string | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)

    // Initialize inputs from current batch IDs
    useEffect(() => {
        setPostBatchIdInput(postBatchId)
    }, [postBatchId])

    useEffect(() => {
        setImageBatchIdInput(imageBatchId)
    }, [imageBatchId])

    function validateBatchId(id: string): boolean {
        // Check if the ID is a valid hex string of the right length
        const hexRegex = /^[0-9a-fA-F]{64}$/
        return hexRegex.test(id)
    }

    function onSavePostBatchId() {
        if (!postBatchIdInput.trim()) {
            setPostError('Please enter a valid batch ID')
            return
        }

        if (!validateBatchId(postBatchIdInput)) {
            setPostError('Batch ID must be a valid 64-character hexadecimal string')
            return
        }

        setPostBatchId(postBatchIdInput)
        setPostError(null)
    }

    function onSaveImageBatchId() {
        if (!imageBatchIdInput.trim()) {
            setImageError('Please enter a valid batch ID')
            return
        }

        if (!validateBatchId(imageBatchIdInput)) {
            setImageError('Batch ID must be a valid 64-character hexadecimal string')
            return
        }

        setImageBatchId(imageBatchIdInput)
        setImageError(null)
    }

    function onResetPostBatchId() {
        setPostBatchIdInput(DEFAULT_POST_BATCH_ID)
        setPostError(null)
    }

    function onResetImageBatchId() {
        setImageBatchIdInput(DEFAULT_IMAGE_BATCH_ID)
        setImageError(null)
    }

    return (
        <Section title="Postage Batch IDs">
            <div className="section-body">
                <p>Configure separate postage batch IDs for posts and images.</p>

                <InputGroup label="Post Batch ID">
                    <p className="description-text">Used for publishing threads and posts to the Swarm network.</p>
                    <input
                        type="text"
                        value={postBatchIdInput}
                        onChange={e => {
                            setPostBatchIdInput(e.target.value)
                            setPostError(null)
                        }}
                        placeholder="Enter post batch ID"
                    />
                </InputGroup>

                {postError && <p className="error-message">{postError}</p>}

                <Horizontal gap={8} wrap>
                    <button
                        onClick={onSavePostBatchId}
                        className="button-primary"
                        disabled={!postBatchIdInput.trim() || postBatchIdInput === postBatchId}
                    >
                        Save Post Batch ID
                    </button>
                    <button onClick={onResetPostBatchId} className="button-secondary">
                        Reset to Default
                    </button>
                </Horizontal>

                <div className="divider"></div>

                <InputGroup label="Image Batch ID">
                    <p className="description-text">Used for uploading images to the Swarm network.</p>
                    <input
                        type="text"
                        value={imageBatchIdInput}
                        onChange={e => {
                            setImageBatchIdInput(e.target.value)
                            setImageError(null)
                        }}
                        placeholder="Enter image batch ID"
                    />
                </InputGroup>

                {imageError && <p className="error-message">{imageError}</p>}

                <Horizontal gap={8} wrap>
                    <button
                        onClick={onSaveImageBatchId}
                        className="button-primary"
                        disabled={!imageBatchIdInput.trim() || imageBatchIdInput === imageBatchId}
                    >
                        Save Image Batch ID
                    </button>
                    <button onClick={onResetImageBatchId} className="button-secondary">
                        Reset to Default
                    </button>
                </Horizontal>
            </div>
        </Section>
    )
}
