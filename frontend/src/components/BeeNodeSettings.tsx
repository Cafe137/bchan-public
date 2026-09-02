import { Bee } from '@ethersphere/bee-js'
import { useEffect, useState } from 'react'
import { useBee } from '../App'
import { Horizontal } from './Horizontal'
import { InputGroup } from './InputGroup'
import { Section } from './Section'

// Default Bee node URL
export const DEFAULT_BEE_URL = 'https://bzz.limo'

export function BeeNodeSettings() {
    const { bee, setBee } = useBee()
    const [url, setUrl] = useState<string>('')
    const [isValidating, setIsValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

    // Initialize URL from current bee instance
    useEffect(() => {
        if (bee) {
            setUrl(bee.url)
            checkConnection(bee.url)
        } else {
            setUrl(DEFAULT_BEE_URL)
            checkConnection(DEFAULT_BEE_URL)
        }
    }, [bee])

    async function checkConnection(urlToCheck: string) {
        setConnectionStatus('checking')
        try {
            const testBee = new Bee(urlToCheck)
            await testBee.connectivity.checkConnection()
            setConnectionStatus('connected')
            return true
        } catch (err) {
            console.error('Connection check failed:', err)
            setConnectionStatus('disconnected')
            return false
        }
    }

    async function onSave() {
        if (!url.trim()) {
            setError('Please enter a valid Bee node URL')
            return
        }

        setIsValidating(true)
        setError(null)

        try {
            const isConnected = await checkConnection(url)

            if (isConnected) {
                const newBee = new Bee(url)
                setBee(newBee)
                setError(null)
            } else {
                setError('Failed to connect to Bee node. Please check the URL and try again.')
            }
        } catch (err) {
            console.error('Failed to connect to Bee node:', err)
            setError('Failed to connect to Bee node. Please check the URL and try again.')
        } finally {
            setIsValidating(false)
        }
    }

    function onReset() {
        setUrl(DEFAULT_BEE_URL)
        setError(null)
    }

    return (
        <Section title="Bee Node Connection">
            <div className="section-body">
                <p>
                    Current connection status:
                    <span className={`connection-status ${connectionStatus}`}>
                        {connectionStatus === 'checking'
                            ? 'Checking...'
                            : connectionStatus === 'connected'
                            ? 'Connected'
                            : 'Disconnected'}
                    </span>
                </p>

                <InputGroup label="Bee node URL">
                    <input
                        type="text"
                        value={url}
                        onChange={e => {
                            setUrl(e.target.value)
                            setError(null)
                        }}
                        placeholder="Enter your Bee node URL"
                    />
                </InputGroup>

                {error && <p className="error-message">{error}</p>}

                <Horizontal gap={8} wrap>
                    <button onClick={onSave} disabled={isValidating || !url.trim()} className="button-primary">
                        {isValidating ? 'Connecting...' : 'Save Connection'}
                    </button>
                    <button onClick={onReset} className="button-secondary">
                        Reset to Default
                    </button>
                </Horizontal>
            </div>
        </Section>
    )
}
