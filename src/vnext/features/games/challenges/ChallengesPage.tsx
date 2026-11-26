import { Download, FileArchive, ListTree } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useConfig } from '@Hooks/useConfig'
import { AnswerResult, ChallengeDetailModel, ChallengeInfo, SubmissionType } from '@Api'
import {
  ActionButton,
  DataState,
  EditorialPlate,
  EditorSection,
  HairlineItem,
  HairlineList,
  MarkdownContent,
  PageHeader,
  PageShell,
  SectionHeader,
  SpecItem,
  SpecStrip,
  StatusPill,
  VNextDrawer,
} from '../../../shared'
import { FlagSubmission } from '../../challenge-runtime/FlagSubmission'
import { InstanceControl } from '../../challenge-runtime/InstanceControl'
import { useGameChallenge, useGameChallengeCatalog } from '../gamePlayerApi'
import { formatWorkspaceNotice, useGameWorkspace } from '../workspace/GameWorkspaceShell'
import { ChallengeArt } from './ChallengeArt'
import { ChallengeCatalog, ChallengeGroup } from './ChallengeCatalog'
import styles from './ChallengesPage.module.css'
import { categoryMeta } from './challengeCategories'
import { useFlagSubmission } from './useFlagSubmission'
import { useGameInstance } from './useGameInstance'

function formatFileSize(value?: number | null) {
  if (!value) return '大小未知'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(value)
}

function attachmentName(url: string) {
  try {
    return decodeURIComponent(
      new URL(url, window.location.origin).pathname.split('/').filter(Boolean).at(-1) || '题目附件'
    )
  } catch {
    return '题目附件'
  }
}

function resultLabel(result: AnswerResult | 'Error') {
  if (result === AnswerResult.Accepted) return '正确'
  if (result === AnswerResult.WrongAnswer) return '错误'
  if (result === AnswerResult.FlagSubmitted) return '判题中'
  if (result === AnswerResult.CheatDetected) return '异常'
  if (result === AnswerResult.NotFound) return '未找到'
  return '失败'
}

function disabledReason({
  start,
  end,
  practiceMode,
  deadline,
  limit,
  attempts,
}: {
  start?: number
  end?: number
  practiceMode?: boolean
  deadline?: number | null
  limit?: number
  attempts?: number
}) {
  const now = Date.now()
  if (start && now < start) return '比赛尚未开始，当前不能提交。'
  if (end && now >= end && !practiceMode) return '比赛已经结束，当前未开放赛后练习。'
  if (deadline && now >= deadline && !(end && now >= end && practiceMode)) return '该题目的提交期限已结束。'
  if (limit && (attempts ?? 0) >= limit) return '该题目的提交次数已经用完。'
  return null
}

