import { KeyRound, LockKeyhole, UserRound } from 'lucide-react'
import { NavLink, Navigate, useParams } from 'react-router'
import { PageHeader, PageShell, SplitWorkspace, SurfaceCard } from '../../shared'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { ProfileSettings } from './ProfileSettings'
import { SecuritySettings } from './SecuritySettings'
import { TokenSettings } from './TokenSettings'

type SettingsSection = 'profile' | 'security' | 'tokens'

const sections: Array<{ id: SettingsSection; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: '个人资料', icon: UserRound },
  { id: 'security', label: '账户安全', icon: LockKeyhole },
  { id: 'tokens', label: 'API Token', icon: KeyRound },
]

export function SettingsPage() {
  const { section = 'profile' } = useParams()
  const validSection = sections.some((item) => item.id === section) ? (section as SettingsSection) : null
  useVNextPageTitle('账户设置')

  if (!validSection) return <Navigate replace to="/settings/profile" />

  return (
    <PageShell>
      <PageHeader title="账户设置" />
      <SplitWorkspace
        asidePosition="left"
        asideWidth="narrow"
        mobileAsideFirst
        aside={
          <SegmentedControl activeKey={validSection} aria-label="设置分类" as="nav" orientation="vertical">
            {sections.map((item) => {
              const Icon = item.icon
              return (
                <NavLink className={segmentedItemClassName} key={item.id} to={`/settings/${item.id}`}>
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              )
            })}
          </SegmentedControl>
        }
      >
        <SurfaceCard>
          {validSection === 'profile' ? <ProfileSettings /> : null}
          {validSection === 'security' ? <SecuritySettings /> : null}
          {validSection === 'tokens' ? <TokenSettings /> : null}
        </SurfaceCard>
      </SplitWorkspace>
    </PageShell>
  )
}
