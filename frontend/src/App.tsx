import { Bee } from '@ethersphere/bee-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BatchIDProvider } from './BatchContext'
import { IdentityProvider } from './IdentityContext'
import { ToastProvider } from './ToastContext'
import { DEFAULT_BEE_URL } from './components/BeeNodeSettings'
import { BoardPage } from './pages/BoardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { ThreadPage } from './pages/ThreadPage'

// Create a context for Bee instance to be accessible throughout the app
interface BeeContextType {
    bee: Bee | null
    setBee: (bee: Bee) => void
    resetBee: () => void
}

const BeeContext = createContext<BeeContextType>({
    bee: null,
    setBee: () => {},
    resetBee: () => {}
})

// Custom hook to use the bee context
export const useBee = () => useContext(BeeContext)

// ScrollToTop component to ensure page scrolls to top on navigation
function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

// Using DEFAULT_BEE_URL imported from BeeNodeSettings

// BeeProvider component - handles Bee instance management
function BeeProvider({ children }: { children: React.ReactNode }) {
    const [bee, setBeeState] = useState<Bee | null>(() => {
        // Try to restore Bee URL from session storage on app load
        const savedUrl = sessionStorage.getItem('beeUrl') || DEFAULT_BEE_URL
        try {
            return new Bee(savedUrl)
        } catch (err) {
            console.error('Failed to create Bee instance with URL:', savedUrl, err)
            return new Bee(DEFAULT_BEE_URL)
        }
    })

    // Save Bee URL to session storage whenever it changes
    const setBee = (newBee: Bee) => {
        setBeeState(newBee)
        sessionStorage.setItem('beeUrl', newBee.url)
    }

    const resetBee = () => {
        try {
            const defaultBee = new Bee(DEFAULT_BEE_URL)
            setBeeState(defaultBee)
            sessionStorage.setItem('beeUrl', DEFAULT_BEE_URL)
        } catch (err) {
            console.error('Failed to reset Bee instance:', err)
        }
    }

    return <BeeContext.Provider value={{ bee, setBee, resetBee }}>{children}</BeeContext.Provider>
}

// ProtectedRoute component - checks Bee connection and redirects to settings if needed
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { bee } = useBee()
    const navigate = useNavigate()

    useEffect(() => {
        async function checkConnection() {
            if (!bee) return false

            try {
                await bee.connectivity.checkConnection()
                return true
            } catch (err) {
                console.error('Bee connection check failed:', err)
                return false
            }
        }

        checkConnection().then(isConnected => {
            if (!isConnected) {
                navigate('/settings')
            }
        })
    }, [bee, navigate])

    if (!bee) return null

    return <>{children}</>
}

export function App() {
    return (
        <ToastProvider>
        <HashRouter>
            <BeeProvider>
                <BatchIDProvider>
                    <IdentityProvider>
                        <ScrollToTop />
                        <Routes>
                            <Route path="/" element={<BoardPage />} />
                            <Route
                                path="/threads"
                                element={
                                    <ProtectedRoute>
                                        <BoardPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/thread/:id"
                                element={
                                    <ProtectedRoute>
                                        <ThreadPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <SettingsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </IdentityProvider>
                </BatchIDProvider>
            </BeeProvider>
        </HashRouter>
        </ToastProvider>
    )
}
