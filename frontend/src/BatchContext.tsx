import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

// Default batch IDs
export const DEFAULT_POST_BATCH_ID = '8177f28f11ca4a8e6488e1375cd9234b28354f49e630e51a632a3446805cc699'
export const DEFAULT_IMAGE_BATCH_ID = '8177f28f11ca4a8e6488e1375cd9234b28354f49e630e51a632a3446805cc699'

// Interface for the BatchID context
interface BatchIDContextType {
    postBatchId: string
    setPostBatchId: (id: string) => void
    resetPostBatchId: () => void
    imageBatchId: string
    setImageBatchId: (id: string) => void
    resetImageBatchId: () => void
}

// Create the context with default values
const BatchIDContext = createContext<BatchIDContextType>({
    postBatchId: DEFAULT_POST_BATCH_ID,
    setPostBatchId: () => {},
    resetPostBatchId: () => {},
    imageBatchId: DEFAULT_IMAGE_BATCH_ID,
    setImageBatchId: () => {},
    resetImageBatchId: () => {}
})

// Custom hook for using the BatchID context
export const useBatchId = () => useContext(BatchIDContext)

// Provider component for BatchID
export function BatchIDProvider({ children }: { children: ReactNode }) {
    const [postBatchId, setPostBatchIdState] = useState<string>(() => {
        // For backward compatibility, first check the old key
        const legacyBatchId = localStorage.getItem('batchId')
        if (legacyBatchId) {
            // Migrate the old value to the new key
            localStorage.setItem('postBatchId', legacyBatchId)
            // Remove the old key
            localStorage.removeItem('batchId')
            return legacyBatchId
        }
        // Try to restore post batch ID from local storage
        const savedPostBatchId = localStorage.getItem('postBatchId')
        return savedPostBatchId || DEFAULT_POST_BATCH_ID
    })

    const [imageBatchId, setImageBatchIdState] = useState<string>(() => {
        // Try to restore image batch ID from local storage
        const savedImageBatchId = localStorage.getItem('imageBatchId')
        return savedImageBatchId || DEFAULT_IMAGE_BATCH_ID
    })

    // Save batch IDs to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('postBatchId', postBatchId)
    }, [postBatchId])

    useEffect(() => {
        localStorage.setItem('imageBatchId', imageBatchId)
    }, [imageBatchId])

    // Set new batch IDs
    const setPostBatchId = (newBatchId: string) => {
        setPostBatchIdState(newBatchId)
    }

    const setImageBatchId = (newBatchId: string) => {
        setImageBatchIdState(newBatchId)
    }

    // Reset to default batch IDs
    const resetPostBatchId = () => {
        setPostBatchIdState(DEFAULT_POST_BATCH_ID)
    }

    const resetImageBatchId = () => {
        setImageBatchIdState(DEFAULT_IMAGE_BATCH_ID)
    }

    return (
        <BatchIDContext.Provider
            value={{
                postBatchId,
                setPostBatchId,
                resetPostBatchId,
                imageBatchId,
                setImageBatchId,
                resetImageBatchId
            }}
        >
            {children}
        </BatchIDContext.Provider>
    )
}
