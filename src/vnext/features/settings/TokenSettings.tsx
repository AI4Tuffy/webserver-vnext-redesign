import { Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { ApiTokenModel, Role } from '@Api'
import { DataTable, SectionHeader, type DataColumn } from '../../shared'
import { ActionButton, InlineFeedback, VNextConfirmDialog, VNextDialog } from '../../shared/Interaction'
import { DataState, StatusPill } from '../../shared/Primitives'
import { errorMessage } from '../../shared/errors'
import { useCurrentAccount } from '../account/useCurrentAccount'
import styles from './SettingsPage.module.css'
import { TokenCreateDialog } from './TokenCreateDialog'
import { settingsApi, useApiTokens } from './settingsApi'

function formatTime(value?: number | null) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(value) : '未设置'
}

function grantedScopes(token: ApiTokenModel) {
  return (token.resources ?? []).filter((resource) => resource.resourceType === 'teamlab-scope')
}

function tokenColumns(onRevoke: (id: string) => void): DataColumn<ApiTokenModel>[] {
  const expired = (token: ApiTokenModel) => Boolean(token.expiresAt && token.expiresAt <= Date.now())
  return [
    {
      id: 'name',
      header: '名称',
      render: (token) => (
        <div className={styles.tokenName}>
          <strong>{token.name || '未命名'}</strong>
          <small>{token.id}</small>
        </div>
      ),
    },
    {
      id: 'scopes',
      header: '权限范围',
      render: (token) => (
        <div className={styles.scopeList}>
          {token.scopes?.map((scope) => (
            <span key={scope}>{scope}</span>
          ))}
        </div>
      ),
    },
    {
      id: 'resources',
      header: '资源授权',
      render: (token) => {
        const resources = grantedScopes(token)
        return resources.length ? (
          <div className={styles.scopeList}>
            {resources.map((resource) => (
              <span key={resource.resourceId ?? resource.resourceType}>
                {resource.resourceId ? resource.resourceId.slice(0, 8) + '…' : '—'}
              </span>
            ))}
          </div>
        ) : (
          '无'
        )
      },
    },
    { id: 'quota', header: '配额', render: (token) => (token.requestsPerMinute ?? '-') + ' / min' },
    { id: 'lastUsed', header: '最后使用', render: (token) => formatTime(token.lastUsedAt) },
    { id: 'expires', header: '过期时间', render: (token) => formatTime(token.expiresAt) },
    {
      id: 'status',
      header: '状态',
      render: (token) => (
        <StatusPill tone={expired(token) ? 'neutral' : 'success'}>{expired(token) ? '已过期' : '有效'}</StatusPill>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      render: (token) => (
        <ActionButton
          disabled={expired(token) || !token.id}
          onClick={() => token.id && onRevoke(token.id)}
          size="sm"
          tone="ghost"
          type="button"
        >
          撤销
        </ActionButton>
      ),
    },
  ]
}

function SecretDialog({ onClose, secret }: { onClose: () => void; secret: string | null }) {
  return (
    <VNextDialog
      description="关闭后无法再次查看明文，请立即存放到安全位置。"
      footer={
        <ActionButton onClick={onClose} tone="primary" type="button">
          我已保存
        </ActionButton>
      }
      onClose={onClose}
      open={secret !== null}
      title="API Token 已创建"
    >
      <div className={styles.secretBox}>
        <code className={styles.secret}>{secret}</code>
        <ActionButton
          icon={<Copy size={16} />}
          onClick={() => secret && void navigator.clipboard.writeText(secret)}
          type="button"
        >
          复制
        </ActionButton>
      </div>
    </VNextDialog>
  )
}

export function TokenSettings() {
  const { user, isTeacher } = useCurrentAccount()
  const { data: tokens, error, mutate } = useApiTokens()
  const [createOpen, setCreateOpen] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const activeTokens = (tokens ?? []).filter((token) => !token.revokedAt)

  const canGrantScopes = user?.role === Role.Admin || user?.role === Role.SuperAdmin

  const revoke = async () => {
    if (!revokeId) return false
    setFeedback(null)
    try {
      await settingsApi.revokeToken(revokeId)
      await mutate()
      return true
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'Token 撤销失败。'))
      return false
    }
  }

  if (!isTeacher) {
    return (
      <SectionHeader
        title="API Token"
        description="API Token 仅对教师及更高权限开放。如需程序化访问，请联系平台管理员。"
      />
    )
  }

  return (
    <div className={styles.settingsContent}>
      <SectionHeader
        title="API Token"
        description="Token 明文仅在创建时显示一次。"
        actions={
          <ActionButton icon={<KeyRound size={16} />} onClick={() => setCreateOpen(true)} tone="primary" type="button">
            创建 Token
          </ActionButton>
        }
      />
      {feedback || error ? <InlineFeedback tone="danger">{feedback || 'Token 列表加载失败。'}</InlineFeedback> : null}
      {!tokens && !error ? (
        <DataState loading title="Token 加载中" />
      ) : (
        <DataTable
          caption="API Token"
          columns={tokenColumns(setRevokeId)}
          emptyTitle="尚未创建 API Token。"
          emptyDescription="创建后可在这里查看授权范围与状态。"
          rowKey={(token) => token.id ?? token.name ?? ''}
          rows={activeTokens}
        />
      )}

      <TokenCreateDialog
        canGrantScopes={canGrantScopes}
        onClose={() => setCreateOpen(false)}
        onIssued={(issued) => {
          setSecret(issued)
          void mutate()
        }}
        open={createOpen}
      />

      <SecretDialog onClose={() => setSecret(null)} secret={secret} />

      <VNextConfirmDialog
        confirmLabel="撤销 Token"
        message="撤销后使用此凭据的脚本和集成会立即失去访问权限，并且无法恢复。"
        onClose={() => setRevokeId(null)}
        onConfirm={revoke}
        open={revokeId !== null}
        title="确认撤销此 Token？"
      />
    </div>
  )
}
