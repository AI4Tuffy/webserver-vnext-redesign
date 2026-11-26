import { LogIn, Play, Settings, UserRound } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  ProfileUserInfoModel,
  TrainingCourseEnrollmentStatus,
  TrainingCourseModel,
  TrainingCourseProgressStatus,
} from '@Api'
import {
  ActionLink,
  DataState,
  EditorialPlate,
  HairlineItem,
  HairlineList,
  PageHeader,
  PageShell,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
} from '../../shared'
import { SpotIconName, SpotPalette, SpotTile } from '../../shared/art/spot'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { useCurrentAccount } from '../account/useCurrentAccount'
import { formatGameRange, GameCatalogItem, participationLabel, useGameCatalog } from '../games/gameCatalog'
import type { UserActivityPoint } from '../profile/api/userProfileApi'
import { HomeHeroArt } from './HomeHeroArt'
import styles from './HomePage.module.css'
import { quoteForDate } from './dailyQuote'
import { buildFootprint, footprintRange, footprintWeeksFor, FOOTPRINT_MIN_WEEKS, FOOTPRINT_WEEKDAYS } from './footprint'
import { useHomeAccountSummary, useHomeActivity, useHomeCourses, useParticipatedGames } from './homeApi'
import { greetingFor } from './homeGreeting'

const PROJECT_LIMIT = 3
const GAME_CHECK_LIMIT = 12

interface RecentProject {
  id: string
  kind: 'game' | 'course'
  live: boolean
  label: string
  title: string
  subtitle: string
  route: string
  recency: number
  progress?: { done: number; total: number }
}

function remainingLabel(target: number, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((target - now) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return `${days} 天 ${hours} 时`
  if (hours) return `${hours} 时 ${minutes % 60} 分`
  return `${minutes} 分`
}

function courseState(course: TrainingCourseModel) {
  if (course.progressStatus === TrainingCourseProgressStatus.Completed) return '已完成'
  if (course.progressStatus === TrainingCourseProgressStatus.Learning) return '学习中'
  return course.canLearn ? '未开始' : '查看简介'
}

function gameProject(game: GameCatalogItem, now: number): RecentProject {
  const live = game.status === 'ongoing'
  return {
    id: `game-${game.id}`,
    kind: 'game',
    live,
    label: live ? '赛事 · 进行中' : '赛事 · 已结束',
    title: game.title || `赛事 ${game.id}`,
    subtitle: live
      ? `剩余 ${remainingLabel(game.endsAt, now)} · ${participationLabel(game.limit)}`
      : formatGameRange(game),
    route: `/games/${game.id}`,
    recency: live ? now : game.endsAt,
  }
}

function courseProject(course: TrainingCourseModel): RecentProject {
  const total = course.totalChapterCount ?? course.chapterCount ?? 0
  return {
    id: `course-${course.id}`,
    kind: 'course',
    live: false,
    label: `课程 · ${courseState(course)}`,
    title: course.title || `课程 ${course.id}`,
    subtitle: course.summary || '',
    route: `/training/courses/${course.id}`,
    recency: course.lastStudiedAt ?? course.updatedAt ?? 0,
    progress: total > 0 ? { done: course.completedChapterCount ?? 0, total } : undefined,
  }
}

/**
 * 最近参加的项目：报名通过的进行中或已结束赛事（进行中按当前时间，已结束按结束时间），
 * 以及选课通过的课程（按最近学习时间），合并后取最近 3 个。
 */
function useRecentProjects(userId?: string) {
  const gameCatalog = useGameCatalog()
  const courses = useHomeCourses(true)
  const candidates = useMemo(
    () => (gameCatalog.games ?? []).filter((game) => game.status !== 'upcoming').slice(0, GAME_CHECK_LIMIT),
    [gameCatalog.games]
  )
  const participation = useParticipatedGames(
    userId,
    candidates.map((game) => game.id),
    PROJECT_LIMIT
  )
  const items = useMemo(() => {
    const now = Date.now()
    const joined = new Set(participation.data ?? [])
    const games = candidates.filter((game) => joined.has(game.id)).map((game) => gameProject(game, now))
    const enrolled = (courses.data ?? [])
      .filter((course) => course.id && course.enrollmentStatus === TrainingCourseEnrollmentStatus.Approved)
      .map(courseProject)
    return [...games, ...enrolled].sort((left, right) => right.recency - left.recency).slice(0, PROJECT_LIMIT)
  }, [candidates, courses.data, participation.data])

  return {
    items,
    error: gameCatalog.error || participation.error || courses.error,
    loading: gameCatalog.isLoading || participation.isLoading || courses.isLoading,
  }
}

/** 观察元素内容宽度；首帧在绘制前测量，避免周数跳变。 */
function useElementWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!element) return undefined
    setWidth(element.clientWidth)
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [setElement, width] as const
}

