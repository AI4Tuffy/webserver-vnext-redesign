import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VNextThemeProvider } from '../VNextThemeProvider'
import { PlatformShell } from './PlatformShell'

const { account, member } = vi.hoisted(() => {
  const member = { userName: 'demo-admin' }
  return { account: { isAdmin: false, user: member as typeof member | undefined }, member }
})

vi.mock('../../features/account/useCurrentAccount', () => ({
  roleLabel: () => '管理员',
  useAccountLogout: () => vi.fn(),
  useCurrentAccount: () => account,
}))

vi.mock('@Hooks/useConfig', () => ({ useConfig: () => ({ config: {} }) }))

const { notices } = vi.hoisted(() => ({
  notices: {
    data: [
      { id: 'welcome', title: '欢迎体验本地演示', summary: '演示', isPinned: true, time: 2000 },
      { id: 'older', title: '星图研习班开放学习', summary: '课程', isPinned: false, time: 1000 },
    ],
    error: undefined,
  },
}))

vi.mock('../../features/posts/postsApi', () => ({ useLatestPosts: () => notices }))

function renderNavigation(pathname: string, isAdmin: boolean) {
  account.isAdmin = isAdmin
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <VNextThemeProvider>
        <PlatformShell />
      </VNextThemeProvider>
    </MemoryRouter>
  )
  return within(screen.getByRole('navigation', { name: '主要模块' }))
}

describe('PlatformShell navigation', () => {
  beforeEach(() => {
    account.user = member
    window.localStorage.clear()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('makes the homepage the first and current module at the root route', () => {
    const nav = renderNavigation('/', false)
    const home = nav.getByRole('link', { name: '首页' })

    expect(nav.getAllByRole('link')[0]).toBe(home)
    expect(home).toHaveAttribute('href', '/')
    expect(home).toHaveAttribute('aria-current', 'page')
  })

  it.each(['/settings/security', '/users/me'])('keeps 首页 current on its sub-page %s', (pathname) => {
    const nav = renderNavigation(pathname, false)
    const current = nav.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')

    expect(current).toEqual([nav.getByRole('link', { name: '首页' })])
  })

  it('does not treat another user profile as part of 首页', () => {
    const nav = renderNavigation('/users/22222222-2222-4222-8222-222222222222', false)

    expect(nav.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toEqual([])
    expect(screen.queryByRole('navigation', { name: '返回上级页面' })).not.toBeInTheDocument()
  })

  it.each(['/settings/security', '/users/me'])('puts a back-to-首页 link on the sub-page %s', (pathname) => {
    renderNavigation(pathname, false)
    const back = within(screen.getByRole('navigation', { name: '返回上级页面' })).getByRole('link', { name: '返回首页' })

    expect(back).toHaveAttribute('href', '/')
  })

  it('shows no back link on the homepage itself', () => {
    renderNavigation('/', false)

    expect(screen.queryByRole('navigation', { name: '返回上级页面' })).not.toBeInTheDocument()
  })

  it('lists only user modules for non-admin accounts and highlights an announcement deep link', () => {
    const nav = renderNavigation('/posts/1', false)

    expect(nav.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/games',
      '/practice',
      '/training',
      '/teams',
      '/posts',
    ])
    expect(nav.getByRole('link', { name: '公告' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: '首页' })).not.toHaveAttribute('aria-current')
    expect(nav.queryByRole('button', { name: /全部/ })).not.toBeInTheDocument()
  })

  it('puts one management entry in the shared rail and keeps it active on a management deep link', () => {
    const nav = renderNavigation('/admin/teamlab/environments/demo-campus', true)
    const links = nav.getAllByRole('link')
    const managementLink = nav.getByRole('link', { name: '管理' })

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/games',
      '/practice',
      '/training',
      '/teams',
      '/posts',
      '/admin',
    ])
    expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toEqual([managementLink])
    expect(nav.getByRole('link', { name: '首页' }).parentElement).toContainElement(managementLink)
    expect(nav.queryByRole('button', { name: /全部/ })).not.toBeInTheDocument()
  })

  it('reveals account destinations and returns focus to the avatar on Escape', async () => {
    const user = userEvent.setup()
    renderNavigation('/', true)
    const trigger = screen.getByRole('button', { name: '个人菜单' })
    expect(trigger).not.toHaveTextContent(member.userName)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: '个人档案' })).not.toBeInTheDocument()

    trigger.focus()
    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(member.userName)).toBeVisible()
    const profile = screen.getByRole('link', { name: '个人档案' })
    expect(profile).toHaveAttribute('href', '/users/me')
    expect(screen.getByRole('link', { name: '账户设置' })).toHaveAttribute('href', '/settings/security')

    await user.tab()
    expect(profile).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows unread announcements on the bell and marks them read when opened', async () => {
    const user = userEvent.setup()
    renderNavigation('/', false)
    const bell = screen.getByRole('button', { name: '通知，2 条未读公告' })

    await user.click(bell)
    expect(bell).toHaveAttribute('aria-expanded', 'true')
    expect(bell).toHaveAccessibleName('通知')
    expect(screen.getByText('2 条新公告')).toBeVisible()
    expect(screen.getByRole('link', { name: /欢迎体验本地演示/ })).toHaveAttribute('href', '/posts/welcome')
    expect(screen.getByRole('link', { name: '查看全部公告' })).toHaveAttribute('href', '/posts')
    expect(window.localStorage.getItem('yinyu-vnext-notices-seen-at')).toBe('2000')

    await user.keyboard('{Escape}')
    expect(bell).toHaveFocus()
    expect(bell).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens a login link for a signed-out user and dismisses on an outside click', async () => {
    const user = userEvent.setup()
    account.user = undefined
    const nav = renderNavigation('/', false)
    const trigger = screen.getByRole('button', { name: '个人菜单' })

    await user.click(trigger)
    expect(screen.getByRole('link', { name: '登录平台' })).toHaveAttribute('href', '/account/login')
    expect(screen.queryByRole('link', { name: '账户设置' })).not.toBeInTheDocument()
    await user.click(nav.getByRole('link', { name: '首页' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
