import { BatchIDSettings } from '../components/BatchIDSettings'
import { BeeNodeSettings } from '../components/BeeNodeSettings'
import { IdentitySection } from '../components/IdentitySection'
import { MainLayout } from '../layouts/MainLayout'

export function SettingsPage() {
    return (
        <MainLayout title="Settings">
            <div className="settings-page">
                <IdentitySection />
                <BeeNodeSettings />
                <BatchIDSettings />
            </div>
        </MainLayout>
    )
}
