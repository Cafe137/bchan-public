import { PrivateKey } from '@ethersphere/bee-js'
import { Strings } from 'cafe-utility'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

// Interface for the IdentityContext
interface IdentityContextType {
    identity: PrivateKey | null
    setIdentity: (identity: PrivateKey) => void
    resetIdentity: () => void
    regenerateIdentity: () => void
    importIdentity: (key: string) => boolean
}

// Create the context with default values
const IdentityContext = createContext<IdentityContextType>({
    identity: null,
    setIdentity: () => {},
    resetIdentity: () => {},
    regenerateIdentity: () => {},
    importIdentity: () => false
})

// Custom hook for using the Identity context
export const useIdentity = () => useContext(IdentityContext)

// Helper function to get identity from localStorage
export function getIdentityFromStorage(): PrivateKey | null {
    try {
        const storedIdentity = localStorage.getItem('identity')

        if (!storedIdentity) {
            const newIdentity = new PrivateKey(Strings.randomHex(64))
            localStorage.setItem('identity', newIdentity.toHex())
            return newIdentity
        }

        return new PrivateKey(storedIdentity)
    } catch {
        localStorage.removeItem('identity')
        return null
    }
}

// Provider component for Identity
export function IdentityProvider({ children }: { children: ReactNode }) {
    const [identity, setIdentityState] = useState<PrivateKey | null>(() => {
        return getIdentityFromStorage()
    })

    // Set identity and save to localStorage
    const setIdentity = (newIdentity: PrivateKey) => {
        setIdentityState(newIdentity)
        localStorage.setItem('identity', newIdentity.toHex())
    }

    // Reset identity (clear from localStorage)
    const resetIdentity = () => {
        localStorage.removeItem('identity')
        setIdentityState(null)
    }

    // Generate a new random identity
    const regenerateIdentity = () => {
        const key = Strings.randomHex(64)
        try {
            const newIdentity = new PrivateKey(key)
            setIdentity(newIdentity)
            return true
        } catch {
            return false
        }
    }

    // Import identity from a provided key
    const importIdentity = (key: string): boolean => {
        try {
            const newIdentity = new PrivateKey(key)
            setIdentity(newIdentity)
            return true
        } catch {
            return false
        }
    }

    // If identity is null after initial load, try to create a new one
    useEffect(() => {
        if (!identity) {
            regenerateIdentity()
        }
    }, [identity, regenerateIdentity])

    return (
        <IdentityContext.Provider
            value={{
                identity,
                setIdentity,
                resetIdentity,
                regenerateIdentity,
                importIdentity
            }}
        >
            {children}
        </IdentityContext.Provider>
    )
}
