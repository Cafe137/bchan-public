import { Bee, NULL_ADDRESS, NULL_IDENTIFIER, Reference } from '@ethersphere/bee-js'
import { Binary } from 'cafe-utility'
import { DEFAULT_POST_BATCH_ID } from '../BatchContext'
import { WRITER } from '../Consensus'
import { getIdentityFromStorage } from '../IdentityContext'

export async function publishThread(
    bee: Bee,
    title: string,
    body: string,
    tip: Uint8Array | Reference,
    currentBatchId?: string
) {
    const identity = getIdentityFromStorage()
    if (!identity) {
        throw new Error('No valid identity found')
    }
    // Get postBatchId from localStorage if not provided directly
    const postBatchId =
        currentBatchId ||
        localStorage.getItem('postBatchId') ||
        localStorage.getItem('batchId') ||
        DEFAULT_POST_BATCH_ID

    const pieces = Binary.concatBytes(
        identity.publicKey().address().toUint8Array(),
        new Reference(tip).toUint8Array(),
        new TextEncoder().encode(JSON.stringify({ title, body }))
    )

    const signature = identity.sign(pieces)

    await bee.gsocSend(
        postBatchId,
        WRITER,
        NULL_ADDRESS,
        Binary.concatBytes(new Uint8Array([0x01]), signature.toUint8Array(), pieces)
    )
}

export async function publishPost(
    bee: Bee,
    thread: Uint8Array,
    tip: Uint8Array,
    message?: string,
    imageFile?: File,
    currentBatchId?: string,
    currentImageBatchId?: string
) {
    const identity = getIdentityFromStorage()
    if (!identity) {
        throw new Error('No valid identity found')
    }
    // Get postBatchId from localStorage if not provided directly
    const postBatchId =
        currentBatchId ||
        localStorage.getItem('postBatchId') ||
        localStorage.getItem('batchId') ||
        DEFAULT_POST_BATCH_ID
    // Get imageBatchId from localStorage if not provided directly
    const imageBatchId = currentImageBatchId || localStorage.getItem('imageBatchId') || postBatchId

    let imageReference = undefined

    // Upload image if provided
    if (imageFile) {
        try {
            const fileData = await imageFile.arrayBuffer()
            const uploadResult = await bee.uploadData(imageBatchId, new Uint8Array(fileData))
            imageReference = uploadResult.reference.toHex()
        } catch (error) {
            console.error('Failed to upload image:', error)
            throw new Error('Failed to upload image: ' + (error instanceof Error ? error.message : String(error)))
        }
    }

    const payload = JSON.stringify({ message, image: imageReference })

    const pieces = Binary.concatBytes(
        identity.publicKey().address().toUint8Array(),
        tip,
        thread,
        Binary.numberToUint64(BigInt(Date.now()), 'LE'),
        new TextEncoder().encode(payload)
    )
    const signature = identity.sign(pieces)

    await bee.gsocSend(
        postBatchId,
        WRITER,
        NULL_IDENTIFIER,
        Binary.concatBytes(new Uint8Array([0x00]), signature.toUint8Array(), pieces)
    )
}
