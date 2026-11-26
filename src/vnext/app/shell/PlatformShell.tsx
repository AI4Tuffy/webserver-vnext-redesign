import { ArrowLeft, Bell, LogIn, LogOut, Megaphone, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { getPlatformName } from '@Utils/Brand'
import { useConfig } from '@Hooks/useConfig'
import { roleLabel, useAccountLogout, useCurrentAccount } from '../../features/account/useCurrentAccount'
import {
  latestNoticeTime,
  readNoticeSeenAt,
  unreadNoticeCount,
  writeNoticeSeenAt,
} from '../../features/posts/noticeSeen'
import { useLatestPosts } from '../../features/posts/postsApi'
import { ActionButton, ActionLink, VNextConfirmDialog } from '../../shared/Interaction'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
import { IconButton } from '../../shared/Toolbar'
import { ToolbarDisclosure, ToolbarDisclosureGroup } from '../../shared/ToolbarDisclosure'
import { useVNextTheme } from '../VNextThemeProvider'
import styles from './PlatformShell.module.css'
import { isHomeSection, managementModule, parentRouteFor, publicModules } from './moduleRegistry'

function initials(name?: string | null) {
  const normalized = name?.trim()
  if (!normalized) return 'YY'
  return normalized.slice(0, 2).toUpperCase()
}

function AccountMenu({ user }: { user: ReturnType<typeof useCurrentAccount>['user'] }) {
  const logout = useAccountLogout()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const displayName = user?.userName || '当前用户'

  return (
    <>
      <ToolbarDisclosure
        label="个人菜单"
        heading={user ? displayName : undefined}
        detail={user ? roleLabel(user.role) : undefined}
        icon={
          <span aria-hidden="true" className={styles.avatar}>
            {user?.avatar ? (
              <img alt="" className={styles.avatarImage} src={user.avatar} />
            ) : user ? (
              initials(displayName)
            ) : (
              <UserRound size={16} />
            )}
          </span>
        }
      >
        {(close) =>
          user ? (
            <>
              <ActionLink
                className={styles.menuAction}
                icon={<UserRound size={17} />}
                onClick={close}
                to="/users/me"
                tone="ghost"
              >
                个人档案
              </ActionLink>
              <ActionLink
                className={styles.menuAction}
                icon={<Settings size={17} />}
                onClick={close}
                to="/settings/security"
                tone="ghost"
              >
                账户设置
              </ActionLink>
              <ActionButton
                className={styles.menuAction}
                icon={<LogOut size={17} />}
                onClick={() => {
                  close()
                  setLogoutConfirmOpen(true)
                }}
                tone="danger"
                type="button"
              >
                退出登录
              </ActionButton>
            </>
          ) : (
            <ActionLink
              className={styles.menuAction}
              icon={<LogIn size={17} />}
              onClick={close}
              to="/account/login"
              tone="ghost"
            >
              登录平台
            </ActionLink>
          )
        }
      </ToolbarDisclosure>
      <VNextConfirmDialog
        confirmLabel="退出登录"
        message="当前会话和本地缓存将被清除，需要重新登录才能继续访问受限功能。"
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
        open={logoutConfirmOpen}
        title="确认退出当前账户？"
      />
    </>
  )
}

const NOTICE_LIMIT = 5
const noticeDateFormatter = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })

