import { ArrowLeft, Bell, LogIn, LogOut, Megaphone, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { getPlatformName } from '@Utils/Brand'
import { useConfig } from '@Hooks/useConfig'
import { roleLabel, useAccountLogout, useCurrentAccount } from '../../features/account/useCurrentAccount'
import { latestNoticeTime, readNoticeSeenAt, unreadNoticeCount, writeNoticeSeenAt } from '../../features/posts/noticeSeen'
import { useLatestPosts } from '../../features/posts/postsApi'
import { VNextConfirmDialog } from '../../shared/Interaction'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
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
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const displayName = user?.userName || '当前用户'

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const dismissMenu = () => {
    triggerRef.current?.focus()
    setOpen(false)
  }

  return (
    <>
      <div
        className={styles.accountMenuRoot}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        }}
        onKeyDown={(event) => {
          if (!open || event.key !== 'Escape') return
          event.stopPropagation()
          dismissMenu()
        }}
        ref={rootRef}
      >
        <button
          aria-controls={menuId}
          aria-expanded={open}
          aria-label="个人菜单"
          className={styles.accountTrigger}
          onClick={() => setOpen((expanded) => !expanded)}
          ref={triggerRef}
          type="button"
        >
          <span aria-hidden="true" className={styles.avatar}>
            {user?.avatar ? <img alt="" src={user.avatar} /> : user ? initials(displayName) : <UserRound size={16} />}
          </span>
        </button>
        <div className={styles.accountMenu} hidden={!open} id={menuId}>
          {user ? (
            <>
              <div className={styles.accountIdentity}>
                <strong>{displayName}</strong>
                <span>{roleLabel(user.role)}</span>
              </div>
              <Link className={styles.accountAction} onClick={() => setOpen(false)} to="/users/me">
                <UserRound aria-hidden="true" size={17} />
                个人档案
              </Link>
              <Link className={styles.accountAction} onClick={() => setOpen(false)} to="/settings/security">
                <Settings aria-hidden="true" size={17} />
                账户设置
              </Link>
              <div className={styles.accountMenuFooter}>
                <button
                  className={`${styles.accountAction} ${styles.accountLogout}`}
                  onClick={() => {
                    dismissMenu()
                    setLogoutConfirmOpen(true)
                  }}
                  type="button"
                >
                  <LogOut aria-hidden="true" size={17} />
                  退出登录
                </button>
              </div>
            </>
          ) : (
            <Link className={styles.accountAction} onClick={() => setOpen(false)} to="/account/login">
              <LogIn aria-hidden="true" size={17} />
              登录平台
            </Link>
          )}
        </div>
      </div>
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
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const toggle = () => {
    if (!open) {
      setHighlightAfter(seenAt)
      markSeen()
    }
    setOpen(!open)
  }

  return (
    <div
      className={styles.accountMenuRoot}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return
        event.stopPropagation()
        triggerRef.current?.focus()
        setOpen(false)
      }}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-label={unread ? `通知，${unread} 条未读公告` : '通知'}
        className={styles.toolButton}
        onClick={toggle}
        ref={triggerRef}
        type="button"
      >
        <Bell aria-hidden="true" size={17} />
        {unread ? <span aria-hidden="true" className={styles.noticeDot} /> : null}
      </button>
      <div className={`${styles.accountMenu} ${styles.noticeMenu}`} hidden={!open} id={menuId}>
        <div className={styles.noticeHeader}>
          <strong>通知</strong>
          <span>{fresh ? `${fresh} 条新公告` : '最新公告'}</span>
        </div>
        {items.length ? (
          <ul className={styles.noticeList}>
            {items.map((post) => (
              <li key={post.id}>
                <Link
                  className={styles.noticeItem}
                  data-fresh={post.time > highlightAfter ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                  to={`/posts/${post.id}`}
                >
                  <span className={styles.noticeTitle}>{post.title}</span>
                  <time dateTime={new Date(post.time).toISOString()}>{noticeDateFormatter.format(post.time)}</time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noticeEmpty}>{error ? '公告暂时无法加载' : posts ? '暂无公告' : '正在加载公告'}</p>
        )}
        <div className={styles.accountMenuFooter}>
          <Link className={styles.accountAction} onClick={() => setOpen(false)} to="/posts">
            <Megaphone aria-hidden="true" size={17} />
            查看全部公告
          </Link>
        </div>
      </div>
    </div>
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
          <strong>{platformName}</strong>
          <span aria-hidden="true">/ctf</span>
        </Link>

        <div className={styles.headerControls}>
          <SegmentedControl
            activeKey={location.pathname}
            aria-label="主要模块"
            as="nav"
            className={styles.primaryNav}
          >
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
          <div className={styles.accountTools}>
            <button
              aria-label={theme === 'light' ? '切换夜间主题' : '切换日间主题'}
              className={styles.toolButton}
              onClick={toggleTheme}
              type="button"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <NoticeMenu />
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <main className={styles.main} id="yn-main">
        <div className={styles.routeFrame} key={routeFrameKey}>
          {parentRoute ? (
            <nav aria-label="返回上级页面" className={styles.backBar}>
              <Link className={styles.backLink} to={parentRoute.to}>
                <ArrowLeft aria-hidden="true" size={16} />
                {parentRoute.label}
              </Link>
            </nav>
          ) : null}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
