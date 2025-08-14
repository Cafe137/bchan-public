import { Link } from 'react-router-dom'
import { Section } from '../components/Section'
import { MainLayout } from '../layouts/MainLayout'

export function NotFoundPage() {
    return (
        <MainLayout title="Page Not Found">
            <Section title="404 - Page Not Found">
                <div className="not-found-container">
                    <h2>Oops! The page you're looking for doesn't exist.</h2>
                    <p>It seems like you've reached a URL that doesn't exist on our site.</p>
                    <div className="not-found-actions">
                        <Link to="/" className="button">
                            Go to Home
                        </Link>
                        <Link to="/threads" className="button">
                            Browse Threads
                        </Link>
                    </div>
                </div>
            </Section>
        </MainLayout>
    )
}
