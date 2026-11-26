import { useState } from 'react'
import { ApiTokenCreateModel } from '@Api'
import { TextField, ToggleField } from '../../shared'
import { ActionButton, InlineFeedback, VNextDialog } from '../../shared/Interaction'
import { errorMessage } from '../../shared/errors'
import styles from './SettingsPage.module.css'
import { TokenResourceGrant } from './TokenResourceGrant'
import { settingsApi } from './settingsApi'

export const tokenScopeOptions = [
  ['images:read', '读取镜像'],
  ['images:write', '写入镜像'],
  ['images:delete', '删除镜像'],
  ['assets:read', '读取附件'],
  ['assets:write', '上传附件'],
  ['challenges:read', '读取比赛题目'],
  ['challenges:write', '导入比赛题目'],
  ['challenges:delete', '删除比赛题目'],
  ['exercises:read', '读取练习题库'],
  ['exercises:write', '导入练习题目'],
  ['exercises:delete', '删除练习题目'],
  ['training:write', '导入培训课程'],
  ['theory:write', '导入理论题库与试卷'],
  ['operations:read', '读取异步操作'],
  ['bootstrap-profiles:read', '引导配置读取'],
  ['bootstrap-profiles:write', '引导配置写入'],
] as const

const adminTokenScopeOptions = [['teams:write', '导入战队']] as const

interface TokenCreateDialogProps {
  canGrantScopes: boolean
  onClose: () => void
  onIssued: (secret: string) => void
  open: boolean
}

export function TokenCreateDialog({ canGrantScopes, onClose, onIssued, open }: TokenCreateDialogProps) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['images:read'])
  const [resourceType, setResourceType] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [requestsPerMinute, setRequestsPerMinute] = useState(60)
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const visibleScopeOptions = canGrantScopes ? [...tokenScopeOptions, ...adminTokenScopeOptions] : tokenScopeOptions

  const submit = async () => {
    const model: ApiTokenCreateModel = {
      name: name.trim(),
      scopes,
      requestsPerMinute,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      resources: [
        ...(resourceType.trim() && resourceId.trim()
          ? [{ resourceType: resourceType.trim(), resourceId: resourceId.trim() }]
          : []),
      ],
    }
    setSubmitting(true)
    setFeedback(null)
    try {
      const secret = await settingsApi.issueToken(model)
      setName('')
      setScopes(['images:read'])
      setResourceType('')
      setResourceId('')
      setRequestsPerMinute(60)
      setExpiresAt('')
      onIssued(secret)
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'Token 创建失败。'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleScope = (value: string, checked: boolean) =>
    setScopes((current) => (checked ? [...current, value] : current.filter((item) => item !== value)))

  return (
    <VNextDialog
      description="选择最小必要权限；镜像写入和题目导入建议使用不同 Token。"
      footer={
        <>
          <ActionButton onClick={onClose} type="button">
            取消
          </ActionButton>
          <ActionButton
            disabled={submitting || !name.trim() || !scopes.length}
            onClick={() => submit()}
            tone="primary"
            type="button"
          >
            确认创建
          </ActionButton>
        </>
      }
      onClose={onClose}
      open={open}
      title="创建 API Token"
    >
      <div className={styles.dialogForm}>
        <TextField label="名称" maxLength={128} onValueChange={setName} placeholder="例如：镜像上传脚本" value={name} />
        <fieldset className={styles.fieldset}>
          <legend>权限范围</legend>
          <div className={styles.checkGrid}>
            {visibleScopeOptions.map(([value, label]) => (
              <ToggleField
                key={value}
                checked={scopes.includes(value)}
                description={value}
                label={label}
                onChange={(checked) => toggleScope(value, checked)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend>外部资源授权</legend>
          <p className={styles.hintText}>
            练习题库使用 <code>exercise:*</code>，培训课程使用 <code>training-course:*</code>，理论题库使用{' '}
            <code>theory-bank:*</code>，比赛题目或理论试卷使用 <code>game:比赛 ID</code>；管理员导入战队使用{' '}
            <code>team:*</code>。
          </p>
          <TokenResourceGrant
            className={styles.formGrid}
            onResourceIdChange={setResourceId}
            onResourceTypeChange={setResourceType}
            resourceId={resourceId}
            resourceType={resourceType}
          />
        </fieldset>
        <div className={styles.formGrid}>
          <TextField
            label="每分钟请求数"
            max={10000}
            min={1}
            onValueChange={(value) => setRequestsPerMinute(Number(value) || 60)}
            type="number"
            value={requestsPerMinute}
          />
          <TextField label="过期时间" onValueChange={setExpiresAt} type="datetime-local" value={expiresAt} />
        </div>
        {feedback ? <InlineFeedback tone="danger">{feedback}</InlineFeedback> : null}
      </div>
    </VNextDialog>
  )
}
