import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
    title: string
    onClose: () => void
    children: React.ReactNode
}

export function Modal({ title, onClose, children }: Props) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>,
        document.body
    )
}

interface ProofRowProps {
    label: string
    value: string
}

export function ProofRow({ label, value }: ProofRowProps) {
    return (
        <div className="proof-row">
            <span className="proof-label">{label}</span>
            <span className="proof-value">{value}</span>
        </div>
    )
}
