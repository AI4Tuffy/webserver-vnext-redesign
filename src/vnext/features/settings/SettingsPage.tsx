import { KeyRound, LockKeyhole, UserRound } from 'lucide-react'
import { NavLink, Navigate, useParams } from 'react-router'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { ProfileSettings } from './ProfileSettings'
import { SecuritySettings } from './SecuritySettings'
import styles from './SettingsPage.module.css'
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
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>账户设置</h1>
      </header>
      <div className={styles.layout}>
        <div className={styles.sideNav}>
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
        </div>
        <main className={styles.panel}>
          {validSection === 'profile' ? <ProfileSettings /> : null}
          {validSection === 'security' ? <SecuritySettings /> : null}
          {validSection === 'tokens' ? <TokenSettings /> : null}
        </main>
      </div>
    </div>
  )
}
