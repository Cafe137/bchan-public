import { identicon } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { PrivateKey } from '@ethersphere/bee-js'
import { useMemo } from 'react'
import { getIdentityFromStorage, useIdentity } from '../IdentityContext'
import { Horizontal } from './Horizontal'
import { Section } from './Section'

// Kept for backward compatibility with existing code
export function getIdentity(): PrivateKey {
    const identity = getIdentityFromStorage()
    if (!identity) {
        throw Error('Invalid identity')
    }
    return identity
}

export function IdentitySection() {
    const { identity, importIdentity, regenerateIdentity } = useIdentity()

    const address = useMemo(() => {
        return identity ? identity.publicKey().address().toHex() : ''
    }, [identity])

    const avatar = useMemo(() => {
        if (!address) return null
        return createAvatar(identicon, {
            seed: address
        })
    }, [address])

    function onExport() {
        if (identity) {
            alert(identity.toHex())
        }
    }

    function onImport() {
        const key = prompt('Enter your private key')
        if (key) {
            importIdentity(key)
        }
    }

    function onRegenerate() {
        regenerateIdentity()
    }

    if (!identity) return null

    return (
        <Section title="Identity">
            <div className="section-body">
                <Horizontal>
                    {avatar && <img src={avatar.toDataUri()} className="avatar" width={80} />}
                    <p>{address}</p>
                </Horizontal>
            </div>
            <Horizontal gap={8} wrap>
                <button onClick={onExport} className="button-secondary">
                    Export
                </button>
                <button onClick={onImport} className="button-secondary">
                    Import
                </button>
                <button onClick={onRegenerate} className="button-secondary">
                    Regenerate
                </button>
            </Horizontal>
        </Section>
    )
}
