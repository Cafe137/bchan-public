import { Bee } from '@ethersphere/bee-js'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBee } from '../App'
import { DEFAULT_BEE_URL } from '../components/BeeNodeSettings'
import { InputGroup } from '../components/InputGroup'
import { Section } from '../components/Section'
import { MainLayout } from '../layouts/MainLayout'

export function HomePage() {
    const { bee, setBee } = useBee()
    const [url, setUrl] = useState(DEFAULT_BEE_URL)
    const [isValidating, setIsValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    // If we already have a bee instance, redirect to threads
    useEffect(() => {
        if (bee) {
            navigate('/threads')
        }
    }, [bee, navigate])

    async function onProceed() {
        if (!url.trim()) {
            setError('Please enter a valid Bee node URL')
            return
        }

        setIsValidating(true)
        setError(null)

        try {
            const bee = new Bee(url)
            // Validate connection by making a simple API call
            await bee.connectivity.checkConnection()
            setBee(bee)
            navigate('/threads')
        } catch (err) {
            console.error('Failed to connect to Bee node:', err)
            setError('Failed to connect to Bee node. Please check the URL and try again.')
        } finally {
            setIsValidating(false)
        }
    }

    return (
        <MainLayout showNavigation={false}>
            <div className="welcome-header">
                <h1>bChan</h1>
            </div>
            <Section title="Connect to Swarm">
                <p>
                    A default connection to {DEFAULT_BEE_URL} has been configured. You can use this page to connect to a
                    different Bee node if needed.
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
                <button onClick={onProceed} disabled={isValidating || !url.trim()}>
                    {isValidating ? 'Connecting...' : 'Connect and Proceed'}
                </button>
            </Section>
        </MainLayout>
    )
}
