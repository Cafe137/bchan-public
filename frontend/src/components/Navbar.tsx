import { identicon } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '../IdentityContext'

export function Navbar() {
    const navigate = useNavigate()
    const { identity } = useIdentity()

    const identityAddress = identity ? identity.publicKey().address().toHex() : ''
    const shortenedIdentity = identityAddress ? identityAddress.substring(0, 8) + '...' : ''

    const avatar = createAvatar(identicon, {
        seed: identityAddress || 'default'
    })

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="navbar-logo">
                    beechan.eth.limo
                </Link>
            </div>
            <div className="navbar-menu">
                {/* "All Threads" link removed as it's redundant with the "bchan" logo navigation */}
            </div>
            {identity && (
                <div className="navbar-identity" onClick={() => navigate('/settings')}>
                    <img src={avatar.toDataUri()} className="navbar-avatar" width={24} height={24} />
                    <span className="navbar-identity-text">{shortenedIdentity}</span>
                </div>
            )}
        </nav>
    )
}