function ChallengeContextRail({
  challenge,
  teamName,
  rank,
  score,
  solvedCount,
  notices,
  submissions,
}: {
  challenge?: ChallengeInfo
  teamName?: string | null
  rank?: number
  score?: number
  solvedCount?: number
  notices: ReturnType<typeof useGameWorkspace>['notices']
  submissions: ReturnType<typeof useFlagSubmission>['submissions']
}) {
  const bloods = challenge?.bloods ?? []
  return (
    <div className={styles.contextStack}>
      {challenge && (
        <>
          <SpecStrip density="comfortable">
            <SpecItem label="本题分值" value={`${challenge.score} 分`} />
          </SpecStrip>
          <section aria-label="解出队伍">
            <SectionHeader title={`解出队伍 · ${challenge.solved}`} />
            {bloods.length ? (
              <HairlineList aria-label="率先解题的队伍" dimSiblings={false}>
                {bloods.map((blood, index) => (
                  <HairlineItem
                    key={`${blood.id}:${index}`}
                    leading={index + 1}
                    title={blood.name}
                    meta={blood.submitTimeUtc ? <time>{formatTime(blood.submitTimeUtc)}</time> : undefined}
                  />
                ))}
              </HairlineList>
            ) : (
              <p className={styles.note}>还没有队伍解出这道题。</p>
            )}
            {challenge.disableBloodBonus && <p className={styles.note}>本题不计一血加分。</p>}
          </section>
        </>
      )}

      <section aria-label="本队">
        <SectionHeader title={`本队 · ${teamName || '当前队伍'}`} />
        <SpecStrip className={styles.teamMetrics}>
          <SpecItem label="排名" tone="accent" value={rank ? `#${rank}` : '--'} />
          <SpecItem label="得分" value={score ?? '--'} />
          <SpecItem label="已解" value={solvedCount ?? '--'} />
        </SpecStrip>
      </section>

      {notices.length > 0 && (
        <section aria-label="比赛通知">
          <SectionHeader title="比赛通知" />
          <HairlineList dimSiblings={false}>
            {notices.slice(0, 6).map((notice) => (
              <HairlineItem
                key={`${notice.id}:${notice.time}:${notice.type}`}
                meta={<time>{formatTime(notice.time)}</time>}
                summary={formatWorkspaceNotice(notice)}
              />
            ))}
          </HairlineList>
        </section>
      )}

      {submissions.length > 0 && (
        <section aria-label="本次提交">
          <SectionHeader title="本次提交" />
          <HairlineList dimSiblings={false}>
            {submissions.slice(0, 6).map((submission) => (
              <HairlineItem
                key={submission.key}
                leading={
                  <StatusPill tone={submission.result === AnswerResult.Accepted ? 'success' : 'neutral'}>
                    {resultLabel(submission.result)}
                  </StatusPill>
                }
                title={submission.challengeTitle}
                meta={submission.answerPreview}
              />
            ))}
          </HairlineList>
        </section>
      )}
    </div>
  )
}

