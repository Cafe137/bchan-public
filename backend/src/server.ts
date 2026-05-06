import { Bytes, EthAddress, NULL_ADDRESS, PrivateKey, Reference, Signature } from '@ethersphere/bee-js'
import { Binary, Dates, Types, Uint8ArrayReader } from 'cafe-utility'
import { backupPost, backupThread } from './backup'
import { bee } from './bee'
import { getConsensualPrivateKey, MB_SIGNER, MB_STAMP } from './key'
import { acquireLock, unlock } from './lock'
import { log } from './logger'
import { addPost, addThread, getPostTip, getThreadTip } from './memory'
import { publishPosts } from './publisher'

let connectedToBee = false

export function isConnectedToBee(): boolean {
    return connectedToBee
}

export async function runServer() {
    const key = await getConsensualPrivateKey()
    log(`Consensual private key for publishing messages: ${key.toHex()}`)
    log(`Ethereum address for reading feeds: ${new PrivateKey(MB_SIGNER).publicKey().address()}`)
    subscribe(key.publicKey().address())
}

function subscribe(address: EthAddress) {
    try {
        bee.gsocSubscribe(address, NULL_ADDRESS, {
            onMessage: message => {
                safeHandleMessage(message)
            },
            onError: error => {
                console.error(error)
            },
            onClose: () => {
                connectedToBee = false
                log('Connection to Bee closed, retrying in 5 seconds...')
                setTimeout(() => subscribe(address), 5000)
            }
        })
        connectedToBee = true
    } catch (error) {
        connectedToBee = false
        log('Failed to connect to Bee, retrying in 5 seconds...')
        setTimeout(() => subscribe(address), 5000)
    }
}

async function safeHandleMessage(message: Bytes) {
    await acquireLock()
    try {
        await handleMessage(message)
    } catch (error) {
        console.error(error)
    }
    unlock()
}

async function handleMessage(message: Bytes) {
    log('Handling message...')
    const reader = new Uint8ArrayReader(message.toUint8Array())
    const opcode = reader.read(1)
    if (opcode[0] === 0x00) {
        await handlePost(reader, message.toUint8Array().slice(1))
    } else if (opcode[0] === 0x01) {
        await handleThread(reader, message.toUint8Array().slice(1))
    }
}

async function handlePost(reader: Uint8ArrayReader, message: Uint8Array) {
    const signature = new Signature(reader.read(65))
    const owner = new EthAddress(reader.read(20))
    const previousHash = reader.read(32)
    const threadReference = reader.read(32)
    const timestampBytes = reader.read(64)

    const publicKey = signature.recoverPublicKey(message.slice(65))
    if (!Binary.equals(publicKey.address().toUint8Array(), owner.toUint8Array())) {
        throw Error('Invalid signature')
    }

    const currentHash = getPostTip(Binary.uint8ArrayToHex(threadReference))

    log(`Current hash: ${Binary.uint8ArrayToHex(currentHash)}`)

    if (!Binary.equals(previousHash, currentHash)) {
        throw Error('Not a consecutive message')
    }

    const timestamp = Binary.uint64ToNumber(timestampBytes, 'LE')
    if (timestamp > Date.now() || timestamp < Date.now() - Dates.minutes(1)) {
        throw Error('Invalid timestamp')
    }

    const payload = new TextDecoder().decode(message.slice(65 + 20 + 32 + 32 + 8))
    const json = Types.asObject(JSON.parse(payload))

    if (!json.message && !json.image) {
        throw Error('Empty post')
    }

    const post = await bee.uploadData(MB_STAMP, message)
    addPost(new Reference(threadReference), post.reference)
    backupPost(new Reference(threadReference), post.reference, message)

    await publishPosts()
}

async function handleThread(reader: Uint8ArrayReader, message: Uint8Array) {
    const signature = new Signature(reader.read(65))
    const owner = new EthAddress(reader.read(20))
    const previousHash = reader.read(32)

    const publicKey = signature.recoverPublicKey(message.slice(65))
    if (!Binary.equals(publicKey.address().toUint8Array(), owner.toUint8Array())) {
        throw Error('Invalid signature')
    }

    const currentHash = getThreadTip()
    if (!Binary.equals(previousHash, currentHash)) {
        throw Error('Not a consecutive thread')
    }

    const payload = new TextDecoder().decode(message.slice(65 + 20 + 32))
    const json = Types.asObject(JSON.parse(payload))

    if (!json.title || !json.body) {
        throw Error('Invalid thread')
    }

    const thread = await bee.uploadData(MB_STAMP, message)
    addThread(thread.reference)
    backupThread(thread.reference, message)

    await publishPosts()
}
