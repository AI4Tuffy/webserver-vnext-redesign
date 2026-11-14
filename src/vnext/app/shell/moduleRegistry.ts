export interface PlatformModule {
  id: string
  label: string
  shortLabel: string
  route: string
  description: string
  implemented?: boolean
  adminOnly?: boolean
}

export const managementModule: PlatformModule = {
  id: 'admin',
  label: '平台管理',
  shortLabel: '管理',
  route: '/admin',
  description: '赛事、用户、节点和系统配置',
  adminOnly: true,
  implemented: true,
}

export const platformModules: PlatformModule[] = [
  {
    id: 'home',
    label: '平台首页',
    shortLabel: '首页',
    route: '/',
    description: '赛事、课程、通知与继续进行',
    implemented: true,
  },
  {
    id: 'games',
    label: '赛事中心',
    shortLabel: '赛事',
    route: '/games',
    description: '浏览、筛选与进入安全演练赛事',
    implemented: true,
  },
  {
    id: 'practice',
    label: '自主练习',
    shortLabel: '练习',
    route: '/practice',
    description: '题库训练、专题练习与复盘',
    implemented: true,
  },
  {
    id: 'training',
    label: '培训课程',
    shortLabel: '培训',
    route: '/training',
    description: '课程、章节、实验与理论作业',
    implemented: true,
  },
  {
    id: 'teams',
    label: '战队协作',
    shortLabel: '战队',
    route: '/teams',
    description: '队伍成员、邀请和参赛关系',
    implemented: true,
  },
  {
    id: 'posts',
    label: '平台公告',
    shortLabel: '公告',
    route: '/posts',
    description: '平台通知与公告详情',
    implemented: true,
  },
  {
    id: 'theory',
    label: '理论题库',
    shortLabel: '理论',
    route: '/admin/theory-bank',
    description: '理论题目、试卷与考试管理',
    adminOnly: true,
    implemented: true,
  },
  {
    id: 'images',
    label: '环境模板',
    shortLabel: '镜像',
    route: '/admin/images',
    description: '镜像、虚拟机模板与分发状态',
    adminOnly: true,
    implemented: true,
  },
  {
    id: 'teamlab',
    label: '组网环境',
    shortLabel: '组网',
    route: '/admin/teamlab',
    description: '多节点拓扑、运行环境与流量观测',
    adminOnly: true,
    implemented: true,
  },
  managementModule,
]

export const publicModules = platformModules.filter((module) => !module.adminOnly)

export function isModuleActive(pathname: string, route: string) {
  if (route === '/') return pathname === '/'
  return pathname === route || pathname.startsWith(`${route}/`)
}

/**
 * 首页分区：首页本身、账户设置（/settings/*）与本人的个人档案（/users/me 或本人 id）。
 * 顶栏在这些页面高亮「首页」；他人的个人档案不属于首页。
 */
export function isHomeSection(pathname: string, ownUserId?: string | null) {
  if (pathname === '/') return true
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return true
  const profile = /^\/users\/([^/]+)\/?$/.exec(pathname)?.[1]?.toLowerCase()
  return profile === 'me' || Boolean(ownUserId && profile === ownUserId.toLowerCase())
}

export interface ParentRoute {
  to: string
  label: string
}

/**
 * 二级页面的上级页面。顶栏在内容区左上角的固定位置渲染返回入口，
 * 新的二级页面在这里登记即可，不在页面内各自放返回链接。
 */
/**
 * 二级页面的上级入口，按顺序匹配，先命中者生效。壳层在页面左上角统一渲染「返回…」，
 * 页面内不再各自放置返回链接。管理后台使用自己的工作台布局，不在此登记。
 */
const parentRules: ReadonlyArray<readonly [RegExp, (match: RegExpMatchArray) => ParentRoute]> = [
  [/^\/games\/\d+\/?$/, () => ({ to: '/games', label: '返回赛事中心' })],
  [/^\/games\/(\d+)\/[^/]+/, ([, game]) => ({ to: `/games/${game}`, label: '返回赛事详情' })],
  [/^\/posts\/[^/]+\/?$/, () => ({ to: '/posts', label: '返回公告列表' })],
  [/^\/practice\/(?:challenge\/[^/]+|stats)\/?$/, () => ({ to: '/practice', label: '返回题库' })],
  [/^\/training\/courses\/new\/?$/, () => ({ to: '/training', label: '返回培训' })],
  [
    /^\/training\/courses\/([^/]+)\/edit\/?$/,
    ([, course]) => ({ to: `/training/courses/${course}`, label: '返回课程详情' }),
  ],
  [
    /^\/training\/courses\/([^/]+)\/chapters\/(?:new|[^/]+\/edit)\/?$/,
    ([, course]) => ({ to: `/training/courses/${course}?tab=chapters`, label: '返回课程章节' }),
  ],
  [
    /^\/training\/courses\/([^/]+)\/challenges\/(?:new|[^/]+\/edit)\/?$/,
    ([, course]) => ({ to: `/training/courses/${course}?tab=challenges`, label: '返回题目管理' }),
  ],
  [
    /^\/training\/courses\/([^/]+)\/chapters\/[^/]+\/theory-edit\/?$/,
    ([, course]) => ({ to: `/training/courses/${course}?tab=homework`, label: '返回课后练习' }),
  ],
  [
    /^\/training\/courses\/([^/]+)\/chapters\/([^/]+)\/theory\/?$/,
    ([, course, chapter]) => ({ to: `/training/courses/${course}/chapters/${chapter}`, label: '返回章节' }),
  ],
  [
    /^\/training\/courses\/([^/]+)\/chapters\/[^/]+\/?$/,
    ([, course]) => ({ to: `/training/courses/${course}`, label: '返回课程' }),
  ],
  [/^\/training\/courses\/[^/]+\/?$/, () => ({ to: '/training', label: '返回培训' })],
]

export function parentRouteFor(pathname: string, ownUserId?: string | null): ParentRoute | null {
  if (pathname !== '/' && isHomeSection(pathname, ownUserId)) return { to: '/', label: '返回首页' }
  for (const [pattern, resolve] of parentRules) {
    const match = pathname.match(pattern)
    if (match) return resolve(match)
  }
  return null
}

export function currentModule(pathname: string) {
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return { ...platformModules[0], label: '账户设置', implemented: true }
  }
  if (pathname.startsWith('/users/')) {
    return { ...platformModules[0], label: '个人主页', implemented: true }
  }
  if (pathname.startsWith('/account/')) {
    return { ...platformModules[0], label: '账户访问', implemented: false }
  }
  return (
    [...platformModules]
      .sort((left, right) => right.route.length - left.route.length)
      .find((module) => isModuleActive(pathname, module.route)) ?? platformModules[0]
  )
}