export function ChallengesPage() {
  const { gameId, game, notices, revision } = useGameWorkspace()
  const { config } = useConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = Number(searchParams.get('challenge')) || null
  const query = searchParams.get('q') ?? ''
  const hideSolved = searchParams.get('status') === 'unsolved'
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [flagValues, setFlagValues] = useState<Map<number, string>>(() => new Map())
  const [activeFlagId, setActiveFlagId] = useState<number | null>(null)

  const ongoing = Date.now() >= (game.start ?? 0) && Date.now() < (game.end ?? 0)
  const {
    data: teamInfo,
    error: teamError,
    mutate: mutateTeamInfo,
  } = useGameChallengeCatalog(gameId, ongoing ? 10_000 : 0)

  useEffect(() => {
    if (revision > 0) void mutateTeamInfo()
  }, [mutateTeamInfo, revision])

  const groups = useMemo<ChallengeGroup[]>(
    () =>
      Object.entries(teamInfo?.challenges ?? {}).map(([category, challenges]) => ({
        category,
        challenges,
      })),
    [teamInfo?.challenges]
  )
  const allChallenges = useMemo(() => groups.flatMap((group) => group.challenges), [groups])
  const selectedSummary = useMemo(
    () => allChallenges.find((challenge) => challenge.id === selectedId),
    [allChallenges, selectedId]
  )
  const solvedEntries = useMemo(
    () => (teamInfo?.rank?.solvedChallenges ?? []).filter((entry) => entry.type !== SubmissionType.Unaccepted),
    [teamInfo?.rank?.solvedChallenges]
  )
  const solvedTypes = useMemo(() => new Map(solvedEntries.map((entry) => [entry.id, entry.type])), [solvedEntries])
  const selectedSolvedEntries = useMemo(
    () => solvedEntries.filter((entry) => entry.id === selectedId),
    [selectedId, solvedEntries]
  )
  const solvedFlagIds = useMemo(
    () => new Set(selectedSolvedEntries.map((entry) => entry.flagId)),
    [selectedSolvedEntries]
  )

  useEffect(() => {
    if (!allChallenges.length) return
    if (selectedId && allChallenges.some((challenge) => challenge.id === selectedId)) return
    const next = new URLSearchParams(searchParams)
    next.set('challenge', String(allChallenges[0].id))
    setSearchParams(next, { replace: true })
  }, [allChallenges, searchParams, selectedId, setSearchParams])

  const {
    data: challenge,
    error: challengeError,
    mutate: mutateChallenge,
  } = useGameChallenge(gameId, selectedId ?? 0, ongoing ? 60_000 : 0, Boolean(selectedId))

  useEffect(() => {
    if (!challenge || challenge.id !== selectedId) return
    const flags = challenge.flags ?? []
    if (flags.length <= 1) {
      setActiveFlagId(flags[0]?.id ?? null)
      return
    }
    const available = flags.find((flag, index) => !solvedFlagIds.has(flag.id ?? index + 1)) ?? flags[0]
    setActiveFlagId(available.id ?? null)
  }, [challenge?.id, selectedId, solvedFlagIds])

  const updateChallenge = useCallback(
    (next: ChallengeDetailModel) => {
      void mutateChallenge(next, { revalidate: false })
    },
    [mutateChallenge]
  )
  const refreshChallenge = useCallback(async () => mutateChallenge(), [mutateChallenge])
  const instance = useGameInstance({
    gameId,
    challenge: challenge?.id === selectedId ? challenge : undefined,
    updateChallenge,
    refreshChallenge,
  })
  const flagSubmission = useFlagSubmission(gameId, config.apiPublicKey)

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const selectChallenge = (nextChallenge: ChallengeInfo) => {
    setParam('challenge', String(nextChallenge.id))
    setCatalogOpen(false)
  }

  const flagValue = selectedId ? (flagValues.get(selectedId) ?? '') : ''
  const setFlagValue = (value: string) => {
    if (!selectedId) return
    setFlagValues((current) => new Map(current).set(selectedId, value))
  }

  const totalFlags = Math.max(selectedSummary?.totalFlags ?? 0, challenge?.flags?.length ?? 0, 1)
  const solved = selectedSolvedEntries.length >= totalFlags
  const submitDisabledReason = challenge
    ? disabledReason({
        start: game.start,
        end: game.end,
        practiceMode: game.practiceMode,
        deadline: challenge.deadline,
        limit: challenge.limit,
        attempts: challenge.attempts,
      })
    : null
  const pending = selectedId ? flagSubmission.isPending(selectedId, activeFlagId, flagValue) : false

  const submitFlag = async () => {
    if (!challenge?.id || !flagValue.trim() || pending) return
    const capturedId = challenge.id
    const capturedValue = flagValue
    const result = await flagSubmission.submit({
      challengeId: capturedId,
      challengeTitle: challenge.title || selectedSummary?.title || `题目 ${capturedId}`,
      flagId: (challenge.flags?.length ?? 0) > 1 ? activeFlagId : null,
      value: capturedValue,
    })
    if (result === AnswerResult.Accepted) {
      setFlagValues((current) => {
        if (current.get(capturedId) !== capturedValue) return current
        const next = new Map(current)
        next.set(capturedId, '')
        return next
      })
      await Promise.all([mutateTeamInfo(), mutateChallenge()])
    }
  }

  if (!teamInfo && !teamError) {
    return (
      <PageShell>
        <DataState loading title="题目工作区加载中" />
      </PageShell>
    )
  }
  if (teamError || !teamInfo) {
    return (
      <PageShell>
        <DataState description="当前账户尚未通过报名审核，或题目服务暂时不可用。" title="无法进入题目工作区" />
      </PageShell>
    )
  }
  if (!allChallenges.length) {
    return (
      <PageShell>
        <DataState description="比赛尚未发布题目，请等待管理员开放。" title="暂无题目" />
      </PageShell>
    )
  }

  const displayedChallenge = challenge?.id === selectedId ? challenge : undefined
  const meta = categoryMeta(displayedChallenge?.category ?? selectedSummary?.category ?? 'Misc')
  const attachmentUrl = displayedChallenge?.context?.url

  const catalog = (
    <ChallengeCatalog
      groups={groups}
      hideSolved={hideSolved}
      onHideSolvedChange={(value) => setParam('status', value ? 'unsolved' : null)}
      onQueryChange={(value) => setParam('q', value || null)}
      onSelect={selectChallenge}
      query={query}
      selectedId={selectedId}
      solvedTypes={solvedTypes}
    />
  )

  return (
    <PageShell gap="none">
      <div className={styles.mobileToolbar}>
        <ActionButton
          aria-haspopup="dialog"
          icon={<ListTree size={17} />}
          onClick={() => setCatalogOpen(true)}
          type="button"
        >
          题目列表
        </ActionButton>
        <span>{selectedSummary ? `${meta.label} · ${selectedSummary.score} 分` : '选择题目'}</span>
      </div>
      <VNextDrawer onClose={() => setCatalogOpen(false)} open={catalogOpen} side="left" size="narrow" title="题目列表">
        {catalogOpen && catalog}
      </VNextDrawer>
      <div className={styles.workspaceLayout}>
        <aside aria-label="题目目录" className={styles.catalogRail}>
          {catalog}
        </aside>
        <div className={styles.challengeMain}>
          {!displayedChallenge && !challengeError ? (
            <DataState loading title="题目加载中" />
          ) : challengeError || !displayedChallenge ? (
            <DataState description="题目不存在、尚未开放或当前队伍没有访问权限。" title="题目加载失败" />
          ) : (
            <article className={styles.challengeArticle}>
              <PageHeader
                title={displayedChallenge.title || selectedSummary?.title || `题目 ${displayedChallenge.id}`}
                description={
                  <span className={styles.challengeMeta}>
                    <span>
                      {displayedChallenge.category ?? selectedSummary?.category} · {meta.label}
                    </span>
                    {solved && <StatusPill tone="success">已完成</StatusPill>}
                  </span>
                }
                illustration={
                  <EditorialPlate slot="challenge-category">
                    <ChallengeArt category={displayedChallenge.category ?? selectedSummary?.category} />
                  </EditorialPlate>
                }
              />

              <div className={styles.articleBody}>
                <MarkdownContent source={displayedChallenge.content || '暂无题目说明。'} />

                {displayedChallenge.hints?.length ? (
                  <EditorSection title="题目提示">
                    {displayedChallenge.hints.map((hint, index) => (
                      <MarkdownContent key={`${index}:${hint}`} source={hint} />
                    ))}
                  </EditorSection>
                ) : null}

                {attachmentUrl ? (
                  <EditorSection title="题目附件">
                    <a className={styles.attachment} href={attachmentUrl} rel="noreferrer noopener" target="_blank">
                      <FileArchive aria-hidden="true" size={21} />
                      <span className={styles.attachmentName}>
                        {attachmentName(attachmentUrl)}
                        <small className={styles.note}>{formatFileSize(displayedChallenge.context?.fileSize)}</small>
                      </span>
                      <Download aria-hidden="true" size={18} />
                    </a>
                  </EditorSection>
                ) : null}

                <InstanceControl controller={instance} />

                <FlagSubmission
                  activeFlagId={activeFlagId}
                  challenge={displayedChallenge}
                  disabledReason={submitDisabledReason}
                  feedback={flagSubmission.feedbackFor(displayedChallenge.id ?? 0)}
                  onFlagChange={setActiveFlagId}
                  onSubmit={() => void submitFlag()}
                  onValueChange={setFlagValue}
                  pending={pending}
                  solved={solved}
                  solvedFlagIds={solvedFlagIds}
                  value={flagValue}
                />
              </div>
            </article>
          )}
        </div>

        <aside className={styles.contextRail}>
          <ChallengeContextRail
            challenge={selectedSummary}
            notices={notices}
            rank={teamInfo.rank?.rank}
            score={teamInfo.rank?.score}
            solvedCount={teamInfo.rank?.solvedCount}
            submissions={flagSubmission.submissions}
            teamName={teamInfo.rank?.name || game.teamName}
          />
        </aside>
      </div>
    </PageShell>
  )
}
