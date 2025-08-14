import { identicon } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { Bee, EthAddress, Reference } from '@ethersphere/bee-js'
import { Binary, Types, Uint8ArrayReader } from 'cafe-utility'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Horizontal } from './Horizontal'
import { Spinner } from './Spinner'

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

    if (!owner) {
        return <Spinner depth={1} />
    }

    const avatar = createAvatar(identicon, {
        seed: owner.toHex()
    })

    function onImageClick() {
        if (!image) {
            return
        }
        window.open(image, '_blank')
    }

    function showProof() {
        if (!owner) {
            return
        }
        Swal.fire({
            title: 'Proof',
            html: `<p><strong>Signature</strong></p>
<p>${signature}</p>
<p><strong>Owner</strong></p>
<p>${owner.toHex()}</p>
<p><strong>Previous</strong></p>
<p>${previous}</p>
<p><strong>Thread</strong></p>
<p>${thread}</p>
<p><strong>Timestamp</strong></p>
<p>${timestamp}</p>
<p><strong>Reference</strong></p>
<p>${reference.toHex()}</p>
<p><strong>Digest</strong></p>
<p>${digest}</p>`
        })
    }

    return (
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
                    {image && <img onClick={onImageClick} src={image} />}
                </div>
            </Horizontal>
        </div>
    )
}
