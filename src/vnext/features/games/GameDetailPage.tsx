import { ArrowRight, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ParticipationStatus } from '@Api'
import { SelectField, TextField } from '../../shared/FormControls'
import { ActionButton, ActionLink, InlineFeedback, VNextConfirmDialog, VNextDialog } from '../../shared/Interaction'
import { PageShell, SurfaceCard } from '../../shared/Layout'
import { DataState, PageHeader, SectionHeader, StatusBadge } from '../../shared/Primitives'
import { errorMessage } from '../../shared/errors'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { useCurrentAccount } from '../account/useCurrentAccount'
import styles from './GameDetailPage.module.css'
import { GameFacts, GameTimeline } from './GameFacts'
import { GameNoticeCards } from './GameNoticeCards'
import { GamePoster } from './GamePosterArt'
import { GameReadme } from './GameReadme'
import { gameStatusLabel, gameStatusTone } from './gameCatalog'
import { gameModulesFor } from './gameModules'
import { gamePlayerApi, useGameJoinCheck, useGameNotices, usePlayerGame, usePlayerTeams } from './gamePlayerApi'

function gameStatus(start?: number, end?: number) {
  const now = Date.now()
  if (start && now < start) return 'upcoming' as const
  if (end && now >= end) return 'ended' as const
  return 'ongoing' as const
}