/** GitHub 式学习足迹：方格与 GitHub 相近大小，按周排列，上方月份、左侧星期、右下图例。 */
function ActivityCalendar({ points, weeks }: { points: UserActivityPoint[]; weeks: number }) {
  const { cells, monthLabels, activeDays } = useMemo(() => buildFootprint(points, weeks), [points, weeks])

  return (
    <div className={styles.calendar}>
      <div aria-hidden="true" className={styles.calendarMonths}>
        {monthLabels.map((label, week) => (
          <span className={styles.month} key={week}>
            {label}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.calendarWeekdays}>
        {FOOTPRINT_WEEKDAYS.map((label, day) => (
          <span key={day}>{label}</span>
        ))}
      </div>
      <div
        aria-label={`最近 ${weeks} 周的学习足迹，共 ${activeDays} 天有记录`}
        className={styles.activityGrid}
        role="img"
      >
        {cells.map((cell) => (
          <span
            className={styles.day}
            data-future={cell.future ? 'true' : undefined}
            data-level={cell.level}
            key={cell.key}
            title={cell.future ? undefined : cell.key}
          />
        ))}
      </div>
      <div className={styles.activityLegend}>
        <span>较少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i aria-hidden="true" className={styles.day} data-level={level} key={level} />
        ))}
        <span>较多</span>
      </div>
    </div>
  )
}

/** 学习足迹卡片：按卡片宽度决定显示的周数，标题中的周数随之变化。 */
function FootprintCard({ userId }: { userId?: string }) {
  const range = useMemo(() => footprintRange(), [])
  const activity = useHomeActivity(userId, range.from, range.to)
  const [bodyRef, width] = useElementWidth<HTMLDivElement>()
  const weeks = width ? footprintWeeksFor(width) : FOOTPRINT_MIN_WEEKS

  return (
    <SurfaceCard className={styles.activityCard}>
      <SectionHeader actions={<span className={styles.note}>最近 {weeks} 周</span>} title="学习足迹" />
      <div className={styles.activityBody} ref={bodyRef}>
        {activity.data ? (
          <ActivityCalendar points={activity.data} weeks={weeks} />
        ) : activity.error ? (
          <DataState error={activity.error} title="学习记录加载失败" />
        ) : (
          <DataState loading title="学习记录加载中" />
        )}
      </div>
    </SurfaceCard>
  )
}

/** 按本地时间问候，每分钟校准一次，跨时段时自动切换。 */
function useGreeting() {
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return greetingFor(hour)
}

function internalRoute(route?: string | null) {
  return route && route.startsWith('/') && !route.startsWith('//') ? route : undefined
}

/** 后端账户摘要的第一个站内继续入口；没有时不显示按钮。 */
function useResumeRoute(enabled: boolean) {
  const summary = useHomeAccountSummary(enabled)
  return summary.data?.continueItems?.map((item) => internalRoute(item.route)).find(Boolean)
}