/** 顶栏通知：最新公告的未读提示与列表；打开列表或进入公告页即视为已读。 */
function NoticeMenu() {
  const location = useLocation()
  const [seenAt, setSeenAt] = useState(readNoticeSeenAt)
  const [highlightAfter, setHighlightAfter] = useState(seenAt)
  const { data: posts, error } = useLatestPosts()
  const unread = unreadNoticeCount(posts, seenAt)
  const items = (posts ?? []).slice(0, NOTICE_LIMIT)
  const fresh = items.filter((post) => post.time > highlightAfter).length

  const markSeen = useCallback(() => {
    const latest = latestNoticeTime(posts)
    if (latest <= seenAt) return
    writeNoticeSeenAt(latest)
    setSeenAt(latest)
  }, [posts, seenAt])

  useEffect(() => {
    if (location.pathname === '/posts' || location.pathname.startsWith('/posts/')) markSeen()
  }, [location.pathname, markSeen])

  return (
    <ToolbarDisclosure
      detail={fresh ? `${fresh} 条新公告` : '最新公告'}
      heading="通知"
      icon={<Bell aria-hidden="true" size={17} />}
      indicator={unread > 0}
      label={unread ? `通知，${unread} 条未读公告` : '通知'}
      onOpen={() => {
        setHighlightAfter(seenAt)
        markSeen()
      }}
      wide
    >
      {(close) => (
        <>
          {items.length ? (
            <ul className={styles.noticeList}>
              {items.map((post) => (
                <li key={post.id}>
                  <ActionLink className={styles.menuAction} onClick={close} to={`/posts/${post.id}`} tone="ghost">
                    <span className={styles.noticeTitle} data-fresh={post.time > highlightAfter || undefined}>
                      {post.title}
                    </span>
                    <time className={styles.date} dateTime={new Date(post.time).toISOString()}>
                      {noticeDateFormatter.format(post.time)}
                    </time>
                  </ActionLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noticeEmpty}>{error ? '公告暂时无法加载' : posts ? '暂无公告' : '正在加载公告'}</p>
          )}
          <ActionLink
            className={styles.menuAction}
            icon={<Megaphone size={17} />}
            onClick={close}
            to="/posts"
            tone="ghost"
          >
            查看全部公告
          </ActionLink>
        </>
      )}
    </ToolbarDisclosure>
  )
}

export function PlatformShell() {
  const location = useLocation()
  const { config } = useConfig()
  const { theme, toggleTheme } = useVNextTheme()
  const { user, isAdmin } = useCurrentAccount()
  // 赛事工作区与账户设置在内部切换子路由时保持同一页面，让切换控件的选中块可以滑动。
  const routeFrameKey = location.pathname.match(/^\/games\/\d+(?=\/)|^\/settings(?=\/|$)/)?.[0] ?? location.pathname
  const platformName = getPlatformName(config.title)
  const homeActive = isHomeSection(location.pathname, user?.userId)
  const parentRoute = parentRouteFor(location.pathname, user?.userId)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#yn-main">
        跳到主要内容
      </a>
      <header className={styles.topBar}>
        <Link aria-label={`${platformName} 首页`} className={styles.wordmark} to="/">
          <strong className={styles.brandName}>{platformName}</strong>
          <span aria-hidden="true" className={styles.brandSuffix}>
            /ctf
          </span>
        </Link>

        <SegmentedControl activeKey={location.pathname} aria-label="主要模块" as="nav" className={styles.primaryNav}>
          {publicModules.map((module) =>
            module.id === 'home' ? (
              <Link
                aria-current={homeActive ? 'page' : undefined}
                className={segmentedItemClassName}
                key={module.id}
                to="/"
              >
                {module.shortLabel}
              </Link>
            ) : (
              <NavLink className={segmentedItemClassName} key={module.id} to={module.route}>
                {module.shortLabel}
              </NavLink>
            )
          )}
          {isAdmin ? (
            <NavLink className={segmentedItemClassName} to={managementModule.route}>
              {managementModule.shortLabel}
            </NavLink>
          ) : null}
        </SegmentedControl>
        <ToolbarDisclosureGroup className={styles.accountTools}>
          <IconButton
            label={theme === 'light' ? '切换夜间主题' : '切换日间主题'}
            tone="ghost"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </IconButton>
          <NoticeMenu />
          <AccountMenu user={user} />
        </ToolbarDisclosureGroup>
      </header>

      <main className={styles.main} id="yn-main" tabIndex={-1}>
        <div className={styles.routeFrame} key={routeFrameKey}>
          {parentRoute ? (
            <nav aria-label="返回上级页面" className={styles.backBar}>
              <ActionLink icon={<ArrowLeft aria-hidden="true" size={16} />} shape="pill" size="sm" to={parentRoute.to}>
                {parentRoute.label}
              </ActionLink>
            </nav>
          ) : null}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
