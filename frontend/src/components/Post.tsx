import { identicon } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { Bee, EthAddress, Reference } from '@ethersphere/bee-js'
import { Binary, Types, Uint8ArrayReader } from 'cafe-utility'
import { useEffect, useState } from 'react'
import { Horizontal } from './Horizontal'
import { Modal, ProofRow } from './Modal'
import { Spinner } from './Spinner'
import { createPortal } from 'react-dom'

interface Props {
    bee: Bee
    reference: Reference
}

export function Post({ bee, reference }: Props) {
    const [digest, setDigest] = useState<string | null>(null)
    const [signature, setSignature] = useState<string | null>(null)
    const [previous, setPrevious] = useState<string | null>(null)
    const [owner, setOwner] = useState<EthAddress | null>(null)
    const [thread, setThread] = useState<string | null>(null)
    const [timestamp, setTimestamp] = useState<BigInt | null>(null)
    const [text, setText] = useState<string | null>(null)
    const [image, setImage] = useState<string | null>(null)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [showProofModal, setShowProofModal] = useState(false)

    useEffect(() => {
        async function initialize() {
            const result = await bee.downloadData(reference)
            setDigest(Binary.uint8ArrayToHex(result.toUint8Array().slice(65)))
            const reader = new Uint8ArrayReader(result.toUint8Array())
            setSignature(Binary.uint8ArrayToHex(reader.read(65)))
            setOwner(new EthAddress(reader.read(20)))
            setPrevious(Binary.uint8ArrayToHex(reader.read(32)))
            setThread(Binary.uint8ArrayToHex(reader.read(32)))
            setTimestamp(Binary.uint64ToNumber(reader.read(64), 'LE'))
            const payload = new TextDecoder().decode(result.toUint8Array().slice(65 + 32 + 32 + 20 + 8))
            const json = Types.asObject(JSON.parse(payload))
            if (json.message) {
                setText(Types.asString(json.message))
            }
            if (json.image) {
                setImage(`${bee.url}/bytes/${json.image}`)
            }
        }

        initialize()
    }, [reference])

    useEffect(() => {
        if (!lightboxOpen) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setLightboxOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [lightboxOpen])

    if (!owner) {
        return <Spinner />
    }

    const avatar = createAvatar(identicon, {
        seed: owner.toHex()
    })

    function onImageClick() {
        if (!image) return
        setLightboxOpen(true)
    }

    function showProof() {
        if (!owner) return
        setShowProofModal(true)
    }

    return (
        <>
        {showProofModal && owner && (
            <Modal title="Proof" onClose={() => setShowProofModal(false)}>
                <ProofRow label="Signature" value={signature ?? ''} />
                <ProofRow label="Owner" value={owner.toHex()} />
                <ProofRow label="Previous" value={previous ?? ''} />
                <ProofRow label="Thread" value={thread ?? ''} />
                <ProofRow label="Timestamp" value={String(timestamp)} />
                <ProofRow label="Reference" value={reference.toHex()} />
                <ProofRow label="Digest" value={digest ?? ''} />
            </Modal>
        )}
        <div className="post">
            <Horizontal top>
                <div style={{ flexShrink: 0 }}>
                    <img src={avatar.toDataUri()} className="avatar" width={40} />
                </div>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'center'
                        }}
                    >
                        <p
                            style={{
                                marginRight: '8px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            <strong>{owner.toHex().slice(0, 8)}</strong>
                        </p>
                        <p
                            className="proof-button"
                            onClick={showProof}
                            style={{
                                whiteSpace: 'nowrap',
                                marginRight: '8px'
                            }}
                        >
                            Proof
                        </p>
                        {timestamp && (
                            <p
                                className="timestamp"
                                style={{
                                    whiteSpace: 'normal',
                                    wordBreak: 'normal',
                                    hyphens: 'auto'
                                }}
                            >
                                <strong>{new Date(Number(timestamp)).toLocaleString()}</strong>
                            </p>
                        )}
                    </div>
                    {text &&
                        text.split('\n').map((line, index) => (
                            <p
                                className={line.startsWith('>') ? 'greentext' : undefined}
                                key={index}
                                style={{ wordBreak: 'break-word' }}
                            >
                                {line}
                            </p>
                        ))}
                    {image && <img onClick={onImageClick} src={image} style={{ cursor: 'zoom-in' }} />}
                </div>
            </Horizontal>
            {lightboxOpen && image && createPortal(
                <div className="lightbox" onClick={() => setLightboxOpen(false)}>
                    <img src={image} alt="" onClick={e => e.stopPropagation()} />
                </div>,
                document.body
            )}
        </div>
        </>
    )
}