function durationLabel(target?: number, now = Date.now()) {
  if (!target) return ''
  const seconds = Math.max(0, Math.floor((target - now) / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (days) return `${days} 天 ${hours} 小时`
  if (hours) return `${hours} 小时 ${minutes} 分`
  return `${minutes} 分 ${String(rest).padStart(2, '0')} 秒`
}

function participationStatus(status?: ParticipationStatus) {
  switch (status) {
    case ParticipationStatus.Accepted:
      return { label: '已通过', tone: 'success' as const }
    case ParticipationStatus.Pending:
      return { label: '待审核', tone: 'warning' as const }
    case ParticipationStatus.Rejected:
      return { label: '已拒绝', tone: 'neutral' as const }
    case ParticipationStatus.Suspended:
      return { label: '已暂停', tone: 'warning' as const }
    default:
      return { label: '未报名', tone: 'neutral' as const }
  }
}

export function GameDetailPage() {
  const { gameId = '' } = useParams()
  const id = Number(gameId)
  const validId = Number.isInteger(id) && id > 0
  const account = useCurrentAccount()
  const { data: game, error, mutate } = usePlayerGame(id, validId)
  const { data: teams } = usePlayerTeams(account.isAuthenticated)
  const { data: notices } = useGameNotices(id, 5, validId)
  const [joinOpen, setJoinOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const { data: checkInfo, mutate: mutateCheck } = useGameJoinCheck(id, validId && joinOpen && account.isAuthenticated)
  const [teamId, setTeamId] = useState<number | null>(null)
  const [divisionId, setDivisionId] = useState<number | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [now, setNow] = useState(Date.now())

  const status = gameStatus(game?.start, game?.end)
  const participation = participationStatus(game?.status)
  const modules = gameModulesFor(game?.gameType)
  const accepted = game?.status === ParticipationStatus.Accepted
  const joinedTeamIds = useMemo(
    () => new Set(checkInfo?.joinedTeams?.map((team) => team.id) ?? []),
    [checkInfo?.joinedTeams]
  )
  const selectableTeams = (teams ?? []).filter((team) => team.id && !joinedTeamIds.has(team.id))
  const divisions = (game?.divisions ?? []).filter(
    (division) =>
      !checkInfo?.joinableDivisions?.length || (division.id && checkInfo.joinableDivisions.includes(division.id))
  )
  const selectedDivision = divisions.find((division) => division.id === divisionId)
  const needsInvite = Boolean(game?.inviteCodeRequired || selectedDivision?.inviteCodeRequired)

  useVNextPageTitle(game?.title || '赛事详情')

  useEffect(() => {
    const target = status === 'upcoming' ? game?.start : status === 'ongoing' ? game?.end : undefined
    if (!target || target <= Date.now()) return undefined
    const update = () => {
      if (!document.hidden) setNow(Date.now())
    }
    const timer = window.setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [game?.end, game?.start, status])

  useEffect(() => {
    if (!joinOpen || !checkInfo) return
    if (!teamId || joinedTeamIds.has(teamId)) setTeamId(selectableTeams[0]?.id ?? null)
    if (!divisionId || !divisions.some((division) => division.id === divisionId))
      setDivisionId(divisions[0]?.id ?? null)
  }, [checkInfo, divisionId, divisions, joinOpen, joinedTeamIds, selectableTeams, teamId])

  const joinGame = async (event: FormEvent) => {
    event.preventDefault()
    if (!teamId) return
    setSubmitting(true)
    setFeedback(null)
    try {
      await gamePlayerApi.join(id, { teamId, divisionId, inviteCode: inviteCode.trim() || null })
      await Promise.all([mutate(), mutateCheck()])
      setJoinOpen(false)
      setInviteCode('')
      setFeedback({ tone: 'success', message: '报名信息已提交，当前状态已刷新。' })
    } catch (requestError) {
      setFeedback({ tone: 'danger', message: errorMessage(requestError, '比赛报名失败。') })
    } finally {
      setSubmitting(false)
    }
  }

  const leaveGame = async () => {
    setSubmitting(true)
    setFeedback(null)
    try {
      await gamePlayerApi.leave(id)
      await mutate()
      setFeedback({ tone: 'success', message: '已撤回当前报名。' })
      return true
    } catch (requestError) {
      setFeedback({ tone: 'danger', message: errorMessage(requestError, '撤回报名失败。') })
      return false
    } finally {
      setSubmitting(false)
    }
  }

  if (!validId)
    return (
      <PageShell>
        <DataState description="赛事编号格式不正确。" title="无法识别赛事" />
      </PageShell>
    )
  if (!game && !error)
    return (
      <PageShell>
        <DataState loading title="赛事加载中" />
      </PageShell>
    )
  if (!game)
    return (
      <PageShell>
        <DataState description="赛事不存在、已隐藏或当前账户无权访问。" title="赛事加载失败" />
      </PageShell>
    )

  const countdownTarget = status === 'upcoming' ? game.start : status === 'ongoing' ? game.end : undefined
  const countdownLabel = status === 'upcoming' ? '距离开始' : '距离结束'
  const rulesSource = game.content || game.summary || '暂无比赛说明。'

  return (
    <PageShell>
      {feedback ? <InlineFeedback tone={feedback.tone}>{feedback.message}</InlineFeedback> : null}

      <div className={styles.layout}>
        <div className={styles.head}>
          <PageHeader
            actions={<StatusBadge tone={gameStatusTone(status)}>{gameStatusLabel(status)}</StatusBadge>}
            border={false}
            title={game.title || `赛事 ${id}`}
          />
          <GameTimeline end={game.end} now={now} start={game.start} />
          <GameFacts game={game} />
        </div>

        <aside className={styles.aside}>
          <SurfaceCard className={styles.ticket} padding="none">
            <span className={styles.poster}>
              <GamePoster seed={id} src={game.poster} status={status} title={game.title} />
            </span>
            <div className={styles.ticketBody}>
              <SectionHeader
                actions={<StatusBadge tone={participation.tone}>{participation.label}</StatusBadge>}
                title="参赛状态"
              />
              {game.teamName ? (
                <div className={styles.currentTeam}>
                  <ShieldCheck aria-hidden="true" size={18} />
                  <span className={styles.teamInfo}>
                    <small className={styles.label}>参赛战队</small>
                    <strong className={styles.teamName}>{game.teamName}</strong>
                  </span>
                </div>
              ) : null}
              {countdownTarget && countdownTarget > now ? (
                <div className={styles.countdown}>
                  <span className={styles.label}>{countdownLabel}</span>
                  <strong className={styles.remaining}>{durationLabel(countdownTarget, now)}</strong>
                </div>
              ) : null}
            </div>
            <div className={styles.ticketStub}>
              {!account.isAuthenticated ? (
                <ActionLink shape="pill" tone="primary" to={`/account/login?returnUrl=/games/${id}`}>
                  登录后报名
                  <ArrowRight aria-hidden="true" size={16} />
                </ActionLink>
              ) : null}
              {account.isAuthenticated &&
              (!game.status ||
                game.status === ParticipationStatus.Unsubmitted ||
                game.status === ParticipationStatus.Rejected) &&
              status !== 'ended' ? (
                <ActionButton shape="pill" onClick={() => setJoinOpen(true)} tone="primary" type="button">
                  {game.status === ParticipationStatus.Rejected ? '重新报名' : '报名参赛'}
                </ActionButton>
              ) : null}
              {game.status === ParticipationStatus.Pending ? (
                <>
                  <p className={styles.hint}>报名正在等待管理员审核，通过后会开放比赛工作区。</p>
                  <ActionButton
                    disabled={submitting}
                    shape="pill"
                    onClick={() => setLeaveConfirmOpen(true)}
                    type="button"
                  >
                    撤回报名
                  </ActionButton>
                </>
              ) : null}
              {game.status === ParticipationStatus.Accepted && status === 'upcoming' ? (
                <p className={styles.hint}>报名已通过，比赛开始后将自动开放对应工作区。</p>
              ) : null}
              {game.status === ParticipationStatus.Accepted && status === 'ongoing' && modules[0] ? (
                <ActionLink shape="pill" tone="primary" to={`/games/${id}/${modules[0].id}`}>
                  进入{modules[0].label}
                  <ArrowRight aria-hidden="true" size={16} />
                </ActionLink>
              ) : null}
              {game.status === ParticipationStatus.Suspended ? (
                <p className={styles.hint}>当前参赛资格已暂停，请联系比赛管理员。</p>
              ) : null}
              {status === 'ended' && !accepted ? (
                <p className={styles.hint}>比赛已结束，可查看公开结果或管理员允许的赛后内容。</p>
              ) : null}
              {status === 'ended' && modules[0] ? (
                <ActionLink shape="pill" tone="primary" to={`/games/${id}/${modules[0].id}`}>
                  查看{modules[0].label}
                  <ArrowRight aria-hidden="true" size={16} />
                </ActionLink>
              ) : null}
            </div>
          </SurfaceCard>

          {notices?.length ? (
            <section>
              <SectionHeader title="比赛公告" />
              <GameNoticeCards notices={notices.slice(0, 5)} />
            </section>
          ) : null}
        </aside>

        <div className={styles.body}>
          <GameReadme source={rulesSource} />
        </div>
      </div>

      <VNextDialog
        description="请选择参赛战队和赛区。部分比赛需要管理员审核。"
        footer={
          <>
            <ActionButton onClick={() => setJoinOpen(false)} type="button">
              取消
            </ActionButton>
            <ActionButton
              loading={submitting}
              disabled={submitting || !teamId || (needsInvite && !inviteCode.trim())}
              form="vnext-game-join-form"
              tone="primary"
              type="submit"
            >
              提交报名
            </ActionButton>
          </>
        }
        onClose={() => setJoinOpen(false)}
        open={joinOpen}
        title="报名参赛"
      >
        {!checkInfo ? (
          <DataState loading title="报名检查中" />
        ) : (
          <form className={styles.joinForm} id="vnext-game-join-form" onSubmit={joinGame}>
            {!selectableTeams.length ? (
              <InlineFeedback tone="neutral">
                没有可用于报名的战队。请先前往战队页面创建或加入战队。
                <Link className={styles.teamsLink} to="/teams">
                  打开战队协作
                </Link>
              </InlineFeedback>
            ) : (
              <SelectField
                label="参赛战队"
                onValueChange={(value) => setTeamId(Number(value) || null)}
                value={teamId ?? ''}
              >
                {selectableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}（{team.members?.length ?? 0} 人）
                  </option>
                ))}
              </SelectField>
            )}
            {divisions.length ? (
              <SelectField
                label="参赛赛区"
                onValueChange={(value) => {
                  setDivisionId(Number(value) || null)
                  setInviteCode('')
                }}
                value={divisionId ?? ''}
              >
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name || `赛区 ${division.id}`}
                  </option>
                ))}
              </SelectField>
            ) : (
              <InlineFeedback tone="neutral">本比赛使用默认赛区。</InlineFeedback>
            )}
            {needsInvite ? (
              <TextField
                autoComplete="off"
                label="比赛或赛区邀请码"
                onValueChange={setInviteCode}
                required
                value={inviteCode}
              />
            ) : null}
          </form>
        )}
      </VNextDialog>
      <VNextConfirmDialog
        confirmLabel="撤回报名"
        message="撤回后当前参赛资格会被取消；如比赛仍开放报名，可以重新提交。"
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={leaveGame}
        open={leaveConfirmOpen}
        title="确认撤回当前比赛报名？"
      />
    </PageShell>
  )
}
