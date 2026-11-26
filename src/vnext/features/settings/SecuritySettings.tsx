import { ShieldCheck } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { PasswordField, SectionHeader } from '../../shared'
import { ActionButton, InlineFeedback } from '../../shared/Interaction'
import { errorMessage } from '../../shared/errors'
import { useAccountLogout } from '../account/useCurrentAccount'
import styles from './SettingsPage.module.css'
import { settingsApi } from './settingsApi'

export function SecuritySettings() {
  const logout = useAccountLogout()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmation) {
      setFeedback('两次输入的新密码不一致。')
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      await settingsApi.changePassword(oldPassword, newPassword)
      await logout({ redirectTo: '/account/login' })
    } catch (error) {
      setFeedback(errorMessage(error, '密码修改失败。'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.settingsContent}>
      <SectionHeader title="账户安全" description="修改密码后当前会话会退出，需要使用新密码重新登录。" />
      {feedback ? <InlineFeedback tone="danger">{feedback}</InlineFeedback> : null}
      <form className={styles.form} onSubmit={(event) => void submit(event)}>
        <PasswordField
          label="当前密码"
          autoComplete="current-password"
          minLength={6}
          onValueChange={setOldPassword}
          required
          value={oldPassword}
        />
        <div className={styles.formGrid}>
          <PasswordField
            label="新密码"
            autoComplete="new-password"
            minLength={6}
            onValueChange={setNewPassword}
            required
            value={newPassword}
          />
          <PasswordField
            label="确认新密码"
            autoComplete="new-password"
            minLength={6}
            onValueChange={setConfirmation}
            required
            value={confirmation}
          />
        </div>
        <div className={styles.formActions}>
          <ActionButton
            loading={saving}
            disabled={saving || !oldPassword || !newPassword || !confirmation}
            icon={<ShieldCheck size={16} />}
            tone="primary"
            type="submit"
          >
            修改并退出
          </ActionButton>
        </div>
      </form>
    </div>
  )
}