function HomeIdentity({ user }: { user?: ProfileUserInfoModel }) {
  const greeting = useGreeting()
  const resumeRoute = useResumeRoute(Boolean(user))
  const name = user?.userName?.trim() || '当前用户'
  const title = user ? `${greeting}，${name}` : '个人主页'
  const quote = quoteForDate(new Date())

  return (
    <div className={styles.hero}>
      <PageHeader
        actions={
          user ? (
            <>
              {resumeRoute && (
                <ActionLink icon={<Play size={16} />} shape="pill" to={resumeRoute} tone="primary">
                  从上次的地方开始
                </ActionLink>
              )}
              <ActionLink icon={<UserRound size={16} />} shape="pill" to="/users/me">
                个人档案
              </ActionLink>
              <ActionLink icon={<Settings size={16} />} shape="pill" to="/settings/security">
                账户设置
              </ActionLink>
            </>
          ) : (
            <ActionLink icon={<LogIn size={16} />} shape="pill" to="/account/login?returnUrl=%2F" tone="primary">
              登录
            </ActionLink>
          )
        }
        border={false}
        description={
          user ? (
            <span className={styles.quote}>
              <span className={styles.note}>每日一言</span>
              <span className={styles.quoteText}>{quote.text}</span>
              <cite className={styles.quoteSource}>—— {quote.source}</cite>
            </span>
          ) : (
            '登录后查看赛事预约、课程进度和学习足迹。'
          )
        }
        illustration={
          <EditorialPlate alt="夺旗游戏的演变" slot="home-hero">
            <HomeHeroArt />
          </EditorialPlate>
        }
        title={title}
      />
    </div>
  )
}

/** 项目卡片顶部的手绘图标（小组件样式）：赛事为奖杯，课程为书，课程交替两种色调以便区分相邻两张。 */
function projectSpot(kind: 'game' | 'course', index: number): { icon: SpotIconName; palette: SpotPalette } {
  if (kind === 'game') return { icon: 'trophy', palette: 'peach' }
  return { icon: 'book', palette: index % 2 ? 'lavender' : 'sage' }
}

/** 最近参加的项目：至多 3 张横向学院式卡片，上下排列；左侧色底手绘图标，右侧标题、状态与说明或章节进度，整张可点击。 */
function RecentProjectsCard({ projects }: { projects: ReturnType<typeof useRecentProjects> }) {
  const ready = !projects.loading || Boolean(projects.error)
  const items = ready ? projects.items : []

  return (
    <SurfaceCard>
      <SectionHeader title="最近参加的项目" />
      {items.length ? (
        <HairlineList aria-label="最近参加的项目">
          {items.map((item, index) => {
            const spot = projectSpot(item.kind, index)
            return (
              <HairlineItem
                key={item.id}
                leading={
                  <span aria-hidden="true" className={styles.projectTile}>
                    <SpotTile height={100} width={116} icon={spot.icon} palette={spot.palette} seed={index + 3} />
                  </span>
                }
                meta={<StatusBadge tone={item.live ? 'success' : 'neutral'}>{item.label}</StatusBadge>}
                summary={
                  item.progress ? (
                    <span className={styles.projectProgress}>
                      <progress
                        className={styles.projectProgressBar}
                        aria-label="已完成章节"
                        max={item.progress.total}
                        value={item.progress.done}
                      />
                      已完成 {item.progress.done} / {item.progress.total} 章
                    </span>
                  ) : (
                    item.subtitle
                  )
                }
                title={item.title}
                to={item.route}
              />
            )
          })}
        </HairlineList>
      ) : null}
      {items.length && projects.error ? (
        <p className={styles.note} role="status">
          部分项目加载失败，请稍后刷新重试。
        </p>
      ) : null}
      {items.length ? null : projects.error ? (
        <DataState error={projects.error} title="最近参加的项目加载失败" />
      ) : !ready ? (
        <DataState loading title="正在加载最近参加的项目" />
      ) : (
        <p className={styles.note}>没有最近参加的项目</p>
      )}
    </SurfaceCard>
  )
}

function PersonalDashboard({ user }: { user: ProfileUserInfoModel }) {
  const projects = useRecentProjects(user.userId)

  return (
    <>
      <HomeIdentity user={user} />
      <div className={styles.dashboard}>
        <RecentProjectsCard projects={projects} />
        <FootprintCard userId={user.userId} />
      </div>
    </>
  )
}

export function HomePage() {
  const account = useCurrentAccount()
  useVNextPageTitle('个人主页')

  return (
    <PageShell variant="wide">
      {account.user ? (
        <PersonalDashboard key={account.user.userId} user={account.user} />
      ) : account.isLoading ? (
        <DataState loading title="正在加载个人主页" />
      ) : (
        <HomeIdentity />
      )}
    </PageShell>
  )
}
