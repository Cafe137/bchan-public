import React, { useEffect } from 'react'
import { Navbar } from '../components/Navbar'

interface MainLayoutProps {
    children: React.ReactNode
    showNavigation?: boolean
    title?: string
    mainAction?: {
        label: string
        onClick: () => void
    }
}

export function MainLayout({ children, showNavigation = true, title = 'bchan', mainAction }: MainLayoutProps) {
    // Set page title
    useEffect(() => {
        document.title = `${title} | bchan`
        return () => {
            document.title = 'bchan'
        }
    }, [title])

    return (
        <div className="main-layout">
            {showNavigation && <Navbar />}

            {showNavigation && (
                <div className="navigation-header">
                    <h1>{title}</h1>
                    {mainAction && (
                        <button onClick={mainAction.onClick} className="main-action-button">
                            {mainAction.label}
                        </button>
                    )}
                </div>
            )}

            <div className="main-content">{children}</div>
        </div>
    )
}
